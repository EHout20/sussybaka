/**
 * PostgREST may return a nested row object or a single-element array for FK embeds, depending on schema cache.
 */
export type PatientNameRow = { first_name: string; last_name: string };

export function onePatientName(
  rel: PatientNameRow | PatientNameRow[] | null | undefined
): PatientNameRow | null {
  if (!rel) return null;
  return Array.isArray(rel) ? rel[0] ?? null : rel;
}
