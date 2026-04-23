import { getSessionProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import { notFound } from "next/navigation";

export default async function PortalAppointmentsPage() {
  const p = await getSessionProfile();
  if (!p || !p.patient_id) notFound();
  const supabase = await createClient();
  const { data: appts } = await supabase
    .from("appointments")
    .select("id, start_time, end_time, status, notes_patient, appointment_type")
    .eq("patient_id", p.patient_id)
    .order("start_time", { ascending: true })
    .limit(30);
  return (
    <div>
      <h1 className="text-xl font-semibold">Appointments</h1>
      <ul className="mt-3 divide-y rounded-lg border text-sm">
        {(appts ?? []).map((a) => (
          <li key={a.id} className="p-3">
            <div className="font-medium">{a.start_time ? format(new Date(a.start_time), "PP p") : "—"}</div>
            <div className="text-xs text-slate-500">{a.appointment_type} · {a.status}</div>
            {a.notes_patient ? <div className="text-xs">Message: {a.notes_patient}</div> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
