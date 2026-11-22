import type { User } from '../types'

/** Persistance légère de la session en sessionStorage (fermée avec l'onglet). */

const KEY = 'settings.session.user'

export function loadSessionUser(): User | null {
  try {
    const raw = sessionStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as User) : null
  } catch {
    return null
  }
}

export function saveSessionUser(user: User | null): void {
  try {
    if (user) sessionStorage.setItem(KEY, JSON.stringify(user))
    else sessionStorage.removeItem(KEY)
  } catch {
    // stockage indisponible : la session ne survivra pas au rafraîchissement
  }
}
