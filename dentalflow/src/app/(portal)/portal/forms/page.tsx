import { submitIntakeFormAction } from "@/actions/portal";
import { getSessionProfile } from "@/lib/auth";
import { notFound } from "next/navigation";

export default async function PortalFormsPage() {
  const p = await getSessionProfile();
  if (!p || !p.patient_id) notFound();
  return (
    <div>
      <h1 className="text-xl font-semibold">Forms</h1>
      <p className="mt-1 text-sm text-slate-500">Complete this demo intake. Nothing here is a legal medical form in production without your counsel.</p>
      <form className="mt-4 max-w-md space-y-2 rounded border p-3 text-sm" action={submitIntakeFormAction}>
        <div>
          <label className="text-xs" htmlFor="concerns">Current concerns (demo)</label>
          <textarea className="mt-0.5 w-full rounded border p-1" name="concerns" id="concerns" rows={3} required />
        </div>
        <button className="rounded bg-sky-600 px-2 py-1 text-white" type="submit">Submit</button>
      </form>
    </div>
  );
}
