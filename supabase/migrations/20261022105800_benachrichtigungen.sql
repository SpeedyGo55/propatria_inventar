-- =====================================================================
-- Benachrichtigungen & Erinnerungen über Edge Functions
-- URL + Secret stehen im Vault (nicht im Code). Ohne Vault-Einträge
-- (lokal, CI) passiert einfach nichts.
-- =====================================================================
create extension if not exists pg_net;
create extension if not exists pg_cron;

-- Edge Function aufrufen. pg_net sendet erst NACH erfolgreichem Commit.
create function intern.edge_aufrufen(p_funktion text, p_body jsonb default '{}')
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_url    text;
  v_secret text;
begin
  select decrypted_secret into v_url    from vault.decrypted_secrets where name = 'functions_url';
  select decrypted_secret into v_secret from vault.decrypted_secrets where name = 'cron_secret';
  if v_url is null or v_secret is null then
    return;
  end if;
  perform net.http_post(
    url     := v_url || '/' || p_funktion,
    body    := p_body,
    headers := jsonb_build_object('Content-Type', 'application/json',
                                  'Authorization', 'Bearer ' || v_secret)
  );
end $$;

-- Neue Bestellung / Statuswechsel → Mail
create function intern.tg_bestellung_benachrichtigen() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    perform intern.edge_aufrufen('benachrichtigen',
      jsonb_build_object('typ', 'neu', 'bestellung_id', new.id));
  elsif new.status is distinct from old.status then
    perform intern.edge_aufrufen('benachrichtigen',
      jsonb_build_object('typ', 'status', 'bestellung_id', new.id, 'status', new.status));
  end if;
  return null;
end $$;

create trigger bestellungen_benachrichtigen
  after insert or update of status on public.bestellungen
  for each row execute function intern.tg_bestellung_benachrichtigen();

-- Zeitpläne (UTC): täglich 06:00 Rückgaben, montags 06:00 Mindestbestand
select cron.schedule('rueckgabe-erinnerung', '0 6 * * *',
  $$ select intern.edge_aufrufen('erinnerungen', '{"job":"rueckgabe"}') $$);
select cron.schedule('mindestbestand-mail', '0 6 * * 1',
  $$ select intern.edge_aufrufen('erinnerungen', '{"job":"mindestbestand"}') $$);
