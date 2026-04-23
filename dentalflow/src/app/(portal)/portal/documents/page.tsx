import { createDocumentMetaAction } from "@/actions/records";
import { getSessionProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

export default async function PortalDocumentsPage() {
  const p = await getSessionProfile();
  if (!p || !p.patient_id) notFound();
  const supabase = await createClient();
  const { data: docs } = await supabase
    .from("documents")
    .select("id, file_name, category, upload_date, visible_to_patient, storage_path")
    .eq("patient_id", p.patient_id)
    .eq("visible_to_patient", true)
    .order("upload_date", { ascending: false });
  return (
    <div>
      <h1 className="text-xl font-semibold">Documents you can access</h1>
      <ul className="mt-2 text-sm">
        {(docs ?? []).length === 0 ? (
          <li className="text-slate-500">No shared documents. Staff can mark files as patient-visible after upload.</li>
        ) : (
          (docs ?? []).map((d) => (
            <li key={d.id} className="border-b py-1">
              {d.file_name} – {d.category} ({d.storage_path})
            </li>
          ))
        )}
      </ul>
      <h2 className="mt-6 text-sm font-medium">Request upload (metadata record)</h2>
      <form className="mt-2 max-w-sm space-y-1 text-sm" action={createDocumentMetaAction}>
        <input type="hidden" name="patient_id" value={p.patient_id} />
        <input className="w-full rounded border p-1" name="file_name" placeholder="File name" required />
        <input className="w-full rounded border p-1" name="category" defaultValue="upload" />
        <label className="text-xs">
          <input type="checkbox" name="visible_to_patient" defaultChecked className="mr-1" />
          I understand this is a placeholder path, not a real upload until storage is connected.
        </label>
        <button className="rounded bg-slate-200 px-2 py-1 dark:bg-slate-800" type="submit">Add record</button>
      </form>
    </div>
  );
}
