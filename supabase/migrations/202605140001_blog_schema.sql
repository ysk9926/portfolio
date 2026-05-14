begin;

create extension if not exists pgcrypto;

create table if not exists public.blog_posts (
  id bigserial primary key,
  slug text not null unique,
  title text not null,
  summary text not null,
  thumbnail text,
  body text not null,
  status text not null check (status in ('draft', 'published')),
  published_at timestamptz,
  view_count integer not null default 0,
  like_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists blog_posts_status_published_at_idx
  on public.blog_posts (status, published_at desc nulls last);

create table if not exists public.blog_post_tags (
  id bigserial primary key,
  post_id bigint not null references public.blog_posts(id) on delete cascade,
  tag text not null,
  unique (post_id, tag)
);

create index if not exists blog_post_tags_tag_idx
  on public.blog_post_tags (tag);

create table if not exists public.blog_comments (
  id bigserial primary key,
  post_id bigint not null references public.blog_posts(id) on delete cascade,
  parent_id bigint references public.blog_comments(id) on delete cascade,
  parent_depth integer not null default 0 check (parent_depth in (0, 1)),
  nickname text not null,
  password_hash text not null,
  body text not null,
  like_count integer not null default 0,
  is_deleted boolean not null default false,
  ip_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists blog_comments_post_id_created_at_idx
  on public.blog_comments (post_id, created_at);

create index if not exists blog_comments_parent_id_idx
  on public.blog_comments (parent_id);

create or replace function public.touch_blog_posts_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_blog_posts_updated_at on public.blog_posts;
create trigger trg_blog_posts_updated_at
before update on public.blog_posts
for each row
execute function public.touch_blog_posts_updated_at();

create or replace function public.touch_blog_comments_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_blog_comments_updated_at on public.blog_comments;
create trigger trg_blog_comments_updated_at
before update on public.blog_comments
for each row
execute function public.touch_blog_comments_updated_at();

alter table public.blog_posts enable row level security;
alter table public.blog_post_tags enable row level security;
alter table public.blog_comments enable row level security;

drop policy if exists blog_posts_read_public on public.blog_posts;
create policy blog_posts_read_public
on public.blog_posts
for select
using (status = 'published' or public.is_admin());

drop policy if exists blog_posts_admin_all on public.blog_posts;
create policy blog_posts_admin_all
on public.blog_posts
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists blog_post_tags_read_all on public.blog_post_tags;
create policy blog_post_tags_read_all
on public.blog_post_tags
for select
using (true);

drop policy if exists blog_post_tags_admin_all on public.blog_post_tags;
create policy blog_post_tags_admin_all
on public.blog_post_tags
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists blog_comments_read_all on public.blog_comments;
create policy blog_comments_read_all
on public.blog_comments
for select
using (true);

drop policy if exists blog_comments_admin_all on public.blog_comments;
create policy blog_comments_admin_all
on public.blog_comments
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create or replace function public.blog_create_comment(
  p_slug text,
  p_parent_id bigint,
  p_nickname text,
  p_password_hash text,
  p_body text,
  p_ip_hash text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_post_id bigint;
  v_parent public.blog_comments%rowtype;
  v_parent_depth integer := 0;
  v_recent_count integer;
  v_new_id bigint;
  v_created_at timestamptz;
begin
  if char_length(coalesce(p_nickname, '')) < 1 or char_length(p_nickname) > 50 then
    raise exception 'invalid_nickname';
  end if;
  if char_length(coalesce(p_body, '')) < 1 or char_length(p_body) > 5000 then
    raise exception 'invalid_body';
  end if;
  if char_length(coalesce(p_password_hash, '')) < 10 then
    raise exception 'invalid_password_hash';
  end if;

  select id into v_post_id
  from public.blog_posts
  where slug = p_slug and status = 'published';

  if v_post_id is null then
    raise exception 'post_not_found';
  end if;

  if p_parent_id is not null then
    select * into v_parent from public.blog_comments where id = p_parent_id;
    if v_parent.id is null or v_parent.post_id <> v_post_id then
      raise exception 'parent_not_found';
    end if;
    if v_parent.parent_depth >= 1 then
      raise exception 'max_depth_exceeded';
    end if;
    v_parent_depth := v_parent.parent_depth + 1;
  end if;

  if p_ip_hash is not null then
    select count(*) into v_recent_count
    from public.blog_comments
    where ip_hash = p_ip_hash
      and created_at > now() - interval '1 minute';
    if v_recent_count >= 5 then
      raise exception 'rate_limited';
    end if;
  end if;

  insert into public.blog_comments (
    post_id, parent_id, parent_depth,
    nickname, password_hash, body, ip_hash
  ) values (
    v_post_id, p_parent_id, v_parent_depth,
    p_nickname, p_password_hash, p_body, p_ip_hash
  )
  returning id, created_at into v_new_id, v_created_at;

  return jsonb_build_object(
    'id', v_new_id,
    'createdAt', v_created_at
  );
end;
$$;

create or replace function public.blog_update_comment(
  p_comment_id bigint,
  p_password_hash text,
  p_body text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing public.blog_comments%rowtype;
begin
  if char_length(coalesce(p_body, '')) < 1 or char_length(p_body) > 5000 then
    raise exception 'invalid_body';
  end if;

  select * into v_existing from public.blog_comments where id = p_comment_id;

  if v_existing.id is null or v_existing.is_deleted then
    raise exception 'comment_not_found';
  end if;

  if v_existing.password_hash <> p_password_hash then
    raise exception 'invalid_password';
  end if;

  update public.blog_comments
  set body = p_body
  where id = p_comment_id;
end;
$$;

create or replace function public.blog_delete_comment(
  p_comment_id bigint,
  p_password_hash text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing public.blog_comments%rowtype;
  v_is_admin boolean := false;
begin
  if auth.uid() is not null then
    v_is_admin := public.is_admin();
  end if;

  select * into v_existing from public.blog_comments where id = p_comment_id;

  if v_existing.id is null then
    raise exception 'comment_not_found';
  end if;

  if not v_is_admin then
    if v_existing.password_hash <> coalesce(p_password_hash, '') then
      raise exception 'invalid_password';
    end if;
  end if;

  update public.blog_comments
  set is_deleted = true,
      body = '',
      password_hash = '__deleted__'
  where id = p_comment_id;
end;
$$;

create or replace function public.blog_toggle_post_like(
  p_slug text,
  p_delta integer
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new_count integer;
begin
  if p_delta not in (-1, 1) then
    raise exception 'invalid_delta';
  end if;

  update public.blog_posts
  set like_count = greatest(0, like_count + p_delta)
  where slug = p_slug and status = 'published'
  returning like_count into v_new_count;

  if v_new_count is null then
    raise exception 'post_not_found';
  end if;

  return v_new_count;
end;
$$;

create or replace function public.blog_toggle_comment_like(
  p_comment_id bigint,
  p_delta integer
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new_count integer;
begin
  if p_delta not in (-1, 1) then
    raise exception 'invalid_delta';
  end if;

  update public.blog_comments
  set like_count = greatest(0, like_count + p_delta)
  where id = p_comment_id and is_deleted = false
  returning like_count into v_new_count;

  if v_new_count is null then
    raise exception 'comment_not_found';
  end if;

  return v_new_count;
end;
$$;

create or replace function public.blog_increment_view(
  p_slug text
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new_count integer;
begin
  update public.blog_posts
  set view_count = view_count + 1
  where slug = p_slug and status = 'published'
  returning view_count into v_new_count;

  if v_new_count is null then
    raise exception 'post_not_found';
  end if;

  return v_new_count;
end;
$$;

grant select on table public.blog_posts to anon, authenticated;
grant select on table public.blog_post_tags to anon, authenticated;
grant select on table public.blog_comments to anon, authenticated;

grant insert, update, delete on table public.blog_posts to authenticated;
grant insert, update, delete on table public.blog_post_tags to authenticated;
grant insert, update, delete on table public.blog_comments to authenticated;

grant execute on function public.blog_create_comment(text, bigint, text, text, text, text) to anon, authenticated;
grant execute on function public.blog_update_comment(bigint, text, text) to anon, authenticated;
grant execute on function public.blog_delete_comment(bigint, text) to anon, authenticated;
grant execute on function public.blog_toggle_post_like(text, integer) to anon, authenticated;
grant execute on function public.blog_toggle_comment_like(bigint, integer) to anon, authenticated;
grant execute on function public.blog_increment_view(text) to anon, authenticated;

commit;
