import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { demoApplications, demoComponents, demoEnvironments, envColor, nextId } from '../../data/demo'
import type { AppComponent, Application, Environment } from '../../types'

interface AppsState {
  applications: Application[]
  components: AppComponent[]
  environments: Environment[]
}

const initialState: AppsState = {
  applications: demoApplications,
  components: demoComponents,
  environments: demoEnvironments,
}

export interface CreateApplicationPayload {
  code: string
  name: string
  description: string
  owner: string
  actor: string
}

export interface UpdateApplicationPayload {
  id: string
  name: string
  description: string
  owner: string
  actor: string
}

export interface ComponentPayload {
  appId: string
  code: string
  type: AppComponent['type']
  name: string
  description: string
  repositoryUrl?: string
  documentationUrl?: string
  actor: string
}

export interface EnvironmentPayload {
  appId: string
  code: string
  label: string
  rank: number
  protected: boolean
  actor: string
}

const appsSlice = createSlice({
  name: 'apps',
  initialState,
  reducers: {
    createApplication(state, action: PayloadAction<CreateApplicationPayload>) {
      const { code, name, description, owner } = action.payload
      state.applications.push({
        id: nextId('app'),
        code,
        name,
        description,
        owner,
        status: 'ACTIVE',
        favorite: false,
        updatedAt: new Date().toISOString(),
      })
    },
    updateApplication(state, action: PayloadAction<UpdateApplicationPayload>) {
      const app = state.applications.find((a) => a.id === action.payload.id)
      if (!app) return
      app.name = action.payload.name
      app.description = action.payload.description
      app.owner = action.payload.owner
      app.updatedAt = new Date().toISOString()
    },
    toggleArchive(state, action: PayloadAction<{ id: string; actor: string }>) {
      const app = state.applications.find((a) => a.id === action.payload.id)
      if (!app) return
      app.status = app.status === 'ACTIVE' ? 'ARCHIVED' : 'ACTIVE'
      app.updatedAt = new Date().toISOString()
    },
    toggleFavorite(state, action: PayloadAction<string>) {
      const app = state.applications.find((a) => a.id === action.payload)
      if (app) app.favorite = !app.favorite
    },
    addComponent(state, action: PayloadAction<ComponentPayload>) {
      const { appId, code, type, name, description, repositoryUrl, documentationUrl } = action.payload
      state.components.push({
        id: nextId('cmp'),
        appId,
        code,
        type,
        name,
        description,
        repositoryUrl,
        documentationUrl,
      })
      const app = state.applications.find((a) => a.id === appId)
      if (app) app.updatedAt = new Date().toISOString()
    },
    addEnvironment(state, action: PayloadAction<EnvironmentPayload>) {
      const { appId, code, label, rank } = action.payload
      state.environments.push({
        id: nextId('env'),
        appId,
        code,
        label,
        rank,
        protected: action.payload.protected,
        color: envColor(code),
      })
      const app = state.applications.find((a) => a.id === appId)
      if (app) app.updatedAt = new Date().toISOString()
    },
  },
})

export const {
  createApplication,
  updateApplication,
  toggleArchive,
  toggleFavorite,
  addComponent,
  addEnvironment,
} = appsSlice.actions
export default appsSlice.reducer
