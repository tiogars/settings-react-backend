import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { FAMILY_BY_ID } from '../../data/families'
import { demoSettingSets, demoVersions, nextId } from '../../data/demo'
import type {
  FamilyValues,
  KeyValueItem,
  Promotion,
  PromotionMode,
  SettingSet,
  SettingVersion,
} from '../../types'

interface SettingsState {
  sets: SettingSet[]
  versions: SettingVersion[]
  promotions: Promotion[]
}

const initialState: SettingsState = {
  sets: demoSettingSets,
  versions: demoVersions,
  promotions: [],
}

export interface SaveDraftPayload {
  appId: string
  envCode: string
  componentId: string | null
  family: string
  values: FamilyValues | null
  items: KeyValueItem[] | null
  actor: string
  appCode: string
}

export interface SetActionPayload {
  setId: string
  actor: string
  appCode: string
}

export interface RollbackPayload {
  versionId: string
  actor: string
  appCode: string
}

export interface PromotePayload {
  appId: string
  appCode: string
  sourceEnv: string
  targetEnv: string
  mode: PromotionMode
  families: string[]
  includeSecrets: boolean
  actor: string
}

function findSet(
  state: SettingsState,
  appId: string,
  envCode: string,
  componentId: string | null,
  family: string,
): SettingSet | undefined {
  return state.sets.find(
    (s) =>
      s.appId === appId &&
      s.envCode === envCode &&
      s.componentId === componentId &&
      s.family === family,
  )
}

function publishSet(state: SettingsState, set: SettingSet, actor: string): void {
  if (set.draftValues === null && set.draftItems === null) return
  set.version += 1
  set.publishedValues = set.draftValues ?? set.publishedValues
  set.publishedItems = set.draftItems ?? set.publishedItems
  set.draftValues = null
  set.draftItems = null
  set.updatedAt = new Date().toISOString()
  set.updatedBy = actor
  if (set.publishedValues !== null || set.publishedItems !== null) {
    state.versions.push({
      id: nextId('ver'),
      setId: set.id,
      appId: set.appId,
      envCode: set.envCode,
      family: set.family,
      version: set.version,
      values: set.publishedValues ?? {},
      items: set.publishedItems,
      publishedAt: set.updatedAt,
      publishedBy: actor,
    })
  }
}

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    saveDraft(state, action: PayloadAction<SaveDraftPayload>) {
      const { appId, envCode, componentId, family, values, items, actor } = action.payload
      let set = findSet(state, appId, envCode, componentId, family)
      if (!set) {
        set = {
          id: nextId('set'),
          appId,
          envCode,
          componentId,
          family,
          version: 0,
          publishedValues: null,
          draftValues: null,
          publishedItems: null,
          draftItems: null,
          updatedAt: new Date().toISOString(),
          updatedBy: actor,
        }
        state.sets.push(set)
      }
      set.draftValues = values
      set.draftItems = items
      set.updatedAt = new Date().toISOString()
      set.updatedBy = actor
    },
    discardDraft(state, action: PayloadAction<SetActionPayload>) {
      const set = state.sets.find((s) => s.id === action.payload.setId)
      if (!set) return
      set.draftValues = null
      set.draftItems = null
      set.updatedAt = new Date().toISOString()
      set.updatedBy = action.payload.actor
    },
    publish(state, action: PayloadAction<SetActionPayload>) {
      const set = state.sets.find((s) => s.id === action.payload.setId)
      if (set) publishSet(state, set, action.payload.actor)
    },
    rollback(state, action: PayloadAction<RollbackPayload>) {
      const version = state.versions.find((v) => v.id === action.payload.versionId)
      if (!version) return
      const set = state.sets.find((s) => s.id === version.setId)
      if (!set) return
      set.draftValues = version.items === null ? { ...version.values } : null
      set.draftItems = version.items === null ? null : version.items.map((i) => ({ ...i }))
      publishSet(state, set, action.payload.actor)
    },
    applyPromotion(state, action: PayloadAction<PromotePayload>) {
      const { appId, sourceEnv, targetEnv, mode, families, includeSecrets, actor } = action.payload
      for (const family of families) {
        const source = findSet(state, appId, sourceEnv, null, family)
        if (!source || (source.publishedValues === null && source.publishedItems === null)) continue
        let target = findSet(state, appId, targetEnv, null, family)
        if (!target) {
          target = {
            id: nextId('set'),
            appId,
            envCode: targetEnv,
            componentId: null,
            family,
            version: 0,
            publishedValues: null,
            draftValues: null,
            publishedItems: null,
            draftItems: null,
            updatedAt: new Date().toISOString(),
            updatedBy: actor,
          }
          state.sets.push(target)
        }
        if (source.publishedItems !== null) {
          const sourceItems = source.publishedItems
            .filter((item) => includeSecrets || !item.secret)
            .map((item) => ({ ...item, id: nextId('kv') }))
          const kept =
            mode === 'FUSIONNER' && target.publishedItems !== null
              ? target.publishedItems.filter(
                  (t) => !sourceItems.some((s) => s.category === t.category && s.key === t.key),
                )
              : []
          target.draftItems = [...kept, ...sourceItems]
          target.draftValues = null
        } else if (source.publishedValues !== null) {
          const def = FAMILY_BY_ID.get(family)
          const secretFields = new Set(
            (def?.fields ?? []).filter((f) => f.type === 'secret').map((f) => f.name),
          )
          const next: FamilyValues = { ...source.publishedValues }
          if (!includeSecrets) {
            for (const name of secretFields) {
              const current = target.publishedValues?.[name]
              if (current !== undefined) next[name] = current
              else delete next[name]
            }
          }
          target.draftValues =
            mode === 'FUSIONNER' && target.publishedValues !== null
              ? { ...target.publishedValues, ...next }
              : next
          target.draftItems = null
        }
        publishSet(state, target, actor)
      }
      state.promotions.push({
        id: nextId('promo'),
        appId,
        sourceEnv,
        targetEnv,
        mode,
        families,
        executedAt: new Date().toISOString(),
        executedBy: actor,
      })
    },
  },
})

export const { saveDraft, discardDraft, publish, rollback, applyPromotion } =
  settingsSlice.actions
export default settingsSlice.reducer
