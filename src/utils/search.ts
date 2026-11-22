import { familyLabel } from '../data/families'
import type {
  ApiClient,
  AppComponent,
  Application,
  Environment,
  SettingSet,
} from '../types'

/**
 * Recherche globale — voir `settings/docs/recherches.md`.
 * Insensible à la casse et aux accents ; syntaxe `env:`, `app:`, `famille:`, `secret:oui`.
 * Les valeurs des secrets ne sont jamais indexées.
 */

export type ResultType =
  | 'Application'
  | 'Composant'
  | 'Paramètre'
  | 'Environnement'
  | 'Client API'

export interface SearchResult {
  id: string
  type: ResultType
  label: string
  sublabel: string
  link: string
  appCode: string | null
  envCode: string | null
}

export interface SearchSources {
  applications: Application[]
  components: AppComponent[]
  environments: Environment[]
  sets: SettingSet[]
  clients: ApiClient[]
}

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

interface ParsedQuery {
  terms: string[]
  env: string | null
  app: string | null
  family: string | null
  secret: boolean | null
}

export function parseQuery(raw: string): ParsedQuery {
  const parsed: ParsedQuery = { terms: [], env: null, app: null, family: null, secret: null }
  for (const token of raw.trim().split(/\s+/).filter(Boolean)) {
    const [prefix, ...rest] = token.split(':')
    const value = rest.join(':')
    if (rest.length > 0 && value) {
      const p = normalize(prefix)
      if (p === 'env') { parsed.env = normalize(value); continue }
      if (p === 'app') { parsed.app = normalize(value); continue }
      if (p === 'famille' || p === 'family') { parsed.family = normalize(value); continue }
      if (p === 'secret') { parsed.secret = normalize(value) === 'oui'; continue }
    }
    parsed.terms.push(normalize(token))
  }
  return parsed
}

function matches(haystack: string, terms: string[]): boolean {
  const normalized = normalize(haystack)
  return terms.every((t) => normalized.includes(t))
}

export function searchAll(sources: SearchSources, rawQuery: string): SearchResult[] {
  const query = parseQuery(rawQuery)
  if (query.terms.length === 0 && !query.env && !query.app && !query.family && query.secret === null) {
    return []
  }
  const results: SearchResult[] = []
  const appById = new Map(sources.applications.map((a) => [a.id, a]))

  if (!query.family && query.secret === null) {
    for (const app of sources.applications) {
      if (query.app && !normalize(app.code).includes(query.app)) continue
      if (query.env && !sources.environments.some((e) => e.appId === app.id && normalize(e.code) === query.env)) continue
      if (!matches(`${app.code} ${app.name} ${app.description} ${app.owner}`, query.terms)) continue
      results.push({
        id: `app-${app.id}`, type: 'Application', label: app.name,
        sublabel: `${app.code} — ${app.owner}`, link: `/applications/${app.id}`,
        appCode: app.code, envCode: null,
      })
    }
    for (const cmp of sources.components) {
      const app = appById.get(cmp.appId)
      if (!app) continue
      if (query.app && !normalize(app.code).includes(query.app)) continue
      if (!matches(`${cmp.code} ${cmp.name} ${cmp.description} ${cmp.type}`, query.terms)) continue
      results.push({
        id: `cmp-${cmp.id}`, type: 'Composant', label: cmp.name,
        sublabel: `${cmp.code} (${cmp.type}) — ${app.code}`, link: `/applications/${cmp.appId}?tab=composants`,
        appCode: app.code, envCode: null,
      })
    }
    for (const env of sources.environments) {
      const app = appById.get(env.appId)
      if (!app) continue
      if (query.app && !normalize(app.code).includes(query.app)) continue
      if (query.env && normalize(env.code) !== query.env) continue
      if (!matches(`${env.code} ${env.label}`, query.terms)) continue
      results.push({
        id: `env-${env.id}`, type: 'Environnement', label: `${env.label} (${env.code})`,
        sublabel: app.code, link: `/applications/${env.appId}?tab=environnements`,
        appCode: app.code, envCode: env.code,
      })
    }
    for (const client of sources.clients) {
      const app = appById.get(client.appId)
      if (query.app && app && !normalize(app.code).includes(query.app)) continue
      if (query.env && normalize(client.envCode) !== query.env) continue
      if (!matches(`${client.clientId} ${client.name} ${client.description}`, query.terms)) continue
      results.push({
        id: `cli-${client.id}`, type: 'Client API', label: client.name,
        sublabel: `${client.clientId} — ${app?.code ?? '?'} / ${client.envCode}`, link: '/clients',
        appCode: app?.code ?? null, envCode: client.envCode,
      })
    }
  }

  for (const set of sources.sets) {
    const app = appById.get(set.appId)
    if (!app) continue
    if (query.app && !normalize(app.code).includes(query.app)) continue
    if (query.env && normalize(set.envCode) !== query.env) continue
    if (query.family && !normalize(set.family).includes(query.family) && !normalize(familyLabel(set.family)).includes(query.family)) continue
    const link = `/applications/${set.appId}/settings/${set.envCode}?famille=${set.family}`
    if (set.publishedValues) {
      for (const [key, value] of Object.entries(set.publishedValues)) {
        const isSecret = key.toLowerCase().includes('password') || key.toLowerCase().includes('secret') || key.toLowerCase().includes('token')
        if (query.secret !== null && query.secret !== isSecret) continue
        const searchable = isSecret ? key : `${key} ${String(value)}`
        if (!matches(`${searchable} ${familyLabel(set.family)}`, query.terms)) continue
        results.push({
          id: `param-${set.id}-${key}`, type: 'Paramètre', label: key,
          sublabel: `${familyLabel(set.family)} — ${app.code} / ${set.envCode}${isSecret ? '' : ` = ${String(value)}`}`,
          link, appCode: app.code, envCode: set.envCode,
        })
      }
    }
    if (set.publishedItems) {
      for (const item of set.publishedItems) {
        if (query.secret !== null && query.secret !== item.secret) continue
        const searchable = item.secret
          ? `${item.category} ${item.key} ${item.description}`
          : `${item.category} ${item.key} ${item.value} ${item.description}`
        if (!matches(searchable, query.terms)) continue
        results.push({
          id: `kv-${set.id}-${item.id}`, type: 'Paramètre', label: `${item.category} / ${item.key}`,
          sublabel: `Key/Value — ${app.code} / ${set.envCode}${item.secret ? '' : ` = ${item.value}`}`,
          link, appCode: app.code, envCode: set.envCode,
        })
      }
    }
  }

  return results.slice(0, 100)
}
