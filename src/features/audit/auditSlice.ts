import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { demoAuditEvents, nextId } from '../../data/demo'
import { familyLabel } from '../../data/families'
import type { AuditEvent } from '../../types'
import {
  addComponent,
  addEnvironment,
  createApplication,
  toggleArchive,
  updateApplication,
} from '../apps/appsSlice'
import { createClient, revokeClient, rotateSecret } from '../clients/clientsSlice'
import {
  applyPromotion,
  discardDraft,
  publish,
  rollback,
  saveDraft,
} from '../settings/settingsSlice'

interface AuditState {
  events: AuditEvent[]
}

const initialState: AuditState = { events: demoAuditEvents }

function event(partial: Omit<AuditEvent, 'id' | 'date'>): AuditEvent {
  return { id: nextId('aud'), date: new Date().toISOString(), ...partial }
}

const auditSlice = createSlice({
  name: 'audit',
  initialState,
  reducers: {
    addAuditEvent(state, action: PayloadAction<Omit<AuditEvent, 'id' | 'date'>>) {
      state.events.unshift(event(action.payload))
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createApplication, (state, { payload }) => {
        state.events.unshift(
          event({
            actor: payload.actor, action: 'CREATION', objectType: 'Application',
            objectLabel: payload.code, appCode: payload.code, envCode: null,
            details: `Application « ${payload.name} » créée.`,
          }),
        )
      })
      .addCase(updateApplication, (state, { payload }) => {
        state.events.unshift(
          event({
            actor: payload.actor, action: 'MODIFICATION', objectType: 'Application',
            objectLabel: payload.name, appCode: null, envCode: null,
            details: 'Description de l’application mise à jour.',
          }),
        )
      })
      .addCase(toggleArchive, (state, { payload }) => {
        state.events.unshift(
          event({
            actor: payload.actor, action: 'ARCHIVAGE', objectType: 'Application',
            objectLabel: payload.id, appCode: null, envCode: null,
            details: 'Changement de statut (ACTIVE/ARCHIVED).',
          }),
        )
      })
      .addCase(addComponent, (state, { payload }) => {
        state.events.unshift(
          event({
            actor: payload.actor, action: 'CREATION', objectType: 'Composant',
            objectLabel: payload.code, appCode: null, envCode: null,
            details: `Composant ${payload.type} ajouté.`,
          }),
        )
      })
      .addCase(addEnvironment, (state, { payload }) => {
        state.events.unshift(
          event({
            actor: payload.actor, action: 'CREATION', objectType: 'Environnement',
            objectLabel: payload.code, appCode: null, envCode: payload.code,
            details: `Environnement « ${payload.label} » ajouté.`,
          }),
        )
      })
      .addCase(saveDraft, (state, { payload }) => {
        state.events.unshift(
          event({
            actor: payload.actor, action: 'BROUILLON', objectType: 'Paramétrage',
            objectLabel: familyLabel(payload.family), appCode: payload.appCode,
            envCode: payload.envCode, details: 'Brouillon enregistré (valeurs avant/après tracées, secrets masqués).',
          }),
        )
      })
      .addCase(publish, (state, { payload }) => {
        state.events.unshift(
          event({
            actor: payload.actor, action: 'PUBLICATION', objectType: 'Paramétrage',
            objectLabel: payload.setId, appCode: payload.appCode, envCode: null,
            details: 'Nouvelle version publiée.',
          }),
        )
      })
      .addCase(discardDraft, (state, { payload }) => {
        state.events.unshift(
          event({
            actor: payload.actor, action: 'ANNULATION', objectType: 'Paramétrage',
            objectLabel: payload.setId, appCode: payload.appCode, envCode: null,
            details: 'Brouillon annulé.',
          }),
        )
      })
      .addCase(rollback, (state, { payload }) => {
        state.events.unshift(
          event({
            actor: payload.actor, action: 'ROLLBACK', objectType: 'Paramétrage',
            objectLabel: payload.versionId, appCode: payload.appCode, envCode: null,
            details: 'Retour à une version antérieure.',
          }),
        )
      })
      .addCase(applyPromotion, (state, { payload }) => {
        state.events.unshift(
          event({
            actor: payload.actor, action: 'RECOPIE', objectType: 'Promotion',
            objectLabel: `${payload.sourceEnv} → ${payload.targetEnv}`,
            appCode: payload.appCode, envCode: payload.targetEnv,
            details: `Familles recopiées : ${payload.families.map(familyLabel).join(', ')} (mode ${payload.mode}).`,
          }),
        )
      })
      .addCase(createClient, (state, { payload }) => {
        state.events.unshift(
          event({
            actor: payload.actor, action: 'CREATION', objectType: 'Client API',
            objectLabel: payload.clientId, appCode: payload.appCode, envCode: payload.envCode,
            details: 'Client API créé ; secret affiché une seule fois.',
          }),
        )
      })
      .addCase(revokeClient, (state, { payload }) => {
        state.events.unshift(
          event({
            actor: payload.actor, action: 'REVOCATION', objectType: 'Client API',
            objectLabel: payload.clientId, appCode: null, envCode: null,
            details: 'Client API révoqué.',
          }),
        )
      })
      .addCase(rotateSecret, (state, { payload }) => {
        state.events.unshift(
          event({
            actor: payload.actor, action: 'ROTATION', objectType: 'Client API',
            objectLabel: payload.clientId, appCode: null, envCode: null,
            details: 'Rotation du secret.',
          }),
        )
      })
  },
})

export const { addAuditEvent } = auditSlice.actions
export default auditSlice.reducer
