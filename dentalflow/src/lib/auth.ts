import { createClient } from "@/lib/supabase/server";
import type { AppRole } from "@/types/roles";

export type SessionProfile = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: AppRole;
  patient_id: string | null;
};

// Temporary local-dev bypass: defaults OFF. Enable only with AUTH_BYPASS=true.
const AUTH_BYPASS = process.env.AUTH_BYPASS === "true";
const BYPASS_PROFILE: SessionProfile = {
  id: "local-dev-admin",
  email: "local-admin@dentalflow.dev",
  full_name: "Local Admin",
  role: "admin",
  patient_id: null,
};

export async function getSessionUser() {
  if (AUTH_BYPASS) return { id: BYPASS_PROFILE.id } as any;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
}

export async function getSessionProfile(): Promise<SessionProfile | null> {
  if (AUTH_BYPASS) return BYPASS_PROFILE;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: row, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, patient_id")
    .eq("id", user.id)
    .maybeSingle();
  if (error || !row) return null;
  return row as SessionProfile;
}
