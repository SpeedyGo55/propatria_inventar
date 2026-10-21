-- Doppelte Gruppen entfernen (pro Abteilung + Name den ältesten Eintrag behalten)
delete from public.gruppen g
using public.gruppen d
where g.abteilung_id = d.abteilung_id and g.name = d.name and g.id > d.id;

alter table public.gruppen add constraint gruppen_abteilung_name_key unique (abteilung_id, name);
alter table public.sammlungen add constraint sammlungen_abteilung_name_key unique (abteilung_id, name);

-- Advisor-Warnung: search_path fixieren
alter function intern.tg_set_updated_at() set search_path = '';
