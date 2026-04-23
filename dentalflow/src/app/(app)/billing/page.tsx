import { createInvoiceAction, createInsuranceClaimAction, recordMockPaymentAction } from "@/actions/records";
import { createClient } from "@/lib/supabase/server";
import { formatUsd } from "@/lib/money";
import { format } from "date-fns";
import { getSessionProfile } from "@/lib/auth";
import { notFound } from "next/navigation";
import { onePatientName } from "@/lib/supabase-joins";

export default async function BillingPage() {
  const [supabase, me] = await Promise.all([createClient(), getSessionProfile()]);
  if (!me) notFound();
  const { data: inv } = await supabase
    .from("invoices")
    .select("id, total_cents, balance_cents, due_date, status, created_at, patients(first_name, last_name), patient_id")
    .order("created_at", { ascending: false })
    .limit(100);
  const { data: claims } = await supabase
    .from("insurance_claims")
    .select("id, status, claim_number, patient_id, invoice_id")
    .order("updated_at", { ascending: false })
    .limit(50);
  const { data: patients } = await supabase
    .from("patients")
    .select("id, first_name, last_name")
    .order("last_name", { ascending: true })
    .limit(200);
  const withBalance = (inv ?? []).filter((i) => (i.balance_cents ?? 0) > 0);
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Billing & insurance</h1>
        <p className="text-sm text-slate-500">Mock payments only. No card data is stored.</p>
      </div>
      {me.role === "hygienist" && (
        <p className="text-sm text-amber-800">Your role can view context invoices; orgs should tune who can post payments. Admin/front desk: full collection workflow.</p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <form className="space-y-2 rounded-xl border p-3 text-sm" action={createInvoiceAction}>
          <h2 className="font-medium">New invoice (demo)</h2>
          <label className="text-xs" htmlFor="pinv">Patient</label>
          <select className="w-full rounded border p-1" name="patient_id" id="pinv" required>
            <option value="">Select…</option>
            {(patients ?? []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.last_name}, {p.first_name}
              </option>
            ))}
          </select>
          <input className="w-full rounded border p-1" name="total_usd" placeholder="Total USD e.g. 120.00" required />
          <input className="w-full rounded border p-1" name="due_date" type="date" />
          <button className="rounded bg-sky-600 px-2 py-1 text-white" type="submit">Create invoice</button>
        </form>
        <form className="space-y-2 rounded-xl border p-3 text-sm" action={createInsuranceClaimAction}>
          <h2 className="font-medium">Record insurance claim (demo status)</h2>
          <select className="w-full rounded border p-1" name="patient_id" required>
            <option value="">Patient…</option>
            {(patients ?? []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.last_name}, {p.first_name}
              </option>
            ))}
          </select>
          <select className="w-full rounded border p-1" name="invoice_id" aria-label="Optional invoice link">
            <option value="">Optional invoice…</option>
            {(inv ?? []).map((i) => {
              const pl = onePatientName(i.patients);
              return (
                <option key={i.id} value={i.id}>
                  {pl ? `${pl.last_name}, ` : ""}{i.id.slice(0, 8)}…
                </option>
              );
            })}
          </select>
          <button className="rounded border border-amber-500 bg-amber-50 px-2 py-1 text-amber-900" type="submit">Submit claim record</button>
        </form>
      </div>
      <section>
        <h2 className="text-lg font-medium">Outstanding balance alerts</h2>
        {withBalance.length === 0 ? (
          <p className="text-sm text-slate-500">No open balances in view, or add invoices above.</p>
        ) : (
          <ul className="text-sm text-amber-900">
            {withBalance.map((i) => {
              const pt = onePatientName(i.patients);
              return (
                <li key={i.id}>
                  {pt ? `${pt.last_name}, ${pt.first_name}` : "Patient"}: {formatUsd(i.balance_cents)} due
                  {i.due_date ? ` (due ${format(new Date(i.due_date + "T12:00:00"), "PP")})` : ""}
                </li>
              );
            })}
          </ul>
        )}
      </section>
      <section>
        <h2 className="text-lg font-medium">Invoices</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="text-xs text-slate-500">
              <tr>
                <th className="p-1" scope="col">Patient</th>
                <th className="p-1" scope="col">Total</th>
                <th className="p-1" scope="col">Balance</th>
                <th className="p-1" scope="col">Status</th>
                <th className="p-1" scope="col">Mock payment</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {              (inv ?? []).map((i) => {
                const pt = onePatientName(i.patients);
                return (
                  <tr key={i.id}>
                    <td className="p-1">{pt ? `${pt.last_name}, ${pt.first_name}` : "—"}</td>
                    <td className="p-1">{formatUsd(i.total_cents)}</td>
                    <td className="p-1">{formatUsd(i.balance_cents)}</td>
                    <td className="p-1">{i.status}</td>
                    <td className="p-1">
                      {(i.balance_cents ?? 0) > 0 ? (
                        <form className="flex gap-1" action={recordMockPaymentAction}>
                          <input type="hidden" name="invoice_id" value={i.id} />
                          <input
                            className="w-24 rounded border p-0.5 text-xs"
                            name="amount_usd"
                            placeholder="Amt"
                            defaultValue={String(((i.balance_cents ?? 0) / 100).toFixed(2))}
                          />
                          <button className="rounded bg-slate-200 px-1 text-xs dark:bg-slate-800" type="submit">Pay</button>
                        </form>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
      <section>
        <h2 className="text-lg font-medium">Insurance claims (demo)</h2>
        <ul className="text-sm">
          {(claims ?? []).map((c) => (
            <li key={c.id} className="border-b py-1">
              {c.claim_number} — {c.status} {c.invoice_id ? <span className="text-slate-500">(inv linked)</span> : null}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
