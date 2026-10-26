-- MFA durchsetzen: Wer einen bestätigten zweiten Faktor hat, braucht eine aal2-Sitzung.
-- Ohne eingerichtete MFA → unverändert wie bisher.
create or replace function public.has_role(p_abteilung uuid, p_min public.member_role)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.abteilung_members m
    where m.abteilung_id = p_abteilung
      and m.user_id = (select auth.uid())
      and m.role >= p_min)
  and (
    coalesce((select auth.jwt()->>'aal'), '') = 'aal2'
    or not exists (
      select 1 from auth.mfa_factors f
      where f.user_id = (select auth.uid()) and f.status = 'verified')
  );
$$;
