begin;

-- Keep existing token_hash values so links already submitted remain valid.
-- Existing rows receive a stable, recoverable alias for the same link ID.
alter table public.analytics_links
  add column if not exists share_token text not null
  default encode(gen_random_bytes(16), 'hex');
create unique index if not exists analytics_links_share_token
  on public.analytics_links(share_token);

commit;
