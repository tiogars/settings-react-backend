import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { demoApiClients, nextId } from '../../data/demo'
import type { ApiClient } from '../../types'

interface ClientsState {
  clients: ApiClient[]
}

const initialState: ClientsState = { clients: demoApiClients }

export interface CreateClientPayload {
  name: string
  appId: string
  envCode: string
  expiresAt: string
  description: string
  clientId: string
  actor: string
  appCode: string
}

export interface ClientActionPayload {
  id: string
  actor: string
  clientId: string
}

const clientsSlice = createSlice({
  name: 'clients',
  initialState,
  reducers: {
    createClient(state, action: PayloadAction<CreateClientPayload>) {
      const { name, appId, envCode, expiresAt, description, clientId } = action.payload
      state.clients.push({
        id: nextId('cli'),
        clientId,
        name,
        appId,
        envCode,
        status: 'ACTIF',
        expiresAt,
        lastCallAt: null,
        description,
      })
    },
    revokeClient(state, action: PayloadAction<ClientActionPayload>) {
      const client = state.clients.find((c) => c.id === action.payload.id)
      if (client) client.status = 'REVOQUE'
    },
    rotateSecret(_state, _action: PayloadAction<ClientActionPayload>) {
      // Le nouveau secret est généré côté appelant et affiché une seule fois ;
      // seul le fait de la rotation est tracé (audit).
    },
  },
})

export const { createClient, revokeClient, rotateSecret } = clientsSlice.actions
export default clientsSlice.reducer
