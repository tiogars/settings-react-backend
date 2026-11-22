/** Types du domaine — voir spécifications `settings/docs/modele-donnees.md`. */

export type AppStatus = 'ACTIVE' | 'ARCHIVED'

export type ComponentType =
  | 'SERVICE'
  | 'FRONTEND'
  | 'BATCH'
  | 'DATABASE'
  | 'LIBRARY'
  | 'AUTRE'

export type SettingType = 'STRING' | 'INT' | 'BOOL' | 'URL' | 'JSON' | 'SECRET'

export type SetStatus = 'BROUILLON' | 'PUBLIE'

export type Role = 'ADMIN' | 'AUDITOR'

export interface User {
  name: string
  email: string
  role: Role
  demo: boolean
}

export interface Application {
  id: string
  code: string
  name: string
  description: string
  owner: string
  status: AppStatus
  favorite: boolean
  updatedAt: string
}

export interface AppComponent {
  id: string
  appId: string
  code: string
  type: ComponentType
  name: string
  description: string
  repositoryUrl?: string
  documentationUrl?: string
}

export interface Environment {
  id: string
  appId: string
  code: string
  label: string
  rank: number
  protected: boolean
  color: string
}

/** Valeur d'un champ de famille. */
export type FieldValue = string | number | boolean | string[]

export type FamilyValues = Record<string, FieldValue>

export interface KeyValueItem {
  id: string
  category: string
  key: string
  type: SettingType
  value: string
  secret: boolean
  description: string
}

export interface SettingSet {
  id: string
  appId: string
  envCode: string
  componentId: string | null
  family: string
  version: number
  publishedValues: FamilyValues | null
  draftValues: FamilyValues | null
  /** Éléments Key/Value (famille `keyvalue` uniquement). */
  publishedItems: KeyValueItem[] | null
  draftItems: KeyValueItem[] | null
  updatedAt: string
  updatedBy: string
}

export interface SettingVersion {
  id: string
  setId: string
  appId: string
  envCode: string
  family: string
  version: number
  values: FamilyValues
  items: KeyValueItem[] | null
  publishedAt: string
  publishedBy: string
}

export type ClientStatus = 'ACTIF' | 'REVOQUE'

export interface ApiClient {
  id: string
  clientId: string
  name: string
  appId: string
  envCode: string
  status: ClientStatus
  expiresAt: string
  lastCallAt: string | null
  description: string
}

export type PromotionMode = 'CREER' | 'FUSIONNER' | 'REMPLACER'

export interface Promotion {
  id: string
  appId: string
  sourceEnv: string
  targetEnv: string
  mode: PromotionMode
  families: string[]
  executedAt: string
  executedBy: string
}

export interface AuditEvent {
  id: string
  date: string
  actor: string
  action: string
  objectType: string
  objectLabel: string
  appCode: string | null
  envCode: string | null
  details: string
}
