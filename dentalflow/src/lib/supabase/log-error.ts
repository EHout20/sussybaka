import type { PostgrestError } from "@supabase/supabase-js";

/** RSC / devtools often print PostgrestError as `{}`; log explicit fields instead. */
export function logPostgrest(context: string, err: PostgrestError | null | undefined): void {
  if (!err) return;
  const parts = [err.code, err.message, err.details, err.hint].filter(
    (s): s is string => typeof s === "string" && s.length > 0
  );
  console.error(`[${context}]`, parts.length ? parts.join(" | ") : JSON.stringify(err));
}
