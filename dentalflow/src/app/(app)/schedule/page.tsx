import { createClient } from "@/lib/supabase/server";
import { addDays, addWeeks, endOfWeek, format, startOfWeek } from "date-fns";
import { createAppointmentAction, addWaitlistAction } from "@/actions/records";
import Link from "next/link";
import { onePatientName } from "@/lib/supabase-joins";

type Search = { week?: string };

function parseWeekOffset(v: string | undefined) {
  const n = parseInt(String(v), 10);
  if (Number.isNaN(n)) return 0;
  return n;
}

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const sp = await searchParams;
  const offset = parseWeekOffset(sp?.week);
  const anchor = addWeeks(new Date(), offset);
  const wStart = startOfWeek(anchor, { weekStartsOn: 0 });
  const wEnd = endOfWeek(anchor, { weekStartsOn: 0 });
  const supabase = await createClient();
  const { data: appts } = await supabase
    .from("appointments")
    .select("id, patient_id, provider_id, start_time, end_time, status, room, appointment_type, is_waitlist, patients(first_name, last_name)")
    .gte("start_time", wStart.toISOString())
    .lt("start_time", addDays(wEnd, 1).toISOString())
    .order("start_time", { ascending: true });
  const { data: patients } = await supabase
    .from("patients")
    .select("id, first_name, last_name")
    .order("last_name", { ascending: true })
    .limit(200);
  const { data: prov2 } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .in("role", ["dentist", "hygienist"])
    .order("full_name", { ascending: true });
  const providerMap = new Map((prov2 ?? []).map((p) => [p.id, p.full_name] as const));
  const { data: wait } = await supabase
    .from("waitlist_entries")
    .select("id, notes, status, created_at, patients(first_name, last_name)")
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(50);
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Schedule</h1>
          <p className="text-sm text-slate-500">Week of {format(wStart, "MMM d")} – {format(wEnd, "MMM d, yyyy")}</p>
        </div>
        <div className="flex gap-2 text-sm">
          <Link
            className="rounded-md border border-slate-300 px-2 py-1 hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-800"
            href={`/schedule?week=${offset - 1}`}
          >
            Previous week
          </Link>
          <Link
            className="rounded-md border border-slate-300 px-2 py-1 hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-800"
            href="/schedule?week=0"
          >
            This week
          </Link>
          <Link
            className="rounded-md border border-slate-300 px-2 py-1 hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-800"
            href={`/schedule?week=${offset + 1}`}
          >
            Next week
          </Link>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <form
          className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
          action={createAppointmentAction}
        >
          <h2 className="text-sm font-medium">New appointment</h2>
          <p className="text-xs text-slate-500">Reminders: schedule `reminders` records can back automated email/SMS in production; here only stored for demo.</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="text-xs font-medium" htmlFor="patient_id">Patient</label>
            <select
              className="rounded-md border border-slate-300 bg-white p-2 text-sm dark:border-slate-600 dark:bg-slate-950"
              name="patient_id"
              id="patient_id"
              required
            >
              <option value="">Select…</option>
              {(patients ?? []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.last_name}, {p.first_name}
                </option>
              ))}
            </select>
            <label className="text-xs font-medium" htmlFor="provider_id">Provider</label>
            <select
              className="rounded-md border border-slate-300 bg-white p-2 text-sm dark:border-slate-600 dark:bg-slate-950"
              name="provider_id"
              id="provider_id"
              required
            >
              <option value="">Select…</option>
              {(prov2 ?? []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name} ({p.role})
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="text-xs font-medium" htmlFor="room">Room / chair</label>
            <input className="rounded-md border border-slate-300 p-2 text-sm" name="room" id="room" />
            <label className="text-xs font-medium" htmlFor="appointment_type">Type</label>
            <input
              className="rounded-md border border-slate-300 p-2 text-sm"
              name="appointment_type"
              id="appointment_type"
              defaultValue="Prophy / hygiene"
              required
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="text-xs font-medium" htmlFor="start_time">Start (local)</label>
            <input
              className="rounded-md border border-slate-300 p-2 text-sm"
              type="datetime-local"
              name="start_time"
              id="start_time"
              required
            />
            <label className="text-xs font-medium" htmlFor="end_time">End (local)</label>
            <input
              className="rounded-md border border-slate-300 p-2 text-sm"
              type="datetime-local"
              name="end_time"
              id="end_time"
              required
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="text-xs font-medium" htmlFor="status">Status</label>
            <select className="rounded-md border border-slate-300 p-2 text-sm" name="status" id="status" defaultValue="scheduled" required>
              {["scheduled", "checked_in", "in_progress", "completed", "cancelled", "no_show"].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <div className="sm:col-span-2">
              <label className="flex items-center gap-2 text-xs">
                <input type="checkbox" name="is_waitlist" className="rounded border-slate-300" />
                Mark as waitlist / tentative
              </label>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium" htmlFor="notes_patient">Message for patient (optional)</label>
            <textarea className="w-full rounded-md border border-slate-300 p-2 text-sm" name="notes_patient" id="notes_patient" rows={2} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium" htmlFor="notes_staff">Internal scheduling notes</label>
            <textarea className="w-full rounded-md border border-slate-300 p-2 text-sm" name="notes_staff" id="notes_staff" rows={2} />
          </div>
          <button
            className="rounded-md bg-sky-600 px-3 py-2 text-sm text-white hover:bg-sky-700"
            type="submit"
          >
            Book appointment
          </button>
        </form>
        <form
          className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/40"
          action={addWaitlistAction}
        >
          <h2 className="text-sm font-medium">Add to waitlist</h2>
          <label className="text-xs" htmlFor="wpatient">Patient</label>
          <select
            className="w-full rounded-md border border-slate-300 bg-white p-2 text-sm"
            name="patient_id"
            id="wpatient"
            required
          >
            <option value="">Select…</option>
            {(patients ?? []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.last_name}, {p.first_name}
              </option>
            ))}
          </select>
          <label className="text-xs" htmlFor="wnotes">Notes</label>
          <textarea className="w-full rounded-md border p-2 text-sm" name="notes" id="wnotes" rows={2} />
          <button className="rounded-md border border-amber-600 bg-amber-100 px-3 py-2 text-sm text-amber-900" type="submit">
            Add
          </button>
        </form>
      </div>
      <section>
        <h2 className="mb-2 text-lg font-medium">Appointments this week</h2>
        <ul className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
          {(appts ?? []).length === 0 ? (
            <li className="p-4 text-sm text-slate-500">No appointments in this range. Seed the database or add one above.</li>
          ) : (
            (appts ?? []).map((a) => {
              const pt = onePatientName(a.patients);
              return (
                <li key={a.id} className="p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="font-medium">
                        {pt ? `${pt.last_name}, ${pt.first_name}` : "Patient"} · {a.appointment_type}
                        {a.is_waitlist ? (
                          <span className="ml-2 rounded bg-amber-100 px-1.5 text-xs text-amber-900">waitlist</span>
                        ) : null}
                      </div>
                      <div className="text-xs text-slate-500">
                        {a.start_time ? format(new Date(a.start_time), "PP p") : ""} –{" "}
                        {a.end_time ? format(new Date(a.end_time), "p") : ""} · {a.status}
                        {a.room ? ` · room ${a.room}` : ""} ·{" "}
                        {a.provider_id ? (providerMap.get(a.provider_id) ?? "Provider") : "Provider"}
                      </div>
                    </div>
                    {a.patient_id && (
                      <Link className="text-sm text-sky-700 underline" href={`/patients/${a.patient_id}`}>
                        Open patient
                      </Link>
                    )}
                  </div>
                </li>
              );
            })
          )}
        </ul>
      </section>
      <section>
        <h2 className="mb-2 text-lg font-medium">Active waitlist</h2>
        <ul className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-amber-200 bg-amber-50/30 dark:divide-amber-900/30 dark:border-amber-900/30 dark:bg-amber-950/20">
          {(wait ?? []).length === 0 ? (
            <li className="p-4 text-sm text-slate-500">No waitlist entries.</li>
          ) : (
            (wait ?? []).map((w) => {
              const pt = onePatientName(w.patients);
              return (
                <li key={w.id} className="p-3 text-sm">
                  {pt ? `${pt.last_name}, ${pt.first_name}` : "Entry"} – {w.notes}
                </li>
              );
            })
          )}
        </ul>
      </section>
    </div>
  );
}
