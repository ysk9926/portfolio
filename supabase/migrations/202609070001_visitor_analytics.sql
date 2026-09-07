begin;

create extension if not exists pgcrypto;

create table if not exists public.analytics_links (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  company_label text not null check (char_length(company_label) between 1 and 100),
  position text not null default '' check (char_length(position) <= 200),
  submitted_at date,
  note text not null default '' check (char_length(note) <= 1000),
  created_at timestamptz not null default now(),
  disabled_at timestamptz
);

create table if not exists public.analytics_sessions (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique,
  input_hash text not null,
  browser_id uuid,
  link_id uuid references public.analytics_links(id) on delete set null,
  started_at timestamptz not null,
  expires_at timestamptz not null,
  last_received_at timestamptz not null,
  first_path text not null,
  source_origin text,
  utm jsonb not null default '{}'::jsonb check (jsonb_typeof(utm) = 'object'),
  device text not null check (device in ('desktop', 'mobile', 'tablet', 'unknown')),
  browser_family text not null,
  suspected_bot boolean not null default false,
  is_test boolean not null default false,
  check (expires_at > started_at),
  check (last_received_at >= started_at)
);

create table if not exists public.analytics_page_views (
  id uuid primary key,
  session_id uuid not null references public.analytics_sessions(id) on delete cascade,
  path text not null,
  client_started_at timestamptz not null,
  first_received_at timestamptz not null,
  last_received_at timestamptz not null,
  check (last_received_at >= first_received_at)
);

create table if not exists public.analytics_batches (
  id uuid primary key default gen_random_uuid(),
  page_view_id uuid not null references public.analytics_page_views(id) on delete cascade,
  sequence bigint not null check (sequence >= 0),
  payload_hash text not null,
  received_at timestamptz not null,
  dropped_events bigint not null default 0 check (dropped_events >= 0),
  unique (page_view_id, sequence)
);

create table if not exists public.analytics_events (
  batch_id uuid not null references public.analytics_batches(id) on delete cascade,
  ordinal integer not null check (ordinal between 0 and 49),
  type text not null check (type in (
    'page_start', 'exposure_delta', 'region_enter', 'scroll_state', 'interaction',
    'project_open', 'project_close', 'outbound_click'
  )),
  at_ms bigint not null check (at_ms >= 0),
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  primary key (batch_id, ordinal)
);

create table if not exists public.analytics_rate_limits (
  key text primary key,
  window_start timestamptz not null,
  count integer not null check (count >= 0),
  expires_at timestamptz not null
);

create table if not exists public.analytics_deleted_requests (
  request_hash text primary key,
  expires_at timestamptz not null
);

create index if not exists analytics_sessions_link_started
  on public.analytics_sessions(link_id, started_at desc, id desc);
create index if not exists analytics_sessions_started
  on public.analytics_sessions(started_at desc, id desc);
create index if not exists analytics_pages_session
  on public.analytics_page_views(session_id);
create index if not exists analytics_events_type
  on public.analytics_events(type);
create index if not exists analytics_rate_limits_expires
  on public.analytics_rate_limits(expires_at);
create index if not exists analytics_deleted_requests_expires
  on public.analytics_deleted_requests(expires_at);

alter table public.analytics_links enable row level security;
alter table public.analytics_sessions enable row level security;
alter table public.analytics_page_views enable row level security;
alter table public.analytics_batches enable row level security;
alter table public.analytics_events enable row level security;
alter table public.analytics_rate_limits enable row level security;
alter table public.analytics_deleted_requests enable row level security;

revoke all on public.analytics_links from anon, authenticated;
revoke all on public.analytics_sessions from anon, authenticated;
revoke all on public.analytics_page_views from anon, authenticated;
revoke all on public.analytics_batches from anon, authenticated;
revoke all on public.analytics_events from anon, authenticated;
revoke all on public.analytics_rate_limits from anon, authenticated;
revoke all on public.analytics_deleted_requests from anon, authenticated;

grant select, insert, update, delete on public.analytics_links to authenticated;
grant select, insert, update, delete on public.analytics_sessions to authenticated;
grant select, insert, update, delete on public.analytics_page_views to authenticated;
grant select, insert, update, delete on public.analytics_batches to authenticated;
grant select, insert, update, delete on public.analytics_events to authenticated;

grant all on public.analytics_links to service_role;
grant all on public.analytics_sessions to service_role;
grant all on public.analytics_page_views to service_role;
grant all on public.analytics_batches to service_role;
grant all on public.analytics_events to service_role;
grant all on public.analytics_rate_limits to service_role;
grant all on public.analytics_deleted_requests to service_role;

drop policy if exists analytics_admin_only on public.analytics_links;
create policy analytics_admin_only on public.analytics_links
for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists analytics_admin_only on public.analytics_sessions;
create policy analytics_admin_only on public.analytics_sessions
for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists analytics_admin_only on public.analytics_page_views;
create policy analytics_admin_only on public.analytics_page_views
for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists analytics_admin_only on public.analytics_batches;
create policy analytics_admin_only on public.analytics_batches
for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists analytics_admin_only on public.analytics_events;
create policy analytics_admin_only on public.analytics_events
for all to authenticated using (public.is_admin()) with check (public.is_admin());

create or replace function public.analytics_purge(
  p_now timestamptz default now(),
  p_dry_run boolean default false
)
returns table(sessions bigint, rate_limits bigint, tombstones bigint)
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_sessions bigint := 0;
  v_rate_limits bigint := 0;
  v_tombstones bigint := 0;
begin
  if not pg_try_advisory_xact_lock(hashtextextended('portfolio.analytics_purge', 0)) then
    return query select 0::bigint, 0::bigint, 0::bigint;
    return;
  end if;

  if p_dry_run then
    select count(*) into v_sessions from public.analytics_sessions
      where started_at < p_now - interval '90 days';
    select count(*) into v_rate_limits from public.analytics_rate_limits
      where expires_at <= p_now;
    select count(*) into v_tombstones from public.analytics_deleted_requests
      where expires_at <= p_now;
  else
    delete from public.analytics_sessions where started_at < p_now - interval '90 days';
    get diagnostics v_sessions = row_count;
    delete from public.analytics_rate_limits where expires_at <= p_now;
    get diagnostics v_rate_limits = row_count;
    delete from public.analytics_deleted_requests where expires_at <= p_now;
    get diagnostics v_tombstones = row_count;
  end if;

  return query select v_sessions, v_rate_limits, v_tombstones;
end;
$$;

revoke all on function public.analytics_purge(timestamptz, boolean) from public, anon, authenticated;
grant execute on function public.analytics_purge(timestamptz, boolean) to service_role;

commit;
