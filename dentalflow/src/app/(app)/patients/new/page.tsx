import { createPatientAction } from "@/actions/records";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";

export default function NewPatientPage() {
  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-2xl font-semibold">New patient intake</h1>
      <p className="text-sm text-slate-500">Synthetic fields only. Production requires consents, identity verification, and legal process.</p>
      <form className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900" action={createPatientAction}>
        <div className="grid gap-2 sm:grid-cols-2">
          <Input name="first_name" label="First name" required autoComplete="given-name" />
          <Input name="last_name" label="Last name" required autoComplete="family-name" />
        </div>
        <Input name="dob" label="Date of birth" type="date" />
        <div className="grid gap-2 sm:grid-cols-2">
          <Input name="phone" label="Phone" type="tel" autoComplete="tel" />
          <Input name="email" label="Email" type="email" autoComplete="email" />
        </div>
        <Textarea
          name="allergies"
          label="Allergies"
          rows={2}
        />
        <Textarea
          name="medical_alerts"
          label="Medical alerts / conditions"
          rows={2}
        />
        <div className="grid gap-2 sm:grid-cols-2">
          <Input name="insurance_provider" label="Insurance provider" />
          <Input name="policy_number" label="Policy number" />
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <Input name="emergency_contact" label="Emergency contact" />
          <Input name="emergency_phone" label="Emergency phone" type="tel" />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="consent_status">Consent (demo)</label>
          <select
            className="w-full rounded-md border border-slate-300 p-2 text-sm dark:border-slate-600 dark:bg-slate-950"
            name="consent_status"
            id="consent_status"
            defaultValue="pending"
            required
          >
            <option value="pending">Pending</option>
            <option value="obtained">Obtained</option>
            <option value="declined">Declined (demo only)</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button className="rounded-md bg-sky-600 px-3 py-2 text-sm text-white" type="submit">
            Create patient
          </button>
          <Link className="rounded-md border border-slate-300 px-3 py-2 text-sm" href="/patients">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
