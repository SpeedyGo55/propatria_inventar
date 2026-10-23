-- pg_net gehört ins Schema "extensions" statt "public" (Security Advisor 0014).
-- Die Funktionen liegen weiterhin unter net.*, intern.edge_aufrufen bleibt unverändert.
drop extension if exists pg_net;
create extension pg_net with schema extensions;
