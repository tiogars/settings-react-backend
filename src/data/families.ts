import type { FieldValue } from '../types'

/**
 * Schémas des 17 familles de paramètres — voir `settings/docs/parametrage.md`.
 * Les formulaires de l'éditeur (E06) sont générés à partir de ces définitions.
 */

export type FieldType =
  | 'text'
  | 'textarea'
  | 'int'
  | 'bool'
  | 'url'
  | 'select'
  | 'multiselect'
  | 'secret'
  | 'tags'

export interface FieldDef {
  name: string
  label: string
  type: FieldType
  required?: boolean
  options?: string[]
  min?: number
  max?: number
  help?: string
  defaultValue?: FieldValue
}

export interface FamilyDef {
  id: string
  label: string
  description: string
  /** La famille Key/Value utilise une grille éditable dédiée (E07). */
  keyValue?: boolean
  fields: FieldDef[]
}

export const FAMILIES: FamilyDef[] = [
  {
    id: 'database',
    label: 'Database',
    description: 'Connexion aux bases de données',
    fields: [
      { name: 'type', label: 'Type', type: 'select', required: true, options: ['PostgreSQL', 'MySQL', 'Oracle', 'SQL Server', 'MariaDB'] },
      { name: 'host', label: 'Hôte', type: 'text', required: true, help: "Nom d'hôte ou IP" },
      { name: 'port', label: 'Port', type: 'int', required: true, min: 1, max: 65535, defaultValue: 5432 },
      { name: 'databaseName', label: 'Base / Schéma', type: 'text', required: true },
      { name: 'username', label: 'Utilisateur', type: 'text', required: true },
      { name: 'password', label: 'Mot de passe', type: 'secret', required: true },
      { name: 'poolMin', label: 'Pool min', type: 'int', min: 0, defaultValue: 2 },
      { name: 'poolMax', label: 'Pool max', type: 'int', min: 1, defaultValue: 10 },
      { name: 'timeoutMs', label: 'Timeout (ms)', type: 'int', min: 1, defaultValue: 5000 },
      { name: 'ssl', label: 'SSL', type: 'select', options: ['disable', 'require', 'verify-full'], defaultValue: 'require' },
    ],
  },
  {
    id: 'logs',
    label: 'Logs',
    description: 'Journalisation',
    fields: [
      { name: 'level', label: 'Niveau global', type: 'select', required: true, options: ['TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR'], defaultValue: 'INFO' },
      { name: 'packageLevels', label: 'Niveaux par package', type: 'tags', help: 'format package=NIVEAU' },
      { name: 'format', label: 'Format', type: 'select', options: ['texte', 'JSON'], defaultValue: 'JSON' },
      { name: 'appenders', label: 'Destinations', type: 'multiselect', options: ['console', 'fichier', 'syslog', 'collecteur'] },
      { name: 'retentionDays', label: 'Rétention (jours)', type: 'int', min: 1, defaultValue: 30 },
    ],
  },
  {
    id: 'authentication',
    label: 'Authentication',
    description: 'Authentification',
    fields: [
      { name: 'provider', label: 'Fournisseur', type: 'select', required: true, options: ['OIDC', 'SAML', 'LDAP', 'Basic'] },
      { name: 'issuer', label: 'Issuer / URL', type: 'url', required: true },
      { name: 'clientId', label: 'Client id', type: 'text', required: true },
      { name: 'clientSecret', label: 'Client secret', type: 'secret', required: true },
      { name: 'scopes', label: 'Scopes', type: 'tags' },
      { name: 'redirectUrl', label: 'URL de redirection', type: 'url' },
      { name: 'sessionMinutes', label: 'Durée de session (min)', type: 'int', min: 5, max: 1440, defaultValue: 60 },
    ],
  },
  {
    id: 'roles',
    label: 'Rôles',
    description: 'Rôles applicatifs',
    fields: [
      { name: 'code', label: 'Code', type: 'text', required: true, help: 'majuscules, unique' },
      { name: 'libelle', label: 'Libellé', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'permissions', label: 'Permissions', type: 'multiselect', options: ['lecture', 'ecriture', 'publication', 'administration'] },
      { name: 'idpGroups', label: 'Groupes IdP associés', type: 'tags' },
    ],
  },
  {
    id: 'health',
    label: 'Health',
    description: 'Supervision de santé',
    fields: [
      { name: 'livenessPath', label: 'Chemin liveness', type: 'text', defaultValue: '/health/live', help: 'commence par /' },
      { name: 'readinessPath', label: 'Chemin readiness', type: 'text', defaultValue: '/health/ready', help: 'commence par /' },
      { name: 'checks', label: 'Vérifications', type: 'multiselect', options: ['base', 'broker', 'disque', 'cache', 'dépendances'] },
      { name: 'timeoutMs', label: 'Timeout (ms)', type: 'int', min: 1, defaultValue: 2000 },
      { name: 'intervalSeconds', label: 'Intervalle (s)', type: 'int', min: 1, defaultValue: 30 },
    ],
  },
  {
    id: 'keyvalue',
    label: 'Key/Value',
    description: 'Paramètres libres par catégorie',
    keyValue: true,
    fields: [],
  },
  {
    id: 'urls',
    label: 'URLs',
    description: 'Adresses des services',
    fields: [
      { name: 'key', label: 'Clé', type: 'text', required: true },
      { name: 'libelle', label: 'Libellé', type: 'text', required: true },
      { name: 'url', label: 'URL', type: 'url', required: true, help: 'https imposé hors développement' },
      { name: 'type', label: 'Type', type: 'select', options: ['API', 'front', 'service tiers', 'SSO', 'dépôt', 'doc'] },
    ],
  },
  {
    id: 'repository',
    label: 'Repository',
    description: 'Dépôt de code',
    fields: [
      { name: 'type', label: 'Type', type: 'select', options: ['Git', 'SVN'], defaultValue: 'Git' },
      { name: 'url', label: 'URL', type: 'url', required: true },
      { name: 'defaultBranch', label: 'Branche par défaut', type: 'text', defaultValue: 'main' },
      { name: 'artifactRepository', label: "Dépôt d'artefacts", type: 'url' },
      { name: 'token', label: "Jeton d'accès", type: 'secret' },
    ],
  },
  {
    id: 'documentation',
    label: 'Documentation',
    description: 'Liens documentaires',
    fields: [
      { name: 'docUrl', label: 'URL de la doc', type: 'url', required: true },
      { name: 'wikiUrl', label: 'Wiki', type: 'url' },
      { name: 'adrUrl', label: 'ADR', type: 'url' },
      { name: 'runbookUrl', label: 'Runbook', type: 'url' },
      { name: 'supportContacts', label: 'Contacts support', type: 'tags' },
    ],
  },
  {
    id: 'presentation',
    label: 'Présentation',
    description: 'Identité visuelle',
    fields: [
      { name: 'displayName', label: 'Nom affiché', type: 'text', required: true },
      { name: 'logoUrl', label: 'Logo', type: 'url', help: 'PNG/SVG ≤ 1 Mo' },
      { name: 'faviconUrl', label: 'Favicon', type: 'url' },
      { name: 'primaryColor', label: 'Couleur principale', type: 'text', help: 'format hexadécimal' },
      { name: 'language', label: 'Langue par défaut', type: 'select', options: ['fr', 'en', 'de', 'es'], defaultValue: 'fr' },
      { name: 'footer', label: 'Pied de page', type: 'text' },
    ],
  },
  {
    id: 'project',
    label: 'Projet',
    description: 'Métadonnées projet',
    fields: [
      { name: 'groupId', label: 'groupId', type: 'text', required: true, help: 'format Maven' },
      { name: 'artifactId', label: 'artifactId', type: 'text', required: true },
      { name: 'version', label: 'Version', type: 'text', required: true },
      { name: 'organization', label: 'Organisation', type: 'text' },
      { name: 'license', label: 'Licence', type: 'select', options: ['Apache-2.0', 'MIT', 'GPL-3.0', 'Propriétaire'] },
      { name: 'team', label: 'Équipe', type: 'text' },
    ],
  },
  {
    id: 'maven-site',
    label: 'Maven site',
    description: 'Site Maven',
    fields: [
      { name: 'publishUrl', label: 'URL de publication', type: 'url', required: true },
      { name: 'siteProfile', label: 'Profil site', type: 'text', defaultValue: 'site' },
      { name: 'reports', label: 'Rapports activés', type: 'multiselect', options: ['javadoc', 'surefire', 'jacoco', 'checkstyle', 'pmd'] },
      { name: 'deployServer', label: 'Serveur de déploiement', type: 'text' },
    ],
  },
  {
    id: 'javadoc',
    label: 'Javadoc',
    description: "Documentation d'API Java",
    fields: [
      { name: 'publishUrl', label: 'URL de publication', type: 'url', required: true },
      { name: 'externalLinks', label: 'Liens externes', type: 'tags' },
      { name: 'visibility', label: 'Visibilité', type: 'select', options: ['public', 'protected', 'package', 'private'], defaultValue: 'protected' },
      { name: 'doclint', label: 'doclint', type: 'bool', defaultValue: true },
      { name: 'encoding', label: 'Encodage', type: 'text', defaultValue: 'UTF-8' },
    ],
  },
  {
    id: 'issue-management',
    label: 'Issue management',
    description: 'Suivi des tickets',
    fields: [
      { name: 'system', label: 'Système', type: 'select', required: true, options: ['GitHub', 'Jira', 'GitLab', 'Redmine'] },
      { name: 'url', label: 'URL', type: 'url', required: true },
      { name: 'projectKey', label: 'Clé de projet', type: 'text' },
      { name: 'token', label: 'Jeton', type: 'secret' },
    ],
  },
  {
    id: 'ads',
    label: 'Ads management',
    description: 'Publicité',
    fields: [
      { name: 'provider', label: 'Fournisseur', type: 'select', options: ['Google Ads', 'Criteo', 'Autre'] },
      { name: 'publisherId', label: 'Identifiant éditeur', type: 'text' },
      { name: 'slots', label: 'Emplacements (slots)', type: 'tags' },
      { name: 'enabled', label: 'Activé', type: 'bool', defaultValue: false },
      { name: 'consentRequired', label: 'Consentement requis', type: 'bool', defaultValue: true },
    ],
  },
  {
    id: 'analytics',
    label: 'Analytics',
    description: "Mesure d'audience",
    fields: [
      { name: 'provider', label: 'Fournisseur', type: 'select', options: ['Matomo', 'Google Analytics', 'Plausible'] },
      { name: 'siteId', label: 'Identifiant de site', type: 'text' },
      { name: 'collectUrl', label: 'URL de collecte', type: 'url' },
      { name: 'anonymizeIp', label: 'IP anonymisée', type: 'bool', defaultValue: true },
      { name: 'consentRequired', label: 'Consentement requis', type: 'bool', defaultValue: true },
      { name: 'enabled', label: 'Activé', type: 'bool', defaultValue: false },
    ],
  },
  {
    id: 'metrics',
    label: 'Metrics',
    description: 'Métriques techniques',
    fields: [
      { name: 'exposition', label: 'Exposition', type: 'select', options: ['Prometheus', 'OTLP'], defaultValue: 'Prometheus' },
      { name: 'path', label: 'Chemin', type: 'text', defaultValue: '/metrics' },
      { name: 'intervalSeconds', label: 'Intervalle (s)', type: 'int', min: 1, defaultValue: 15 },
      { name: 'commonLabels', label: 'Étiquettes communes', type: 'tags' },
      { name: 'collectorUrl', label: 'URL du collecteur', type: 'url' },
    ],
  },
]

export const FAMILY_BY_ID: ReadonlyMap<string, FamilyDef> = new Map(
  FAMILIES.map((f) => [f.id, f]),
)

export function familyLabel(id: string): string {
  return FAMILY_BY_ID.get(id)?.label ?? id
}

export function familyDefaults(def: FamilyDef): Record<string, FieldValue> {
  const values: Record<string, FieldValue> = {}
  for (const field of def.fields) {
    if (field.defaultValue !== undefined) {
      values[field.name] = field.defaultValue
    } else if (field.type === 'multiselect' || field.type === 'tags') {
      values[field.name] = []
    } else if (field.type === 'bool') {
      values[field.name] = false
    } else if (field.type === 'int') {
      values[field.name] = 0
    } else {
      values[field.name] = ''
    }
  }
  return values
}
