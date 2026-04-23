import {
  addChartEntryAction,
  addClinicalNoteAction,
  addTreatmentItemAction,
  addTreatmentPlanFormAction,
  createDocumentMetaAction,
} from "@/actions/records";
import { createClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/auth";
import { formatUsd } from "@/lib/money";
import { format } from "date-fns";
import Link from "next/link";
import { notFound } from "next/navigation";

const sections = [
  { id: "summary", label: "Summary" },
  { id: "appointments", label: "Appointments" },
  { id: "notes", label: "Clinical notes" },
  { id: "chart", label: "Chart" },
  { id: "treatment", label: "Treatment" },
  { id: "docs", label: "Documents" },
  { id: "forms", label: "Forms" },
] as const;

export default async function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [supabase, me] = await Promise.all([createClient(), getSessionProfile()]);
  const { data: p, error } = await supabase
    .from("patients")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    return <p className="text-sm text-red-600">{error.message}</p>;
  }
  if (!p) notFound();
  const { data: plans } = await supabase
    .from("treatment_plans")
    .select("id, title, status, follow_up_date, created_at")
    .eq("patient_id", id)
    .order("created_at", { ascending: false });
  const planIds = (plans ?? []).map((x) => x.id);
  const { data: allItems = [] } =
    planIds.length > 0
      ? await supabase
          .from("treatment_items")
          .select("id, treatment_plan_id, tooth_number, procedure_code, description, status, estimate_cents, actual_cents, patient_visible, follow_up_date")
          .in("treatment_plan_id", planIds)
          .order("sort_order", { ascending: true })
      : { data: [] };
  const [
    { data: appts },
    { data: notes },
    { data: chart },
    { data: docs },
    { data: forms },
  ] = await Promise.all([
    supabase
      .from("appointments")
      .select("id, start_time, end_time, status, room, appointment_type, notes_patient, notes_staff")
      .eq("patient_id", id)
      .order("start_time", { ascending: false })
      .limit(30),
    supabase
      .from("clinical_notes")
      .select("id, content, is_internal, created_at, author_id")
      .eq("patient_id", id)
      .order("created_at", { ascending: false })
      .limit(40),
    supabase
      .from("dental_chart_entries")
      .select("id, tooth_number, surface, condition_code, notes, updated_at")
      .eq("patient_id", id)
      .order("tooth_number", { ascending: true })
      .limit(200),
    supabase
      .from("documents")
      .select("id, file_name, file_type, category, upload_date, visible_to_patient, storage_path")
      .eq("patient_id", id)
      .order("upload_date", { ascending: false })
      .limit(50),
    supabase
      .from("patient_forms")
      .select("id, form_key, completed_at, data")
      .eq("patient_id", id)
      .order("created_at", { ascending: false }),
  ]);
  const { data: provs } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .in("role", ["dentist", "hygienist", "admin", "front_desk"]);
  const authorMap = new Map((provs ?? []).map((r) => [r.id, r.full_name] as const));
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs text-slate-500">
            <Link className="text-sky-700 underline" href="/patients">Patients</Link>
          </p>
          <h1 className="text-2xl font-semibold">
            {p.last_name}, {p.first_name}
          </h1>
          <p className="text-sm text-slate-500">DOB: {p.dob ? format(new Date(p.dob + "T12:00:00"), "PP") : "—"} · Intake: {p.intake_complete ? "Complete" : "In progress"}</p>
        </div>
        <nav className="flex flex-wrap gap-1 text-sm" aria-label="Patient sections">
          {sections.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="rounded border border-slate-200 bg-white px-2 py-1 dark:border-slate-700"
            >
              {s.label}
            </a>
          ))}
        </nav>
      </div>
      <section id="summary" className="scroll-mt-8 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-sm font-medium">Profile</h2>
        <dl className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
          <div><span className="text-slate-500">Phone:</span> {p.phone}</div>
          <div><span className="text-slate-500">Email:</span> {p.email}</div>
          <div className="sm:col-span-2"><span className="text-slate-500">Allergies:</span> {p.allergies}</div>
          <div className="sm:col-span-2"><span className="text-slate-500">Medical alerts:</span> {p.medical_alerts}</div>
          <div><span className="text-slate-500">Insurance:</span> {p.insurance_provider}</div>
          <div><span className="text-slate-500">Policy:</span> {p.policy_number}</div>
          <div><span className="text-slate-500">Consent:</span> {p.consent_status}</div>
        </dl>
        <p className="mt-2 text-xs text-amber-800 dark:text-amber-200">Field-level redaction in production may hide sensitive attributes per role. See ARCHITECTURE.md.</p>
      </section>
      <section id="appointments" className="scroll-mt-8">
        <h2 className="text-sm font-medium">Appointments</h2>
        <ul className="mt-2 divide-y rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
          {(appts ?? []).length === 0 ? (
            <li className="p-3 text-sm text-slate-500">No appointments. Book from the schedule.</li>
          ) : (
            (appts ?? []).map((a) => (
              <li key={a.id} className="p-3 text-sm">
                <div className="font-medium">{a.start_time ? format(new Date(a.start_time), "PP p") : "—"}</div>
                <div className="text-xs text-slate-500">{a.appointment_type} · {a.status}</div>
                {a.notes_patient ? <div className="text-xs">Patient: {a.notes_patient}</div> : null}
                {a.notes_staff && me && me.role !== "patient" ? (
                  <div className="text-xs text-slate-500">Internal: {a.notes_staff}</div>
                ) : null}
              </li>
            ))
          )}
        </ul>
      </section>
      <section id="notes" className="scroll-mt-8">
        <h2 className="text-sm font-medium">Clinical notes</h2>
        <ul className="mt-2 space-y-2 text-sm">
          {(notes ?? []).map((n) => (
            <li key={n.id} className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
              <div className="text-xs text-slate-500">
                {n.created_at ? format(new Date(n.created_at), "PP p") : ""} · {authorMap.get(n.author_id) ?? "Clinician"}
                {n.is_internal ? " · internal" : " · patient-visible copy"}
              </div>
              <p className="whitespace-pre-wrap text-slate-800 dark:text-slate-100">{n.content}</p>
            </li>
          ))}
        </ul>
        {me && (me.role === "dentist" || me.role === "hygienist" || me.role === "admin") && (
          <form className="mt-3 space-y-2" action={addClinicalNoteAction}>
            <input type="hidden" name="patient_id" value={id} />
            <div className="space-y-1">
              <label className="text-xs font-medium" htmlFor="cnote">Add note</label>
              <textarea className="w-full rounded-md border p-2 text-sm" name="content" id="cnote" required rows={3} />
            </div>
            <label className="flex items-center gap-2 text-xs">
              <input type="checkbox" name="is_internal" defaultChecked className="rounded border" />
              Internal (not visible in patient portal)
            </label>
            <button className="rounded-md bg-sky-600 px-2 py-1 text-sm text-white" type="submit">
              Save
            </button>
          </form>
        )}
      </section>
      <section id="chart" className="scroll-mt-8">
        <h2 className="text-sm font-medium">Odontogram entries</h2>
        <div className="mt-2 overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500">
              <tr>
                <th className="p-2" scope="col">Tooth</th>
                <th className="p-2" scope="col">Surface</th>
                <th className="p-2" scope="col">Code</th>
                <th className="p-2" scope="col">Notes</th>
                <th className="p-2" scope="col">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(chart ?? []).map((c) => (
                <tr key={c.id}>
                  <td className="p-2">{c.tooth_number}</td>
                  <td className="p-2">{c.surface}</td>
                  <td className="p-2">{c.condition_code}</td>
                  <td className="p-2">{c.notes}</td>
                  <td className="p-2 text-xs">{c.updated_at ? format(new Date(c.updated_at), "PP") : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {me && (me.role === "dentist" || me.role === "hygienist" || me.role === "admin") && (
          <form className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap" action={addChartEntryAction}>
            <input type="hidden" name="patient_id" value={id} />
            <input className="w-20 rounded border p-1 text-sm" name="tooth_number" placeholder="1-32" required />
            <input className="w-24 rounded border p-1 text-sm" name="surface" placeholder="M/O" />
            <input className="w-28 rounded border p-1 text-sm" name="condition_code" placeholder="Caries" />
            <input className="min-w-[180px] flex-1 rounded border p-1 text-sm" name="notes" placeholder="Notes" />
            <button className="rounded bg-slate-800 px-2 py-1 text-sm text-white" type="submit">Add</button>
          </form>
        )}
      </section>
      <section id="treatment" className="scroll-mt-8 space-y-4">
        <h2 className="text-sm font-medium">Treatment plans & items</h2>
        <form action={addTreatmentPlanFormAction} className="flex max-w-md flex-col gap-2 text-sm sm:flex-row sm:items-end">
          <input type="hidden" name="patient_id" value={id} />
          <div className="min-w-0 flex-1">
            <label className="text-xs" htmlFor="tplan">New plan</label>
            <input
              className="mt-0.5 w-full rounded border p-1"
              id="tplan"
              name="title"
              placeholder="Plan title"
              defaultValue="Comprehensive care"
            />
          </div>
          <button className="h-8 rounded bg-slate-800 px-2 text-white" type="submit">Create</button>
        </form>
        {(plans ?? []).map((pl) => (
          <div key={pl.id} className="rounded-xl border p-3">
            <div className="text-sm font-medium">
              {pl.title} <span className="text-slate-500">({pl.status})</span>
            </div>
            <ul className="mt-2 space-y-1 text-sm">
              {(allItems ?? []).filter((i) => i.treatment_plan_id === pl.id).map((it) => (
                <li key={it.id} className="flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-100 py-1 last:border-0">
                  <span>
                    {it.tooth_number != null ? `T${it.tooth_number} ` : ""}{it.procedure_code} – {it.description} · {it.status}
                    {!it.patient_visible ? " · not shown to patient" : ""}
                  </span>
                  <span className="text-xs text-slate-500">
                    {formatUsd(it.estimate_cents)} est
                  </span>
                </li>
              ))}
            </ul>
            <form className="mt-2 grid gap-1 text-xs sm:grid-cols-2" action={addTreatmentItemAction}>
              <input type="hidden" name="treatment_plan_id" value={pl.id} />
              <input type="hidden" name="patient_id" value={id} />
              <input className="rounded border p-1" name="tooth_number" placeholder="Tooth" />
              <input className="rounded border p-1" name="procedure_code" placeholder="D0120" />
              <input className="col-span-2 rounded border p-1" name="description" placeholder="Description" required />
              <select className="rounded border p-1" name="status" defaultValue="planned">
                {["planned", "approved", "in_progress", "completed", "cancelled"].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <input className="rounded border p-1" name="estimate_usd" placeholder="e.g. 150.00" required />
              <label className="col-span-2 flex items-center gap-1 text-xs">
                <input type="checkbox" name="patient_visible" defaultChecked className="rounded" />
                Show on patient treatment summary
              </label>
              <div className="col-span-2">
                <button className="rounded bg-slate-100 px-2 py-1 dark:bg-slate-800" type="submit">Add line item</button>
              </div>
            </form>
          </div>
        ))}
      </section>
      <section id="docs" className="scroll-mt-8">
        <h2 className="text-sm font-medium">Documents</h2>
        <p className="text-xs text-slate-500">Uploads use Supabase Storage in production. Here we store a placeholder path only.</p>
        <ul className="mt-2 text-sm">
          {(docs ?? []).map((d) => (
            <li key={d.id} className="border-b border-slate-100 py-1">
              {d.file_name} · {d.category} · {d.visible_to_patient ? "patient visible" : "internal"}
              <div className="text-xs text-slate-500">{d.storage_path}</div>
            </li>
          ))}
        </ul>
        <form className="mt-2 space-y-2 rounded border p-2 text-sm" action={createDocumentMetaAction}>
          <input type="hidden" name="patient_id" value={id} />
          <div className="grid gap-2 sm:grid-cols-2">
            <input className="rounded border p-1" name="file_name" placeholder="file name" defaultValue="consent.pdf" required />
            <input className="rounded border p-1" name="category" placeholder="category" defaultValue="consent" />
          </div>
          <label className="text-xs">
            <input type="checkbox" name="visible_to_patient" className="mr-1 rounded" />
            Visible in patient portal
          </label>
          <button className="rounded bg-slate-200 px-2 py-1 text-xs dark:bg-slate-800" type="submit">Record file (demo path)</button>
        </form>
      </section>
      <section id="forms" className="scroll-mt-8">
        <h2 className="text-sm font-medium">Patient forms</h2>
        <ul className="mt-2 text-sm">
          {(forms ?? []).length === 0 ? (
            <li className="text-slate-500">No form submissions. Patient portal can complete intake form.</li>
          ) : (
            (forms ?? []).map((f) => (
              <li key={f.id} className="border-b border-slate-100 py-1">
                {f.form_key} · {f.completed_at ? "completed" : "draft"}{" "}
                {f.data ? <pre className="text-xs text-slate-500">{JSON.stringify(f.data)}</pre> : null}
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
