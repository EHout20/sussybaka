"use server";

import { createClient } from "@/lib/supabase/server";
import { newPatientSchema } from "@/lib/validation/patient";
import {
  appointmentCreateSchema,
  clinicalNoteSchema,
  taskCreateSchema,
} from "@/lib/validation/appointment";
import { revalidatePath } from "next/cache";
import { parseUsdToCents } from "@/lib/money";
import { z } from "zod";
import { redirect } from "next/navigation";

const invoiceSchema = z.object({
  patient_id: z.string().uuid(),
  total_usd: z.string().min(1),
  due_date: z.string().optional().or(z.literal("")),
});

const paymentSchema = z.object({
  invoice_id: z.string().uuid(),
  amount_usd: z.string().min(1),
});

export async function createPatientAction(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const parsed = newPatientSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid input");
  }
  const v = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("patients")
    .insert({
      first_name: v.first_name,
      last_name: v.last_name,
      dob: v.dob || null,
      phone: v.phone || null,
      email: v.email || null,
      insurance_provider: v.insurance_provider || null,
      policy_number: v.policy_number || null,
      allergies: v.allergies || null,
      medical_alerts: v.medical_alerts || null,
      emergency_contact: v.emergency_contact || null,
      emergency_phone: v.emergency_phone || null,
      consent_status: v.consent_status,
      intake_complete: v.consent_status === "obtained",
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/patients");
  redirect(`/patients/${data.id}`);
}

export async function createAppointmentAction(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const parsed = appointmentCreateSchema.safeParse({
    ...raw,
    is_waitlist: raw.is_waitlist === "on" || raw.is_waitlist === "true",
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid input");
  }
  const v = parsed.data;
  const supabase = await createClient();
  const start = new Date(v.start_time);
  const end = new Date(v.end_time);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error("Invalid start or end time");
  }
  const { error } = await supabase.from("appointments").insert({
    patient_id: v.patient_id,
    provider_id: v.provider_id,
    room: v.room || null,
    appointment_type: v.appointment_type,
    start_time: start.toISOString(),
    end_time: end.toISOString(),
    status: v.status,
    notes_patient: v.notes_patient || null,
    notes_staff: v.notes_staff || null,
    is_waitlist: v.is_waitlist ?? false,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/schedule");
  revalidatePath("/dashboard");
}

export async function addClinicalNoteAction(formData: FormData) {
  const supabase = await createClient();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Not signed in");
  const raw = Object.fromEntries(formData.entries());
  const parsed = clinicalNoteSchema.safeParse({
    ...raw,
    is_internal: raw.is_internal === "on" || raw.is_internal === "true",
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid input");
  }
  const v = parsed.data;
  const { error } = await supabase.from("clinical_notes").insert({
    patient_id: v.patient_id,
    author_id: u.user.id,
    content: v.content,
    is_internal: v.is_internal,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/patients/${v.patient_id}`);
}

export async function addChartEntryAction(formData: FormData) {
  const supabase = await createClient();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Not signed in");
  const patient_id = String(formData.get("patient_id") ?? "");
  const tooth = String(formData.get("tooth_number") ?? "");
  const t = parseInt(tooth, 10);
  if (!patient_id || Number.isNaN(t)) throw new Error("Tooth and patient are required");
  const { error } = await supabase.from("dental_chart_entries").insert({
    patient_id,
    tooth_number: t,
    surface: String(formData.get("surface") || "") || null,
    condition_code: String(formData.get("condition_code") || "") || null,
    notes: String(formData.get("notes") || "") || null,
    updated_by: u.user.id,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/patients/${patient_id}`);
}

export async function createTaskAction(formData: FormData) {
  const supabase = await createClient();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Not signed in");
  const raw = Object.fromEntries(formData.entries());
  const pid = String(raw.patient_id || "").trim();
  const parsed = taskCreateSchema.safeParse({
    ...raw,
    patient_id: pid.length > 0 ? pid : undefined,
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid input");
  }
  const v = parsed.data;
  const due = new Date(v.due_date);
  if (Number.isNaN(due.getTime())) throw new Error("Invalid due date");
  const { error } = await supabase.from("tasks").insert({
    title: v.title,
    description: v.description || null,
    patient_id: v.patient_id && v.patient_id.length > 0 ? v.patient_id : null,
    assigned_to: v.assigned_to,
    created_by: u.user.id,
    due_date: due.toISOString(),
    priority: v.priority,
    status: "open",
  });
  if (error) throw new Error(error.message);
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
}

export async function createInvoiceAction(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const parsed = invoiceSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid input");
  }
  const v = parsed.data;
  const supabase = await createClient();
  const total = parseUsdToCents(v.total_usd);
  const { error } = await supabase.from("invoices").insert({
    patient_id: v.patient_id,
    total_cents: total,
    balance_cents: total,
    due_date: v.due_date && v.due_date.length > 0 ? v.due_date : null,
    status: "sent",
  });
  if (error) throw new Error(error.message);
  revalidatePath("/billing");
}

export async function recordMockPaymentAction(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const parsed = paymentSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid input");
  }
  const v = parsed.data;
  const supabase = await createClient();
  const { data: inv, error: invErr } = await supabase
    .from("invoices")
    .select("id, balance_cents, patient_id")
    .eq("id", v.invoice_id)
    .single();
  if (invErr || !inv) throw new Error("Invoice not found");
  const amount = parseUsdToCents(v.amount_usd);
  if (amount <= 0) throw new Error("Amount must be positive");
  const { error: payErr } = await supabase.from("payments").insert({
    invoice_id: v.invoice_id,
    amount_cents: amount,
    method: "card_mock",
    is_mock: true,
  });
  if (payErr) throw new Error(payErr.message);
  const newBal = Math.max(0, (inv.balance_cents ?? 0) - amount);
  const { error: upErr } = await supabase
    .from("invoices")
    .update({
      balance_cents: newBal,
      status: newBal === 0 ? "paid" : "partial",
    })
    .eq("id", v.invoice_id);
  if (upErr) throw new Error(upErr.message);
  revalidatePath("/billing");
}

export async function addWaitlistAction(formData: FormData) {
  const patient_id = String(formData.get("patient_id") || "");
  const notes = String(formData.get("notes") || "");
  if (!patient_id) throw new Error("Patient is required");
  const supabase = await createClient();
  const { error } = await supabase.from("waitlist_entries").insert({
    patient_id,
    notes: notes || null,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/schedule");
}

export async function createInsuranceClaimAction(formData: FormData) {
  const supabase = await createClient();
  const patient_id = String(formData.get("patient_id") || "");
  const invoice_id = String(formData.get("invoice_id") || "");
  if (!patient_id) throw new Error("Patient is required");
  const { error } = await supabase.from("insurance_claims").insert({
    patient_id,
    invoice_id: invoice_id && invoice_id.length > 0 ? invoice_id : null,
    status: "submitted",
    claim_number: `CLM-DEMO-${Date.now()}`,
    submitted_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/billing");
}

export async function createDocumentMetaAction(formData: FormData) {
  const supabase = await createClient();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Not signed in");
  const patient_id = String(formData.get("patient_id") || "");
  const file_name = String(formData.get("file_name") || "document");
  const category = String(formData.get("category") || "general");
  const visible = formData.get("visible_to_patient") === "on";
  if (!patient_id) throw new Error("Patient is required");
  const path = `placeholder/${patient_id}/${encodeURIComponent(file_name)}`;
  const { error } = await supabase.from("documents").insert({
    patient_id,
    file_name,
    file_type: "application/octet-stream",
    storage_path: path,
    category,
    visible_to_patient: visible,
    uploaded_by: u.user.id,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/patients/${patient_id}`);
}

export async function addTreatmentPlanAction(patientId: string, title: string) {
  const supabase = await createClient();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Not signed in");
  const { error } = await supabase
    .from("treatment_plans")
    .insert({
      patient_id: patientId,
      title,
      created_by: u.user.id,
      status: "active",
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  revalidatePath(`/patients/${patientId}`);
}

export async function addTreatmentPlanFormAction(formData: FormData) {
  const patientId = String(formData.get("patient_id") || "");
  const title = String(formData.get("title") || "Treatment plan");
  if (!patientId) throw new Error("Missing patient");
  await addTreatmentPlanAction(patientId, title);
}

const planItem = z.object({
  treatment_plan_id: z.string().uuid(),
  patient_id: z.string().uuid(),
  tooth_number: z.string().max(3).optional().or(z.literal("")),
  procedure_code: z.string().max(40).optional().or(z.literal("")),
  description: z.string().min(1).max(2000),
  status: z.enum([
    "planned",
    "approved",
    "in_progress",
    "completed",
    "cancelled",
  ]),
  estimate_usd: z.string().min(1),
  patient_visible: z.coerce.boolean().optional().default(true),
});

export async function addTreatmentItemAction(formData: FormData) {
  const raw = { ...Object.fromEntries(formData.entries()) } as Record<string, string | undefined>;
  raw.patient_visible = formData.get("patient_visible") === "on" ? "true" : "false";
  const parsed = planItem.safeParse({
    ...raw,
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid input");
  }
  const v = parsed.data;
  const t =
    v.tooth_number && v.tooth_number.length > 0
      ? parseInt(v.tooth_number, 10)
      : null;
  if (t !== null && (Number.isNaN(t) || t < 1 || t > 32)) {
    throw new Error("Tooth must be 1-32");
  }
  const supabase = await createClient();
  const { error } = await supabase.from("treatment_items").insert({
    treatment_plan_id: v.treatment_plan_id,
    tooth_number: t,
    procedure_code: v.procedure_code || null,
    description: v.description,
    status: v.status,
    estimate_cents: parseUsdToCents(v.estimate_usd),
    patient_visible: v.patient_visible,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/patients/${v.patient_id}`);
}
