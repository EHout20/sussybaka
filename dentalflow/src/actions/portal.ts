"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function submitIntakeFormAction(formData: FormData) {
  const supabase = await createClient();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Not signed in");
  const { data: pr } = await supabase
    .from("profiles")
    .select("patient_id")
    .eq("id", u.user.id)
    .single();
  const patientId = pr?.patient_id;
  if (!patientId) throw new Error("No patient link on this account");
  const concerns = String(formData.get("concerns") || "");
  const { error } = await supabase.from("patient_forms").insert({
    patient_id: patientId,
    form_key: "adult_intake",
    data: { concerns },
    completed_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/portal");
  revalidatePath("/portal/forms");
  revalidatePath(`/patients/${patientId}`);
}
