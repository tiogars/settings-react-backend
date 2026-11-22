import { describe, expect, it } from 'vitest'
import type { Application, Environment, SettingSet } from '../types'
import { normalize, parseQuery, searchAll, type SearchSources } from './search'

const app: Application = {
  id: 'app-1',
  code: 'billing',
  name: 'Facturation Électronique',
  description: 'Facturation des commandes',
  owner: 'Équipe Paiement',
  status: 'ACTIVE',
  favorite: false,
  updatedAt: '2026-01-01T00:00:00.000Z',
}

const env: Environment = {
  id: 'env-1',
  appId: 'app-1',
  code: 'prod',
  label: 'Production',
  rank: 1,
  protected: true,
  color: '#c62828',
}

const set: SettingSet = {
  id: 'set-1',
  appId: 'app-1',
  envCode: 'prod',
  componentId: null,
  family: 'database',
  version: 1,
  publishedValues: { host: 'db.example.com', password: 'super-secret-value' },
  draftValues: null,
  publishedItems: null,
  draftItems: null,
  updatedAt: '2026-01-01T00:00:00.000Z',
  updatedBy: 'alice',
}

const sources: SearchSources = {
  applications: [app],
  components: [],
  environments: [env],
  sets: [set],
  clients: [],
}

describe('normalize', () => {
  it('est insensible à la casse et aux accents', () => {
    expect(normalize('Électronique')).toBe('electronique')
  })
})

describe('parseQuery', () => {
  it('extrait les préfixes env:, app:, famille: et secret:', () => {
    const parsed = parseQuery('hote env:prod app:billing famille:database secret:oui')
    expect(parsed).toEqual({
      terms: ['hote'],
      env: 'prod',
      app: 'billing',
      family: 'database',
      secret: true,
    })
  })
})

describe('searchAll', () => {
  it('trouve une application malgré les accents', () => {
    const results = searchAll(sources, 'electronique')
    expect(results.some((r) => r.type === 'Application' && r.label === app.name)).toBe(true)
  })

  it('filtre par environnement avec env:', () => {
    expect(searchAll(sources, 'facturation env:dev')).toHaveLength(0)
    expect(searchAll(sources, 'facturation env:prod').length).toBeGreaterThan(0)
  })

  it("n'indexe jamais la valeur d'un secret", () => {
    expect(searchAll(sources, 'super-secret-value')).toHaveLength(0)
    // La clé du secret reste trouvable, sa valeur est absente du résultat.
    const byKey = searchAll(sources, 'password famille:database')
    expect(byKey.length).toBeGreaterThan(0)
    expect(byKey.every((r) => !r.sublabel.includes('super-secret-value'))).toBe(true)
  })
})
