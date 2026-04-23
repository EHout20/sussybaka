/**
 * Idempotent seed: requires SUPABASE_SECRET_KEY (or legacy SUPABASE_SERVICE_ROLE_KEY),
 * NEXT_PUBLIC_SUPABASE_URL, DEMO_SEED_PASSWORD, and scripts/seed-accounts.json (copy from
 * seed-accounts.example.json). Password is sent to Supabase Auth only during seed; Supabase stores a hash.
 * Run: npm run db:seed
 */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

const ROLES = ["admin", "front_desk", "dentist", "hygienist", "patient"] as const;
type SeedRole = (typeof ROLES)[number];

type SeedAccount = { email: string; full_name: string; role: SeedRole };

function loadSeedAccounts(): SeedAccount[] {
  const rel = process.env.DEMO_SEED_ACCOUNTS_FILE ?? "scripts/seed-accounts.json";
  const abs = resolve(process.cwd(), rel);
  if (!existsSync(abs)) {
    console.error(
      `Missing ${rel}. Copy scripts/seed-accounts.example.json → ${rel} (path override: DEMO_SEED_ACCOUNTS_FILE).`
    );
    process.exit(1);
  }
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(abs, "utf8")) as unknown;
  } catch (e) {
    console.error("Invalid JSON in seed accounts file:", e);
    process.exit(1);
  }
  if (!Array.isArray(raw) || raw.length === 0) {
    console.error("seed-accounts.json must be a non-empty array.");
    process.exit(1);
  }
  const accounts: SeedAccount[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const o = row as Record<string, unknown>;
    const email = typeof o.email === "string" ? o.email.trim() : "";
    const full_name = typeof o.full_name === "string" ? o.full_name.trim() : "";
    const role = o.role;
    if (!email || !full_name || typeof role !== "string" || !ROLES.includes(role as SeedRole)) {
      console.error("Each seed account needs email, full_name, and a valid role:", ROLES.join(", "));
      process.exit(1);
    }
    accounts.push({ email, full_name, role: role as SeedRole });
  }
  for (const r of ROLES) {
    if (accounts.filter((a) => a.role === r).length !== 1) {
      console.error(`seed-accounts.json must contain exactly one account with role "${r}".`);
      process.exit(1);
    }
  }
  return accounts;
}

function userIdForRole(
  spec: SeedAccount[],
  idByEmail: Record<string, string>,
  role: SeedRole
): string {
  const acc = spec.find((s) => s.role === role);
  if (!acc) throw new Error(`Missing role ${role}`);
  const id = idByEmail[acc.email];
  if (!id) throw new Error(`Missing user id for ${acc.email}`);
  return id;
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const service =
  process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
const PASS = process.env.DEMO_SEED_PASSWORD?.trim();

if (!url || !service) {
  console.error(
    "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY (or legacy SUPABASE_SERVICE_ROLE_KEY)"
  );
  process.exit(1);
}
if (!PASS) {
  console.error(
    "Set DEMO_SEED_PASSWORD in .env or .env.local (required for seed; never commit this value)."
  );
  process.exit(1);
}

const admin = createClient(url, service, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const spec = loadSeedAccounts();

async function ensureUser(
  email: string,
  password: string,
  meta: { full_name: string }
): Promise<string> {
  const { data: list, error: le } = await admin.auth.admin.listUsers({ perPage: 2000 });
  if (le) throw le;
  const ex = list.users.find((u) => u.email === email);
  if (ex) return ex.id;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: meta.full_name },
  });
  if (error) throw error;
  return data.user.id;
}

