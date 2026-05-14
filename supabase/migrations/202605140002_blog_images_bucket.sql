begin;

insert into storage.buckets (id, name, public)
values ('blog-images', 'blog-images', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "blog-images public read" on storage.objects;
create policy "blog-images public read"
on storage.objects
for select
using (bucket_id = 'blog-images');

drop policy if exists "blog-images admin insert" on storage.objects;
create policy "blog-images admin insert"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'blog-images' and public.is_admin());

drop policy if exists "blog-images admin update" on storage.objects;
create policy "blog-images admin update"
on storage.objects
for update
to authenticated
using (bucket_id = 'blog-images' and public.is_admin())
with check (bucket_id = 'blog-images' and public.is_admin());

drop policy if exists "blog-images admin delete" on storage.objects;
create policy "blog-images admin delete"
on storage.objects
for delete
to authenticated
using (bucket_id = 'blog-images' and public.is_admin());

commit;
