# DentalFlow – architecture and compliance notes

## Stack

- **Frontend & API:** Next.js App Router, React 19, Server Components, **Server Actions** for mutations, Zod for validation, Tailwind CSS v4.
- **Auth & database:** Supabase **Auth** (email/password) + PostgreSQL, **Row Level Security (RLS)** on all application tables. Roles are stored in the `public.profiles` table (not in user-editable JWT `user_metadata` for authorization).
- **New user flow:** A trigger on `auth.users` creates a default `profiles` row with role `patient`. The seed script (service role) then sets staff roles, `patient_id` links, and staff metadata.

## Encryption and transport (assumptions for production)

- **In transit:** TLS 1.2+ between clients and your app, and between app and Supabase. Enforce HSTS in production; avoid mixed content.
- **At rest:** Supabase/Postgres storage on the provider; enable **project-level** encryption and document key management in your BAA. For the strictest model, use **customer-managed keys** if your org requires them (Enteprise/team plans vary).
- **Secrets:** `SUPABASE_SECRET_KEY` (or legacy `SUPABASE_SERVICE_ROLE_KEY`) only on server, CI, and seed. **Never** prefix with `NEXT_PUBLIC_` or commit to the repo.
- **Backups:** Enable automated backups and PITR on production projects; test restore. Document RTO/RPO in your practice’s continuity plan.
- **End-user devices:** PHI on desktops/tablets is an organizational risk; use disk encryption, screen locks, and supported browsers.

## Row Level Security (RLS)

- All listed tables in `20260422120000_dentalflow_init.sql` have RLS enabled.
- **Helper functions** live in the `private` schema with `SECURITY DEFINER` and fixed `search_path` to read `profiles` safely (avoids using editable `user_metadata` for access decisions).
- **Clinical notes:** `is_internal = true` is hidden from the patient portal; patients only see `is_internal = false` rows for their own `patient_id`.
- **Appointments:** `notes_patient` vs `notes_staff` separate patient-facing and internal text.
- **Treatment items:** `patient_visible` flags portal-visible line items; RLS enforces for patients.

Tuning per org: the MVP grants broad read to clinical roles for speed; you may tighten to “patients of record” or “attending provider” only.

## Audit logs

- Triggers on `patients`, `clinical_notes`, and `appointments` insert into `audit_logs` on INSERT/UPDATE/DELETE.
- **Production:** consider append-only storage, external SIEM export, and separation of duties for who can read or purge logs. Supabase/Postgres alone does not make logs tamper-proof.

## File storage (documents)

- The UI records **metadata** and a `storage_path` string. A production deployment should:
  - Create a private **Storage** bucket (e.g. `patient-documents`)
  - Add **RLS policies** for read/write/upsert (Supabase: upsert needs INSERT + SELECT + UPDATE as applicable)
  - Use short-lived **signed URLs** for downloads, and avoid exposing bucket names in client errors

## What this MVP does *not* include

- Real payment card processing (only mock payments).
- A formal **HIPAA/PHIPA** attestation, breach playbook, or BAAs.
- Consent and identity verification for telehealth, minors, or cross-border data flows.
- Rate limiting, abuse detection, or step-up auth for high-risk operations.

**Warning:** before handling real PHI, engage qualified legal and security advisors and complete vendor BAAs, consent artifacts, and workforce training as required in your jurisdiction.

## Session and middleware

- `src/middleware.ts` refreshes the Supabase session and redirects **patients** away from staff routes and **staff** away from `/portal` paths.
- Field-level “redaction” in the UI is a **complement** to RLS, not a replacement—always enforce access in the database.

## Extension points

- **Reminders** table supports automated outreach; wire to Edge Functions or a job runner for SMS/email.
- **Waitlist** and **insurance_claims** are structurally ready for deeper workflows.
