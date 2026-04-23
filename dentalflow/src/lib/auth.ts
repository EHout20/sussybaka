import { createClient } from "@/lib/supabase/server";
import type { AppRole } from "@/types/roles";

export type SessionProfile = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: AppRole;
  patient_id: string | null;
};

export async function getSessionUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
}

export async function getSessionProfile(): Promise<SessionProfile | null> {
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