async function main() {
  const idByEmail: Record<string, string> = {};
  for (const s of spec) {
    const id = await ensureUser(s.email, PASS, { full_name: s.full_name });
    idByEmail[s.email] = id;
  }

  const supabase = createClient(url, service, { auth: { autoRefreshToken: false, persistSession: false } });

  for (const s of spec) {
    const { error: pe } = await supabase
      .from("profiles")
      .upsert(
        { id: idByEmail[s.email], email: s.email, full_name: s.full_name, role: s.role, patient_id: null },
        { onConflict: "id" }
      );
    if (pe) throw pe;
  }

  const { count: patientCount, error: cErr } = await supabase
    .from("patients")
    .select("id", { count: "exact", head: true });
  if (cErr) throw cErr;
  if (!patientCount) {
    const { error: pErr } = await supabase.from("patients").insert([
      {
        first_name: "Alex",
        last_name: "Sample",
        dob: "1990-05-12",
        phone: "555-0100",
        email: "alex.sample@example.test",
        allergies: "Penicillin (synthetic)",
        medical_alerts: "None (demo)",
        insurance_provider: "Demo Dental PPO",
        policy_number: "DEMO-POL-1",
        consent_status: "obtained",
        intake_complete: true,
      },
      {
        first_name: "Blake",
        last_name: "Case",
        dob: "1985-11-20",
        phone: "555-0101",
        email: "blake.case@example.test",
        allergies: "Latex (synthetic)",
        medical_alerts: "None (demo)",
        insurance_provider: "Demo HMO",
        policy_number: "DEMO-POL-2",
        consent_status: "pending",
        intake_complete: false,
      },
    ]);
    if (pErr) throw pErr;
  }

  const { data: allPatients } = await supabase
    .from("patients")
    .select("id, email, last_name")
    .in("last_name", ["Sample", "Case"]);
  const alex = allPatients?.find((p) => p.last_name === "Sample");
  const blake = allPatients?.find((p) => p.last_name === "Case");
  if (!alex || !blake) {
    throw new Error("Expected demo patients (Sample, Case) not found; check DB.");
  }

  const patientAcc = spec.find((s) => s.role === "patient")!;
  const patientUserId = userIdForRole(spec, idByEmail, "patient");
  await supabase.from("patients").update({ user_id: patientUserId }).eq("id", alex.id).is("user_id", null);
  await supabase
    .from("profiles")
    .update({
      patient_id: alex.id,
      email: patientAcc.email,
      full_name: patientAcc.full_name,
    })
    .eq("id", patientUserId);

  await supabase
    .from("staff_profiles")
    .upsert(
      {
        user_id: userIdForRole(spec, idByEmail, "dentist"),
        job_title: "Dentist",
        license_number: "DDS-DEMO",
      },
      { onConflict: "user_id" }
    );
  await supabase
    .from("staff_profiles")
    .upsert(
      {
        user_id: userIdForRole(spec, idByEmail, "hygienist"),
        job_title: "Hygienist",
        license_number: "RDH-DEMO",
      },
      { onConflict: "user_id" }
    );

  const dentist = userIdForRole(spec, idByEmail, "dentist");
  const day = new Date();
  const start1 = new Date(day);
  start1.setDate(day.getDate() + 1);
  start1.setHours(9, 0, 0, 0);
  const end1 = new Date(start1);
  end1.setHours(9, 45, 0, 0);
  const start2 = new Date(start1);
  start2.setDate(start1.getDate() + 1);
  start2.setHours(10, 30, 0, 0);
  const end2 = new Date(start2);
  end2.setHours(11, 15, 0, 0);

  const { data: apts } = await supabase
    .from("appointments")
    .select("id")
    .eq("patient_id", alex.id)
    .limit(1);
  if (!apts?.length) {
    await supabase.from("appointments").insert([
      {
        patient_id: alex.id,
        provider_id: dentist,
        room: "1",
        appointment_type: "Prophy / hygiene",
        start_time: start1.toISOString(),
        end_time: end1.toISOString(),
        status: "scheduled",
        notes_patient: "Arrive 10 min early (demo).",
        notes_staff: "Prefers late morning; synthetic preference.",
        is_waitlist: false,
      },
      {
        patient_id: blake.id,
        provider_id: userIdForRole(spec, idByEmail, "hygienist"),
        room: "2",
        appointment_type: "Comprehensive eval",
        start_time: start2.toISOString(),
        end_time: end2.toISOString(),
        status: "scheduled",
        is_waitlist: false,
      },
    ]);
  }

  const { data: tplan } = await supabase
    .from("treatment_plans")
    .select("id")
    .eq("patient_id", alex.id)
    .limit(1);
  if (!tplan?.length) {
    const { data: pl } = await supabase
      .from("treatment_plans")
      .insert({ patient_id: alex.id, title: "Adult prophy + FMX", status: "active", created_by: dentist, follow_up_date: null })
      .select("id")
      .single();
    if (pl) {
      await supabase.from("treatment_items").insert([
        {
          treatment_plan_id: pl.id,
          tooth_number: 14,
          procedure_code: "D1110",
          description: "Adult prophylaxis (synthetic line item)",
          status: "approved",
          estimate_cents: 15000,
          patient_visible: true,
        },
        {
          treatment_plan_id: pl.id,
          procedure_code: "D0210",
          description: "FMX (demo)",
          status: "planned",
          estimate_cents: 12000,
          patient_visible: true,
        },
      ]);
    }
  }

  const { data: exInv } = await supabase
    .from("invoices")
    .select("id")
    .eq("patient_id", alex.id)
    .limit(1);
  if (!exInv?.length) {
    const { data: inv } = await supabase
      .from("invoices")
      .insert({ patient_id: alex.id, total_cents: 20000, balance_cents: 5000, status: "partial", due_date: "2026-12-01" })
      .select("id")
      .single();
    if (inv) {
      await supabase.from("payments").insert({
        invoice_id: inv.id,
        amount_cents: 15000,
        method: "card_mock",
        is_mock: true,
      });
    }
  }

  const { data: tsk } = await supabase
    .from("tasks")
    .select("id")
    .limit(1);
  if (!tsk?.length) {
    await supabase.from("tasks").insert({
      title: "Verify Blake intake documents",
      description: "Synthetic follow-up (demo).",
      patient_id: blake.id,
      assigned_to: userIdForRole(spec, idByEmail, "front_desk"),
      created_by: userIdForRole(spec, idByEmail, "admin"),
      due_date: new Date().toISOString(),
      priority: "high",
      status: "open",
    });
  }

  const { data: nts } = await supabase
    .from("clinical_notes")
    .select("id")
    .eq("patient_id", alex.id)
    .limit(1);
  if (!nts?.length) {
    await supabase.from("clinical_notes").insert({
      patient_id: alex.id,
      author_id: dentist,
      content: "Simplified demo: patient tolerates prophy; review home care (synthetic).",
      is_internal: true,
    });
    await supabase.from("clinical_notes").insert({
      patient_id: alex.id,
      author_id: dentist,
      content: "Visible summary for portal: prophy scheduled next visit; keep brushing 2x (synthetic, not medical advice).",
      is_internal: false,
    });
  }

  const { data: ch } = await supabase
    .from("dental_chart_entries")
    .select("id")
    .eq("patient_id", alex.id)
    .limit(1);
  if (!ch?.length) {
    await supabase.from("dental_chart_entries").insert({
      patient_id: alex.id,
      tooth_number: 14,
      surface: "O",
      condition_code: "CARIES_WATCH",
      notes: "Watch occlusal (synthetic, demo data only)",
      updated_by: dentist,
    });
  }

  const { data: w } = await supabase.from("waitlist_entries").select("id").limit(1);
  if (!w?.length) {
    await supabase.from("waitlist_entries").insert({
      patient_id: blake.id,
      notes: "Wants late afternoon, synthetic",
      status: "active",
    });
  }

  const { data: aptsForRem } = await supabase
    .from("appointments")
    .select("id")
    .eq("patient_id", alex.id)
    .order("start_time", { ascending: true })
    .limit(1);
  if (aptsForRem?.[0]) {
    const { data: re } = await supabase
      .from("reminders")
      .select("id")
      .eq("appointment_id", aptsForRem[0].id)
      .limit(1);
    if (!re?.length) {
      const when = new Date(start1);
      when.setDate(when.getDate() - 1);
      when.setHours(8, 0, 0, 0);
      await supabase.from("reminders").insert({
        appointment_id: aptsForRem[0].id,
        channel: "email",
        scheduled_for: when.toISOString(),
        status: "pending",
      });
    }
  }

  const { data: cl } = await supabase
    .from("insurance_claims")
    .select("id")
    .limit(1);
  if (!cl?.length) {
    await supabase.from("insurance_claims").insert({
      patient_id: alex.id,
      status: "submitted",
      claim_number: "CLM-DEMO-1",
      submitted_at: new Date().toISOString(),
    });
  }

  const { data: fr } = await supabase
    .from("patient_forms")
    .select("id")
    .eq("patient_id", alex.id)
    .limit(1);
  if (!fr?.length) {
    await supabase.from("patient_forms").insert({
      patient_id: alex.id,
      form_key: "health_history",
      data: { conditions: "none (synthetic)" },
      completed_at: new Date().toISOString(),
    });
  }

  const { data: d } = await supabase
    .from("documents")
    .select("id")
    .eq("patient_id", alex.id)
    .limit(1);
  if (!d?.length) {
    await supabase.from("documents").insert({
      patient_id: alex.id,
      file_name: "hipaa-ack.pdf",
      file_type: "application/pdf",
      storage_path: "placeholder/demo/hipaa-ack.pdf",
      category: "consent",
      visible_to_patient: true,
      uploaded_by: userIdForRole(spec, idByEmail, "front_desk"),
    });
  }

  console.log("Seed complete. Sign in with DEMO_SEED_PASSWORD from your env (not printed) and any of:");
  spec.forEach((s) => console.log(`  - ${s.email} (${s.role})`));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
