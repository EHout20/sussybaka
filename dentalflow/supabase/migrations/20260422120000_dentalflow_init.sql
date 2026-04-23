-- DentalFlow: schema, RLS, helpers (synthetic data only; production needs BAA, legal, hosting review)
-- Safe defaults: RLS on; role from profiles table; app_metadata in seed path only (service role)

-- Extensions
create extension if not exists "pgcrypto";

-- Enums
do $$ begin
  create type public.app_role as enum (
    'patient', 'front_desk', 'hygienist', 'dentist', 'admin'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.treatment_status as enum (
    'planned', 'approved', 'in_progress', 'completed', 'cancelled'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.appointment_status as enum (
    'scheduled', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.task_status as enum (
    'open', 'in_progress', 'done', 'cancelled'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.task_priority as enum (
    'low', 'normal', 'high', 'urgent'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.invoice_status as enum (
    'draft', 'sent', 'partial', 'paid', 'overdue', 'void'
  );
exception when duplicate_object then null; end $$;

-- Helper schema
create schema if not exists private;
grant usage on schema private to postgres, service_role, authenticated, anon;

-- Read role from server-controlled profiles table (not user metadata)
create or replace function private.current_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select p.role from public.profiles p where p.id = auth.uid() limit 1;
$$;

create or replace function private.is_patient()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select p.role = 'patient' from public.profiles p where p.id = auth.uid() limit 1), false);
$$;

create or replace function private.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select p.role in ('front_desk','hygienist','dentist','admin') from public.profiles p where p.id = auth.uid() limit 1), false);
$$;

create or replace function private.is_clinical()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select p.role in ('hygienist','dentist','admin') from public.profiles p where p.id = auth.uid() limit 1), false);
$$;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select p.role = 'admin' from public.profiles p where p.id = auth.uid() limit 1), false);
$$;

create or replace function private.own_patient_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select p.patient_id from public.profiles p where p.id = auth.uid() and p.patient_id is not null limit 1;
$$;

-- MVP: clinical staff (dentist/hygienist) can see all patients; assignment scoping is a possible future enhancement
create or replace function private.can_see_patient(p uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    (private.is_patient() and p = private.own_patient_id())
    or (private.is_admin())
    or (private.current_role() = 'front_desk')
    or (private.current_role() in ('hygienist','dentist'));
$$;

grant execute on all functions in schema private to postgres, service_role, authenticated, anon;

-- Core tables
create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  dob date,
  phone text,
  email text,
  address jsonb,
  emergency_contact text,
  emergency_phone text,
  insurance_provider text,
  policy_number text,
  allergies text,
  medical_alerts text,
  consent_status text not null default 'pending',
  intake_complete boolean not null default false,
  user_id uuid unique references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  role public.app_role not null,
  patient_id uuid references public.patients (id) on delete set null
);

