import { createSlice } from '@reduxjs/toolkit'
import type { User } from '../../types'

interface AuthState {
  user: User | null
}

const initialState: AuthState = { user: null }

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /** Connexion via l'IdP (simulée en l'absence de backend). */
    loginSso(state) {
      state.user = {
        name: 'Alice Martin',
        email: 'alice.martin@example.com',
        role: 'ADMIN',
        demo: false,
      }
    },
    /** Accès en mode démo : jeu de données local, aucun IdP requis. */
    loginDemo(state) {
      state.user = {
        name: 'Visiteur démo',
        email: 'demo@example.com',
        role: 'ADMIN',
        demo: true,
      }
    },
    logout(state) {
      state.user = null
    },
  },
})

export const { loginSso, loginDemo, logout } = authSlice.actions
export default authSlice.reducer
