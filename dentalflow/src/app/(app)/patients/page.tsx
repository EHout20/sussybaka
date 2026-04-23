import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

type Search = { q?: string };

export default async function PatientsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const q = (sp?.q ?? "").trim();
  const supabase = await createClient();
  let qry = supabase
    .from("patients")
    .select("id, first_name, last_name, email, phone, consent_status, intake_complete")
    .order("last_name", { ascending: true })
    .limit(100);
  if (q.length > 0) {
    qry = supabase
      .from("patients")
      .select("id, first_name, last_name, email, phone, consent_status, intake_complete")
      .or(
        `first_name.ilike.%${q}%,last_name.ilike.%${q}%,email.ilike.%${q}%`
      )
      .order("last_name", { ascending: true })
      .limit(100);
  }
  const { data, error } = await qry;
  if (error) {
    return <p className="text-sm text-red-600">Error loading patients: {error.message}</p>;
  }
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Patients</h1>
          <p className="text-sm text-slate-500">Manage intake, documents, and records (RLS enforces access).</p>
        </div>
        <Link
          href="/patients/new"
          className="inline-flex h-9 items-center rounded-md bg-sky-600 px-3 text-sm text-white hover:bg-sky-700"
        >
          New patient
        </Link>
      </div>
      <form className="max-w-sm" action="/patients" method="get" role="search">
        <label className="sr-only" htmlFor="q">Search</label>
        <input
          className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
          name="q"
          id="q"
          type="search"
          placeholder="Search by name or email"
          defaultValue={q}
        />
        <button className="mt-1 text-xs text-sky-700 underline" type="submit">
          Search
        </button>
      </form>
      {(!data || data.length === 0) ? (
        <p className="text-sm text-slate-500">No patients found. {q ? "Try another query or " : null}
          <Link className="text-sky-700 underline" href="/patients/new">create one</Link>.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500 dark:bg-slate-900">
              <tr>
                <th className="p-2 font-medium" scope="col">Name</th>
                <th className="p-2 font-medium" scope="col">Phone</th>
                <th className="p-2 font-medium" scope="col">Email</th>
                <th className="p-2 font-medium" scope="col">Intake</th>
                <th className="p-2 font-medium" scope="col">Open</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {data.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/50">
                  <td className="p-2 font-medium text-slate-900 dark:text-slate-100">
                    {p.last_name}, {p.first_name}
                  </td>
                  <td className="p-2 text-slate-600 dark:text-slate-300">{p.phone}</td>
                  <td className="p-2 text-slate-600 dark:text-slate-300">{p.email}</td>
                  <td className="p-2 text-slate-600">
                    {p.intake_complete ? "Complete" : "In progress"}{" "}
                    <span className="text-xs text-slate-400">({p.consent_status})</span>
                  </td>
                  <td className="p-2">
                    <Link className="text-sky-700 underline" href={`/patients/${p.id}`}>
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
