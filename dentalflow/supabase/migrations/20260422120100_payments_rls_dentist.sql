-- Allow clinical staff to record mock payments in demo; adjust for production least-privilege
drop policy if exists "payments write" on public.payments;
create policy "payments write" on public.payments
  for all using (private.is_admin() or private.current_role() = 'front_desk' or private.is_clinical())
  with check (private.is_admin() or private.current_role() = 'front_desk' or private.is_clinical());