create table if not exists public.staff_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  job_title text,
  license_number text,
  created_at timestamptz not null default now()
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  provider_id uuid not null references auth.users (id),
  room text,
  appointment_type text not null default 'hygiene',
  start_time timestamptz not null,
  end_time timestamptz not null,
  status public.appointment_status not null default 'scheduled',
  notes_patient text,
  notes_staff text,
  is_waitlist boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.waitlist_entries (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  notes text,
  priority int not null default 0,
  status text not null default 'active',
  preferred_start timestamptz,
  preferred_end timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.treatment_plans (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  title text not null,
  status text not null default 'draft',
  created_by uuid references auth.users (id),
  follow_up_date date,
  created_at timestamptz not null default now()
);

create table if not exists public.treatment_items (
  id uuid primary key default gen_random_uuid(),
  treatment_plan_id uuid not null references public.treatment_plans (id) on delete cascade,
  tooth_number int,
  procedure_code text,
  description text,
  status public.treatment_status not null default 'planned',
  estimate_cents int not null default 0,
  actual_cents int,
  follow_up_date date,
  sort_order int not null default 0,
  patient_visible boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.clinical_notes (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  author_id uuid not null references auth.users (id),
  content text not null,
  is_internal boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.dental_chart_entries (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  tooth_number int not null,
  surface text,
  condition_code text,
  notes text,
  updated_by uuid references auth.users (id),
  updated_at timestamptz not null default now()
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  file_name text not null,
  file_type text,
  storage_path text,
  category text,
  upload_date timestamptz not null default now(),
  uploaded_by uuid references auth.users (id),
  visible_to_patient boolean not null default false
);

create table if not exists public.patient_forms (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  form_key text not null,
  data jsonb not null default '{}',
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  patient_id uuid references public.patients (id) on delete set null,
  appointment_id uuid references public.appointments (id) on delete set null,
  assigned_to uuid references auth.users (id) on delete set null,
  created_by uuid references auth.users (id),
  due_date timestamptz,
  priority public.task_priority not null default 'normal',
  status public.task_status not null default 'open',
  created_at timestamptz not null default now()
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  total_cents int not null default 0,
  balance_cents int not null default 0,
  due_date date,
  status public.invoice_status not null default 'draft',
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices (id) on delete cascade,
  amount_cents int not null,
  method text not null default 'card_mock',
  reference text,
  paid_at timestamptz not null default now(),
  is_mock boolean not null default true
);

create table if not exists public.insurance_claims (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  invoice_id uuid references public.invoices (id) on delete set null,
  claim_number text,
  status text not null default 'submitted',
  notes text,
  submitted_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments (id) on delete cascade,
  channel text not null default 'email',
  scheduled_for timestamptz not null,
  status text not null default 'pending',
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  table_name text not null,
  record_id uuid,
  action text not null,
  user_id uuid references auth.users (id) on delete set null,
  old_values jsonb,
  new_values jsonb,
  created_at timestamptz not null default now()
);

-- Audit trigger
create or replace function public.log_audit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.audit_logs (table_name, record_id, action, user_id, new_values)
    values (tg_table_name, new.id, 'insert', auth.uid(), to_jsonb(new));
  elsif tg_op = 'UPDATE' then
    insert into public.audit_logs (table_name, record_id, action, user_id, old_values, new_values)
    values (tg_table_name, new.id, 'update', auth.uid(), to_jsonb(old), to_jsonb(new));
  elsif tg_op = 'DELETE' then
    insert into public.audit_logs (table_name, record_id, action, user_id, old_values)
    values (tg_table_name, old.id, 'delete', auth.uid(), to_jsonb(old));
  end if;
  return coalesce(new, old);
end;
$$;

-- Apply to selected PHI-heavy tables
drop trigger if exists tr_patients_audit on public.patients;
create trigger tr_patients_audit
  after insert or update or delete on public.patients
  for each row execute function public.log_audit();

drop trigger if exists tr_clinical_notes_audit on public.clinical_notes;
create trigger tr_clinical_notes_audit
  after insert or update or delete on public.clinical_notes
  for each row execute function public.log_audit();

drop trigger if exists tr_appointments_audit on public.appointments;
create trigger tr_appointments_audit
  after insert or update or delete on public.appointments
  for each row execute function public.log_audit();

-- RLS
alter table public.patients enable row level security;
alter table public.profiles enable row level security;
alter table public.staff_profiles enable row level security;
alter table public.appointments enable row level security;
alter table public.waitlist_entries enable row level security;
alter table public.treatment_plans enable row level security;
alter table public.treatment_items enable row level security;
alter table public.clinical_notes enable row level security;
alter table public.dental_chart_entries enable row level security;
alter table public.documents enable row level security;
alter table public.patient_forms enable row level security;
alter table public.tasks enable row level security;
alter table public.invoices enable row level security;
alter table public.payments enable row level security;
alter table public.insurance_claims enable row level security;
alter table public.reminders enable row level security;
alter table public.audit_logs enable row level security;

-- profiles: staff can read provider names; patients read self; admin all
create policy "profiles self read" on public.profiles
  for select using (id = auth.uid() or private.is_admin() or private.is_staff());

create policy "profiles self update" on public.profiles
  for update using (id = auth.uid() or private.is_admin())
  with check (id = auth.uid() or private.is_admin());

-- staff_profiles: staff or self
create policy "staff_profiles read" on public.staff_profiles
  for select using (user_id = auth.uid() or private.is_admin() or private.is_staff());

create policy "staff_profiles write" on public.staff_profiles
  for all using (private.is_admin())
  with check (private.is_admin());

-- appointments
create policy "appointments select" on public.appointments
  for select using (
    private.is_admin()
    or private.current_role() = 'front_desk'
    or private.is_clinical()
    or (private.is_patient() and patient_id = private.own_patient_id())
  );

create policy "appointments modify staff" on public.appointments
  for insert with check (private.is_admin() or private.current_role() = 'front_desk' or (private.is_clinical() and provider_id = auth.uid()));

create policy "appointments update" on public.appointments
  for update using (
    private.is_admin() or private.current_role() = 'front_desk' or private.is_clinical()
  )
  with check (true);

create policy "appointments delete" on public.appointments
  for delete using (private.is_admin() or private.current_role() = 'front_desk');

-- waitlist
create policy "waitlist all staff" on public.waitlist_entries
  for all using (private.is_admin() or private.current_role() = 'front_desk')
  with check (private.is_admin() or private.current_role() = 'front_desk');

-- treatment plans
create policy "treatment_plans read" on public.treatment_plans
  for select using (
    private.is_admin() or private.current_role() = 'front_desk' or private.is_clinical()
    or (private.is_patient() and patient_id = private.own_patient_id())
  );

create policy "treatment_plans write" on public.treatment_plans
  for all using (private.is_admin() or private.is_clinical() or private.current_role() = 'front_desk')
  with check (private.is_admin() or private.is_clinical() or private.current_role() = 'front_desk');

-- treatment items
create policy "treatment_items read" on public.treatment_items
  for select using (
    private.is_admin() or private.current_role() in ('front_desk','hygienist','dentist')
    or (
      private.is_patient()
      and patient_visible
      and exists (select 1 from public.treatment_plans p where p.id = treatment_plan_id and p.patient_id = private.own_patient_id())
    )
  );

create policy "treatment_items write" on public.treatment_items
  for all using (private.is_admin() or private.is_clinical() or private.current_role() = 'front_desk')
  with check (private.is_admin() or private.is_clinical() or private.current_role() = 'front_desk');

-- clinical notes: patients see only non-internal
create policy "clinical_notes read" on public.clinical_notes
  for select using (
    (private.is_clinical() or private.is_admin() or private.current_role() = 'front_desk')
    or (private.is_patient() and patient_id = private.own_patient_id() and is_internal = false)
  );

create policy "clinical_notes write" on public.clinical_notes
  for all using (private.is_clinical() or private.is_admin())
  with check (private.is_clinical() or private.is_admin());

-- dental chart
create policy "chart read" on public.dental_chart_entries
  for select using (
    private.is_admin() or private.is_clinical() or private.current_role() = 'front_desk'
    or (private.is_patient() and patient_id = private.own_patient_id())
  );

create policy "chart write" on public.dental_chart_entries
  for all using (private.is_clinical() or private.is_admin())
  with check (private.is_clinical() or private.is_admin());

-- documents
create policy "documents read" on public.documents
  for select using (
    private.is_admin() or private.is_clinical() or private.current_role() = 'front_desk'
    or (private.is_patient() and patient_id = private.own_patient_id() and visible_to_patient)
  );

create policy "documents write" on public.documents
  for insert with check (
    private.is_staff()
    or (private.is_patient() and patient_id = private.own_patient_id())
  );

create policy "documents update" on public.documents
  for update using (private.is_staff());

create policy "documents delete" on public.documents
  for delete using (private.is_admin() or private.current_role() = 'front_desk');

-- patient forms
create policy "forms read" on public.patient_forms
  for select using (
    private.is_admin() or private.is_clinical() or private.current_role() = 'front_desk'
    or (private.is_patient() and patient_id = private.own_patient_id())
  );

create policy "forms write" on public.patient_forms
  for all using ((private.is_patient() and patient_id = private.own_patient_id()) or private.is_staff())
  with check ((private.is_patient() and patient_id = private.own_patient_id()) or private.is_staff());

-- tasks
create policy "tasks read" on public.tasks
  for select using (
    private.is_admin()
    or private.is_staff()
    or assigned_to = auth.uid()
  );

create policy "tasks write" on public.tasks
  for all using (private.is_admin() or private.is_staff() or created_by = auth.uid())
  with check (private.is_admin() or private.is_staff());

-- invoices
create policy "invoices read" on public.invoices
  for select using (
    private.is_admin() or private.current_role() = 'front_desk'
    or (private.is_patient() and patient_id = private.own_patient_id())
  );

create policy "invoices write" on public.invoices
  for all using (private.is_admin() or private.current_role() = 'front_desk' or private.is_clinical())
  with check (private.is_admin() or private.current_role() = 'front_desk' or private.is_clinical());

-- payments
create policy "payments read" on public.payments
  for select using (
    private.is_admin() or private.current_role() = 'front_desk'
    or exists (select 1 from public.invoices i where i.id = invoice_id and private.is_patient() and i.patient_id = private.own_patient_id())
  );

create policy "payments write" on public.payments
  for all using (private.is_admin() or private.current_role() = 'front_desk')
  with check (private.is_admin() or private.current_role() = 'front_desk');

-- insurance
create policy "claims read" on public.insurance_claims
  for select using (private.is_admin() or private.current_role() in ('front_desk','hygienist','dentist') or (private.is_patient() and patient_id = private.own_patient_id()));

create policy "claims write" on public.insurance_claims
  for all using (private.is_admin() or private.current_role() = 'front_desk')
  with check (private.is_admin() or private.current_role() = 'front_desk');

-- reminders
create policy "reminders all" on public.reminders
  for all using (private.is_admin() or private.current_role() = 'front_desk' or private.is_clinical())
  with check (private.is_admin() or private.current_role() = 'front_desk' or private.is_clinical());

-- audit: read for staff; inserts only via SECURITY DEFINER trigger (bypasses RLS)
create policy "audit read" on public.audit_logs
  for select using (private.is_admin() or private.is_clinical() or private.current_role() in ('front_desk'));

-- patients: staff may insert before relationship exists; then visibility via can_see
create policy "patients select" on public.patients
  for select using (private.can_see_patient(id));

create policy "patients insert" on public.patients
  for insert with check (private.is_admin() or private.current_role() = 'front_desk' or private.is_clinical());

create policy "patients update" on public.patients
  for update using (private.is_admin() or private.current_role() = 'front_desk' or private.is_clinical() or (private.is_patient() and id = private.own_patient_id()))
  with check (true);

-- Allow patient sign-up to link: typically admin creates. Demo seed creates with service role.
create policy "patients no delete patient" on public.patients
  for delete using (private.is_admin() or private.current_role() = 'front_desk');

-- Indexes
create index if not exists idx_appointments_start on public.appointments (start_time);
create index if not exists idx_appointments_patient on public.appointments (patient_id);
create index if not exists idx_tasks_due on public.tasks (due_date);
create index if not exists idx_tasks_assigned on public.tasks (assigned_to);
create index if not exists idx_invoices_patient on public.invoices (patient_id);
create index if not exists idx_profiles_patient on public.profiles (patient_id);
create index if not exists idx_patients_name on public.patients (last_name, first_name);

comment on table public.patients is 'Synthetic-only in demo. Production: BAAs, encryption, backups, consent.';
comment on table public.audit_logs is 'Immutability/retention in production may require WORM or external SIEM.';

-- New Auth users get a default patient role profile (staff accounts adjusted via seed or admin)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', 'New user'),
    'patient'::public.app_role
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
