# DentalFlow (demo / MVP)

A full-stack **Next.js 16 (App Router)** + **Supabase (Postgres, Auth, RLS)** app for a small–mid dental office: front desk, clinical staff, admin, and a **patient portal**. All sample data and credentials are **synthetic**—this is not certified for real PHI. Production use requires a **BAA** with your host (e.g. Supabase/enterprise), **legal and privacy review**, **backups**, **encryption in transit and at rest**, and operational policies.

## Features (MVP)

- **Intake** – patient profile, consent flag, insurance fields, document metadata (see Storage in ARCHITECTURE.md)
- **Scheduling** – week view, create appointments, waitlist, provider selection
- **Records** – summary, chart entries (odontogram data model), internal vs patient-visible clinical notes, treatment plans/line items
- **Tasks** – assign to staff, due date, priority
- **Billing** – invoices, **mock** payments, insurance claim records (not a real claims clearinghouse)
- **Portal** – upcoming appointments, forms, own documents, balance summary, treatment items marked patient-visible
- **Audit** – database triggers on selected tables writing to `audit_logs` (see ARCHITECTURE.md for production hardening)

## Prerequisites

- Node 20+ (recommended)
- A **Supabase** project: create one at [supabase.com](https://supabase.com)
- (Optional) [Supabase CLI](https://supabase.com/docs/guides/cli) to apply migrations locally

## Setup

1. **Clone / open** this directory (`dentalflow`).

2. **Environment**
   - Copy `.env.local.example` to `.env.local`
   - From Supabase **API Keys**: **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`, **publishable** key (`sb_publishable_...`) → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, **secret** key (`sb_secret_...`, server-only) → `SUPABASE_SECRET_KEY`  
   - Legacy JWT **anon** / **service_role** still work as `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` if unset. Never put secret / service role in client code or `NEXT_PUBLIC_*`.

3. **Database schema**
   - In Supabase SQL Editor, run the SQL files in order:
     - `supabase/migrations/20260422120000_dentalflow_init.sql`
     - `supabase/migrations/20260422120100_payments_rls_dentist.sql`
     - `supabase/migrations/20260422120200_invoices_read_clinical.sql`  
   - Or, with CLI from this folder: `supabase db push` (after linking a project) or `supabase start` for local.

4. **Email auth in Supabase**
   - In **Authentication → Providers → Email**: enable email/password. For a quick demo you can allow signups or rely only on the seed (recommended: disable public signup in production and provision accounts via admin only).

5. **Seed users and data**

   - Copy `scripts/seed-accounts.example.json` to `scripts/seed-accounts.json` (the latter is gitignored; adjust emails there if you want).
   - Set **`DEMO_SEED_PASSWORD`** in `.env.local` to a strong value. It is only sent to Supabase during seed and sign-in; **Supabase stores password hashes**—nothing reversible is kept in this repo.
   ```bash
   npm install
   npm run db:seed
   ```

6. **Run the app**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) → redirects to sign-in.

## Demo credentials (after seed)

- **Emails and roles** come from `scripts/seed-accounts.json` (see `scripts/seed-accounts.example.json` for the default shape). There is no default password in the codebase: use whatever you set as **`DEMO_SEED_PASSWORD`** in `.env.local`.
- Do not commit `.env.local` or `scripts/seed-accounts.json` if they contain real-looking credentials.

| Role       | Email (default example file)   |
|------------|--------------------------------|
| Admin      | `admin@demo.dentalflow.test`   |
| Front desk | `frontdesk@demo.dentalflow.test` |
| Dentist    | `dentist@demo.dentalflow.test` |
| Hygienist  | `hygienist@demo.dentalflow.test` |
| Patient    | `patient@demo.dentalflow.test` |

- Staff routes: `/dashboard`, `/schedule`, `/patients`, `/billing`, `/tasks`
- Portal (patient): `/portal` and subpages; patients are automatically redirected if they try to open staff routes (middleware + RLS)

## Project layout

- `src/app/(app)/*` – staff UI (server components + server actions)
- `src/app/(portal)/portal/*` – patient portal
- `src/app/(auth)/login` – sign-in
- `src/actions/*` – server actions (validation with Zod)
- `supabase/migrations/*` – schema, RLS, audit triggers, auth `handle_new_user` trigger
- `scripts/seed.ts` – idempotent seed (excluded from app `tsconfig` for builds)
- `scripts/seed-accounts.example.json` – template for demo auth users; copy to `scripts/seed-accounts.json` (gitignored)

## Scripts

| Command        | Description              |
|----------------|--------------------------|
| `npm run dev`  | Next.js dev server       |
| `npm run build`| Production build         |
| `npm run start`| Production server        |
| `npm run db:seed` | Seed with `tsx`      |

## Compliance / safety (read this)

- **This repo is a demo:** do not put real names, MRN, or clinical content in the database.
- **HIPAA / PHIPA-style** readiness is described in **ARCHITECTURE.md** (encryption assumptions, BAA, retention, consents, breach process—not implemented here).
- **Service role** bypasses RLS: only on your server, in CI, and in the seed script—never in the browser.

## Future enhancements (short list)

See **FUTURE.md** for a longer backlog. Highlights:

- EHR/claims integrations, real payment processor (PCI scope), and structured CDT coding
- Full calendar (drag/drop), recurring appointments, and automated SMS/email reminders (Twilio, etc.)
- Supabase **Storage** policies + presigned URLs for true PDF/image upload
- Break-glass / emergency access, stronger audit immutability, and per-field redaction in UI
- Hygienist/dentist **assignment scoping** for patients (RLS) instead of all-clinical broad access
- E-signatures and form builders for legal consents
- Optional **Canvas**-style admin reporting dashboard

## License

This demo codebase is provided as-is for evaluation and local development. Before production use, obtain appropriate licenses for third-party services and complete compliance review.
