-- Clinical staff often needs visibility of treatment-related billing context
drop policy if exists "invoices read" on public.invoices;
create policy "invoices read" on public.invoices
  for select using (
    private.is_admin()
    or private.current_role() = 'front_desk'
    or private.is_clinical()
    or (private.is_patient() and patient_id = private.own_patient_id())
  );
