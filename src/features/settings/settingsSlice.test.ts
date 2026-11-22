import { describe, expect, it } from 'vitest'
import type { SettingSet } from '../../types'
import reducer, { applyPromotion, publish, rollback, saveDraft } from './settingsSlice'

function makeSet(overrides: Partial<SettingSet>): SettingSet {
  return {
    id: 'set-1',
    appId: 'app-1',
    envCode: 'qa',
    componentId: null,
    family: 'database',
    version: 1,
    publishedValues: { host: 'qa.example.com', password: 'qa-secret' },
    draftValues: null,
    publishedItems: null,
    draftItems: null,
    updatedAt: '2026-01-01T00:00:00.000Z',
    updatedBy: 'alice',
    ...overrides,
  }
}

const base = { versions: [], promotions: [] }

describe('settingsSlice', () => {
  it('saveDraft crée un jeu inexistant puis stocke le brouillon', () => {
    const state = reducer(
      { ...base, sets: [] },
      saveDraft({
        appId: 'app-1',
        envCode: 'dev',
        componentId: null,
        family: 'logs',
        values: { level: 'DEBUG' },
        items: null,
        actor: 'alice',
        appCode: 'billing',
      }),
    )
    expect(state.sets).toHaveLength(1)
    expect(state.sets[0].draftValues).toEqual({ level: 'DEBUG' })
    expect(state.sets[0].version).toBe(0)
  })

  it('publish incrémente la version, vide le brouillon et historise', () => {
    const initial = {
      ...base,
      sets: [makeSet({ draftValues: { host: 'qa2.example.com', password: 'qa-secret' } })],
    }
    const state = reducer(initial, publish({ setId: 'set-1', actor: 'bob', appCode: 'billing' }))
    expect(state.sets[0].version).toBe(2)
    expect(state.sets[0].draftValues).toBeNull()
    expect(state.sets[0].publishedValues?.host).toBe('qa2.example.com')
    expect(state.versions).toHaveLength(1)
    expect(state.versions[0]).toMatchObject({ version: 2, publishedBy: 'bob' })
  })

  it('applyPromotion recopie sans les secrets par défaut (valeur cible conservée)', () => {
    const initial = {
      ...base,
      sets: [
        makeSet({ id: 'src', envCode: 'qa' }),
        makeSet({
          id: 'dst',
          envCode: 'prod',
          version: 3,
          publishedValues: { host: 'prod.example.com', password: 'prod-secret' },
        }),
      ],
    }
    const state = reducer(
      initial,
      applyPromotion({
        appId: 'app-1',
        appCode: 'billing',
        sourceEnv: 'qa',
        targetEnv: 'prod',
        mode: 'REMPLACER',
        families: ['database'],
        includeSecrets: false,
        actor: 'alice',
      }),
    )
    const target = state.sets.find((s) => s.id === 'dst')
    expect(target?.publishedValues?.host).toBe('qa.example.com')
    expect(target?.publishedValues?.password).toBe('prod-secret')
    expect(target?.version).toBe(4)
    expect(state.promotions).toHaveLength(1)
  })

  it('rollback republie les valeurs de la version choisie', () => {
    const initial = {
      ...base,
      versions: [
        {
          id: 'ver-1',
          setId: 'set-1',
          appId: 'app-1',
          envCode: 'qa',
          family: 'database',
          version: 1,
          values: { host: 'old.example.com', password: 'qa-secret' },
          items: null,
          publishedAt: '2026-01-01T00:00:00.000Z',
          publishedBy: 'alice',
        },
      ],
      sets: [makeSet({ version: 2, publishedValues: { host: 'new.example.com', password: 'qa-secret' } })],
    }
    const state = reducer(initial, rollback({ versionId: 'ver-1', actor: 'bob', appCode: 'billing' }))
    expect(state.sets[0].publishedValues?.host).toBe('old.example.com')
    expect(state.sets[0].version).toBe(3)
  })
})
