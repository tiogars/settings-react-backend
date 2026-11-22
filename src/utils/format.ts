import { DateTime } from 'luxon'

/** Formatage des dates avec Luxon (locale fr). */

export function fmtDate(iso: string): string {
  return DateTime.fromISO(iso).setLocale('fr').toLocaleString(DateTime.DATE_MED)
}

export function fmtDateTime(iso: string): string {
  return DateTime.fromISO(iso).setLocale('fr').toLocaleString(DateTime.DATETIME_MED)
}

export function fmtRelative(iso: string): string {
  return DateTime.fromISO(iso).setLocale('fr').toRelative() ?? fmtDate(iso)
}

/** Masque les valeurs sensibles pour l'affichage (jamais de secret en clair). */
export const MASKED = '••••••'
