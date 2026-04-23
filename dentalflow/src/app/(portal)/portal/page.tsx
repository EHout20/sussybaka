import { getSessionProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function PortalHomePage() {
  const p = await getSessionProfile();
  if (!p || !p.patient_id) notFound();
  const supabase = await createClient();
  const { data: me } = await supabase
    .from("patients")
    .select("first_name, last_name, consent_status, intake_complete")
    .eq("id", p.patient_id)
    .single();
  const { data: appts } = await supabase
    .from("appointments")
    .select("id, start_time, end_time, status, notes_patient, appointment_type")
    .eq("patient_id", p.patient_id)
    .gte("start_time", new Date().toISOString())
    .order("start_time", { ascending: true })
    .limit(6);
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Hi{me ? `, ${me.first_name}` : ""}</h1>
      <p className="text-sm text-slate-500">Upcoming care for your household account (synthetic data).</p>
      <section>
        <h2 className="text-sm font-medium">Upcoming appointments</h2>
        <ul className="mt-1 divide-y rounded-lg border text-sm">
          {(appts ?? []).length === 0 ? (
            <li className="p-3 text-slate-500">None scheduled. Contact the office.</li>
          ) : (
            (appts ?? []).map((a) => (
              <li key={a.id} className="p-3">
                <div className="font-medium">{a.start_time ? format(new Date(a.start_time), "PP p") : "—"}</div>
                <div className="text-xs text-slate-500">{a.appointment_type} · {a.status}</div>
                {a.notes_patient ? <div className="text-xs">Message: {a.notes_patient}</div> : null}
              </li>
            ))
          )}
        </ul>
        <p className="mt-1 text-xs text-slate-500">Internal scheduling details are not shown here (RLS + UI).</p>
      </section>
      <div className="flex flex-wrap gap-2 text-sm">
        <Link className="text-sky-700 underline" href="/portal/appointments">All appointments</Link>
        <Link className="text-sky-700 underline" href="/portal/forms">Forms</Link>
        <Link className="text-sky-700 underline" href="/portal/billing">Balance</Link>
      </div>
    </div>
  );
}
