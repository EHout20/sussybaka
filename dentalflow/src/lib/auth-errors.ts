/** Maps Supabase Auth / GoTrue errors to clearer UX. */

export function isEmailNotConfirmedError(err: { message: string; code?: string }): boolean {
  const code = (err.code ?? "").toLowerCase();
  if (code.includes("email_not_confirmed") || code === "unverified") return true;
  const m = err.message.toLowerCase();
  return m.includes("email not confirmed") || m.includes("not confirmed");
}
