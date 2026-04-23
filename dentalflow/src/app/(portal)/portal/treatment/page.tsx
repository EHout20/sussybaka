import { getSessionProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatUsd } from "@/lib/money";
import { notFound } from "next/navigation";

export default async function PortalTreatmentPage() {
  const p = await getSessionProfile();
  if (!p || !p.patient_id) notFound();
  const supabase = await createClient();
  const { data: plans } = await supabase
    .from("treatment_plans")
    .select("id, title, status, follow_up_date")
    .eq("patient_id", p.patient_id)
    .order("created_at", { ascending: false });
  const planIds = (plans ?? []).map((x) => x.id);
  const { data: items } =
    planIds.length > 0
      ? await supabase
          .from("treatment_items")
          .select("id, description, status, estimate_cents, follow_up_date, treatment_plan_id, patient_visible, tooth_number, procedure_code")
          .in("treatment_plan_id", planIds)
          .eq("patient_visible", true)
      : { data: [] as never[] };
  return (
    <div>
      <h1 className="text-xl font-semibold">Treatment plan summary</h1>
      <p className="text-sm text-slate-500">Only items marked patient-visible and non-internal content appear here (RLS).</p>
      {(plans ?? []).map((pl) => (
        <div key={pl.id} className="mt-4 rounded border p-2">
          <h2 className="text-sm font-medium">{pl.title}</h2>
          <ul className="mt-1 text-sm text-slate-600">
            {(items ?? [])
              .filter((i) => i.treatment_plan_id === pl.id)
              .map((it) => (
                <li key={it.id} className="border-b border-slate-100 py-1 last:border-0">
                  {it.tooth_number != null ? `T${it.tooth_number} ` : ""}
                  {it.procedure_code} {it.description} – {it.status} · {formatUsd(it.estimate_cents)} est
                </li>
              ))}
          </ul>
        </div>
      ))}
      {(!plans || plans.length === 0) && (
        <p className="mt-2 text-sm text-slate-500">No active plans, or not yet shared with the portal.</p>
      )}
    </div>
  );
}
