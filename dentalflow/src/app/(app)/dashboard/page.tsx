import { createClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/auth";
import { logPostgrest } from "@/lib/supabase/log-error";
import { addDays, format, isBefore, startOfDay } from "date-fns";
import Link from "next/link";
import { onePatientName } from "@/lib/supabase-joins";

export default async function DashboardPage() {
  const [supabase, me] = await Promise.all([createClient(), getSessionProfile()]);
  const today0 = startOfDay(new Date());
  const nextDay = addDays(today0, 1);
  const [
    { count: pCount, error: pErr },
    { data: todays, error: aErr },
    { data: tasks, error: tErr },
  ] = await Promise.all([
    supabase
      .from("patients")
      .select("id", { count: "exact", head: true }),
    supabase
      .from("appointments")
      .select("id, start_time, end_time, status, room, patients(first_name, last_name), appointment_type")
      .gte("start_time", today0.toISOString())
      .lt("start_time", nextDay.toISOString())
      .order("start_time", { ascending: true }),
    supabase
      .from("tasks")
      .select("id, title, status, due_date, priority")
      .in("status", ["open", "in_progress"])
      .order("due_date", { ascending: true })
      .limit(8),
  ]);
  if (pErr) logPostgrest("dashboard:patients_count", pErr);
  if (aErr) logPostgrest("dashboard:appointments_today", aErr);
  if (tErr) logPostgrest("dashboard:tasks_open", tErr);
  const schemaNotReady = [pErr, aErr, tErr].some((e) => e?.code === "PGRST205");
  const overdue = (tasks ?? []).filter(
    (x) => x.due_date && isBefore(new Date(x.due_date), new Date())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-slate-500">Welcome, {me?.full_name}. Today is {format(today0, "PPPP")}.</p>
      </div>
      {schemaNotReady ? (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
          Database tables are not initialized yet. Run the SQL files in
          <span className="mx-1 rounded bg-amber-100 px-1.5 py-0.5 font-mono text-xs dark:bg-amber-900/50">
            supabase/migrations
          </span>
          from the README, then refresh.
        </div>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="text-xs text-slate-500">Patients in system (demo)</div>
          <div className="text-2xl font-semibold">{pCount ?? 0}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="text-xs text-slate-500">Today&rsquo;s appointments</div>
          <div className="text-2xl font-semibold">{todays?.length ?? 0}</div>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/40">
          <div className="text-xs text-amber-800 dark:text-amber-200">Overdue / due tasks (visible)</div>
          <div className="text-2xl font-semibold">{overdue.length}</div>
        </div>
      </div>
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-medium">Today&rsquo;s schedule</h2>
          <Link
            href="/schedule"
            className="inline-flex h-8 items-center justify-center rounded-md border border-slate-300 bg-white px-2 text-xs font-medium text-slate-900 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:hover:bg-slate-800"
          >
            Open schedule
          </Link>
        </div>
        <ul className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
          {(todays ?? []).length === 0 ? (
            <li className="p-4 text-sm text-slate-500">No appointments today.</li>
          ) : (
            (todays ?? []).map((a) => {
              const pn = onePatientName(a.patients);
              return (
              <li key={a.id} className="p-3 text-sm">
                <div className="font-medium text-slate-800 dark:text-slate-100">
                  {pn ? `${pn.first_name} ${pn.last_name}` : "Patient"}
                </div>
                <div className="text-xs text-slate-500">
                  {a.start_time ? format(new Date(a.start_time), "p") : ""} –{" "}
                  {a.end_time ? format(new Date(a.end_time), "p") : ""} · {a.appointment_type} · {a.status}
                </div>
              </li>
            );
            })
          )}
        </ul>
      </section>
      <section>
        <h2 className="mb-2 text-lg font-medium">Open tasks</h2>
        <ul className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
          {(tasks ?? []).length === 0 ? (
            <li className="p-4 text-sm text-slate-500">No open tasks in view.</li>
          ) : (
            (tasks ?? []).map((t) => (
              <li key={t.id} className="flex items-center justify-between p-3 text-sm">
                <div>
                  <div className="font-medium text-slate-800 dark:text-slate-100">{t.title}</div>
                  <div className="text-xs text-slate-500">
                    {t.due_date
                      ? `Due ${format(new Date(t.due_date), "PP p")} · ${t.priority}`
                      : t.priority}
                  </div>
                </div>
                <span className="rounded bg-slate-100 px-2 py-0.5 text-xs dark:bg-slate-800">
                  {t.status}
                </span>
              </li>
            ))
          )}
        </ul>
        <p className="mt-2 text-xs text-slate-500">Tasks and reminders in production can notify assignees; here they are for workflow tracking only.</p>
      </section>
    </div>
  );
}
