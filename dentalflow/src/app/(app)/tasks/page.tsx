import { createTaskAction } from "@/actions/records";
import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import { getSessionProfile } from "@/lib/auth";
import { notFound } from "next/navigation";

export default async function TasksPage() {
  const [supabase, profile] = await Promise.all([createClient(), getSessionProfile()]);
  if (!profile) notFound();
  const { data: tasks, error } = await supabase
    .from("tasks")
    .select("id, title, description, status, priority, due_date, created_at, patient_id, assigned_to, patients(first_name, last_name)")
    .order("due_date", { ascending: true })
    .limit(100);
  if (error) {
    return <p className="text-sm text-red-600">{error.message}</p>;
  }
  const { data: staff } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .in("role", ["admin", "front_desk", "dentist", "hygienist"])
    .order("full_name", { ascending: true });
  const staffName = new Map((staff ?? []).map((s) => [s.id, s.full_name] as const));
  const { data: patients } = await supabase
    .from("patients")
    .select("id, first_name, last_name")
    .order("last_name", { ascending: true })
    .limit(200);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Staff tasks</h1>
      <p className="text-sm text-slate-500">Notifications for overdue work can be email/SMS in production.</p>
      <form className="max-w-xl space-y-2 rounded-xl border p-4 text-sm" action={createTaskAction}>
        <h2 className="font-medium">New task</h2>
        <input className="w-full rounded border p-1" name="title" placeholder="Title" required />
        <textarea className="w-full rounded border p-1" name="description" rows={2} placeholder="Description" />
        <div className="grid gap-2 sm:grid-cols-2">
          <div>
            <label className="text-xs" htmlFor="asg">Assign to</label>
            <select className="w-full rounded border p-1" name="assigned_to" id="asg" required>
              <option value="">Select…</option>
              {(staff ?? []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.full_name} ({s.role})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs" htmlFor="pat">Patient (optional)</label>
            <select className="w-full rounded border p-1" name="patient_id" id="pat">
              <option value="">—</option>
              {(patients ?? []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.last_name}, {p.first_name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <div>
            <label className="text-xs" htmlFor="dd">Due</label>
            <input className="w-full rounded border p-1" name="due_date" id="dd" type="datetime-local" required />
          </div>
          <div>
            <label className="text-xs" htmlFor="pr">Priority</label>
            <select className="w-full rounded border p-1" name="priority" id="pr" defaultValue="normal">
              {["low", "normal", "high", "urgent"].map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button className="rounded bg-sky-600 px-2 py-1 text-white" type="submit">Create</button>
      </form>
      <ul className="divide-y overflow-hidden rounded-xl border">
        {(tasks ?? []).length === 0 ? (
          <li className="p-4 text-sm text-slate-500">No tasks. Seed the database or add one.</li>
        ) : (
          (tasks ?? []).map((t) => (
              <li key={t.id} className="flex flex-wrap items-start justify-between gap-2 p-3 text-sm">
                <div>
                  <div className="font-medium">{t.title}</div>
                  {t.description ? <div className="text-xs text-slate-500">{t.description}</div> : null}
                  <div className="text-xs text-slate-500">
                    Due: {t.due_date ? format(new Date(t.due_date), "PP p") : "—"} · {t.priority} · to{" "}
                    {t.assigned_to ? staffName.get(t.assigned_to) ?? t.assigned_to : "—"}
                  </div>
                </div>
                <span className="rounded bg-slate-100 px-2 text-xs dark:bg-slate-800">{t.status}</span>
              </li>
            ))
        )}
      </ul>
    </div>
  );
}
