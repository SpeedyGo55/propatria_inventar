-- 1. Admin fügt bestehendes Konto per E-Mail zur Abteilung hinzu
create function public.mitglied_hinzufuegen(p_abteilung uuid, p_email text, p_role public.member_role default 'member')
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_user uuid;
begin
  if not public.has_role(p_abteilung, 'admin') then
    raise exception 'Keine Berechtigung' using errcode = '42501';
  end if;
  select id into v_user from public.profiles where lower(email) = lower(trim(p_email));
  if v_user is null then
    raise exception 'Kein Konto mit dieser E-Mail. Lege es zuerst im Supabase-Dashboard an.'
      using hint = 'kein_konto';
  end if;
  insert into public.abteilung_members (abteilung_id, user_id, role)
  values (p_abteilung, v_user, p_role)
  on conflict (abteilung_id, user_id) do update set role = excluded.role;
  return v_user;
end $$;

revoke execute on function public.mitglied_hinzufuegen(uuid, text, public.member_role) from public, anon;
grant  execute on function public.mitglied_hinzufuegen(uuid, text, public.member_role) to authenticated;

-- 2. E-Mail-Änderung in auth.users → profiles nachführen
create function intern.tg_sync_user_email() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end $$;

create trigger on_auth_user_email_changed after update of email on auth.users
  for each row when (old.email is distinct from new.email)
  execute function intern.tg_sync_user_email();

-- 3. Verlauf: Zeitraum lesbar ("28.10.2026 – 30.10.2026")
create or replace function intern.tg_bestellung_log() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  fmt constant text := 'DD.MM.YYYY';
begin
  if tg_op = 'INSERT' then
    insert into public.bestellung_historie (bestellung_id, typ) values (new.id, 'erstellt');
    return null;
  end if;

  if new.status <> old.status then
    insert into public.bestellung_historie (bestellung_id, typ, text)
    values (new.id, new.status::text, case when new.status = 'rejected' then new.ablehnungsgrund end);

    if new.status = 'completed' then
      update public.material m
      set anzahl = greatest(m.anzahl - bi.anzahl, m.damaged + m.lost)
      from public.bestellung_items bi
      where bi.bestellung_id = new.id and bi.material_id = m.id and m.consumable;
    end if;
  end if;

  if new.von <> old.von or new.bis <> old.bis then
    insert into public.bestellung_historie (bestellung_id, typ, text)
    values (new.id, 'zeitraum', format('%s – %s',
      to_char(new.von at time zone 'Europe/Zurich', fmt),
      to_char(new.bis at time zone 'Europe/Zurich', fmt)));
  end if;
  return null;
end $$;
