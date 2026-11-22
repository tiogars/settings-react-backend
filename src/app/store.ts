import { configureStore } from '@reduxjs/toolkit'
import appsReducer from '../features/apps/appsSlice'
import auditReducer from '../features/audit/auditSlice'
import authReducer from '../features/auth/authSlice'
import clientsReducer from '../features/clients/clientsSlice'
import settingsReducer from '../features/settings/settingsSlice'
import { loadSessionUser, saveSessionUser } from './session'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    apps: appsReducer,
    settings: settingsReducer,
    clients: clientsReducer,
    audit: auditReducer,
  },
  preloadedState: {
    auth: { user: loadSessionUser() },
  },
})

store.subscribe(() => {
  saveSessionUser(store.getState().auth.user)
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
