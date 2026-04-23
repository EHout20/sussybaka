import { getSessionProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatUsd } from "@/lib/money";
import { notFound } from "next/navigation";

export default async function PortalBillingPage() {
  const p = await getSessionProfile();
  if (!p || !p.patient_id) notFound();
  const supabase = await createClient();
  const { data: inv } = await supabase
    .from("invoices")
    .select("id, total_cents, balance_cents, status, due_date, created_at")
    .eq("patient_id", p.patient_id)
    .order("created_at", { ascending: false });
  const ids = (inv ?? []).map((i) => i.id);
  const { data: pay2 } =
    ids.length > 0
      ? await supabase
          .from("payments")
          .select("id, amount_cents, paid_at, method, is_mock, invoice_id")
          .in("invoice_id", ids)
      : { data: [] as never[] };
  return (
    <div>
      <h1 className="text-xl font-semibold">Balance summary</h1>
      <p className="text-sm text-slate-500">High-level only; you do not see staff-only accounting notes (RLS + UI).</p>
      <h2 className="mt-4 text-sm font-medium">Open invoices</h2>
      <ul className="text-sm">
        {(inv ?? []).map((i) => (
          <li key={i.id} className="border-b py-1">
            Total {formatUsd(i.total_cents)} · balance {formatUsd(i.balance_cents)} · {i.status}
          </li>
        ))}
      </ul>
      <h2 className="mt-4 text-sm font-medium">Payment history (mock)</h2>
      <ul className="text-sm text-slate-600">
        {(pay2 ?? []).map((m) => (
          <li key={m.id}>
            {formatUsd(m.amount_cents)} on {m.paid_at ? new Date(m.paid_at).toLocaleString() : "—"} ({m.method})
            {m.is_mock ? " · mock" : ""}
          </li>
        ))}
      </ul>
    </div>
  );
}
