insert into public.abteilung_members (abteilung_id, user_id, role)
select a.id, p.id, 'admin'
from public.abteilungen a, public.profiles p
where a.slug = 'pro-patria' and p.email = 'milo@pfadipropatria.ch';