-- Takeaway: saved links, the notes the worker writes about them, and collections.
-- Run once in the Supabase SQL Editor (safe to re-run).

create table if not exists public.takeaway_collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  -- true when the AI proposed it, until the user keeps or renames it
  suggested boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

create table if not exists public.takeaway_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  url text not null check (url ~ '^https?://' and char_length(url) <= 2000),
  platform text not null default 'web' check (char_length(platform) <= 20),
  status text not null default 'queued' check (status in ('queued', 'processing', 'ready', 'failed')),
  review_status text not null default 'new' check (review_status in ('new', 'reviewed', 'applied')),
  collection_id uuid references public.takeaway_collections (id) on delete set null,
  title text,
  author text,
  takeaway text,
  notes jsonb,
  transcript text,
  error text,
  attempts int not null default 0,
  created_at timestamptz not null default now(),
  processed_at timestamptz,
  search tsvector generated always as (
    to_tsvector('english',
      coalesce(title, '') || ' ' || coalesce(takeaway, '') || ' ' || coalesce(transcript, '') || ' ' || coalesce(notes::text, ''))
  ) stored,
  unique (user_id, url)
);

create index if not exists takeaway_items_queue_idx on public.takeaway_items (user_id, status, created_at);
create index if not exists takeaway_items_search_idx on public.takeaway_items using gin (search);

-- One inbox token per user, stored only as a SHA-256 hash. The phone's share shortcut sends the token.
create table if not exists public.takeaway_inbox_tokens (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  token_hash text not null unique,
  created_at timestamptz not null default now()
);

alter table public.takeaway_collections enable row level security;
alter table public.takeaway_items enable row level security;
alter table public.takeaway_inbox_tokens enable row level security;

do $$
declare t text;
begin
  foreach t in array array['takeaway_collections', 'takeaway_items', 'takeaway_inbox_tokens'] loop
    execute format('drop policy if exists "Owners manage their rows" on public.%I', t);
    execute format(
      'create policy "Owners manage their rows" on public.%I for all to authenticated
         using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', t);
  end loop;
end $$;

-- Saves a link for whoever owns the token. Callable with the public key, so the phone needs no login.
-- Saving the same link again returns the existing item (and re-queues it if it had failed).
create or replace function public.takeaway_add_to_inbox(p_token text, p_url text, p_platform text default 'web')
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_user uuid;
  v_id uuid;
begin
  if p_url is null or p_url !~ '^https?://' or char_length(p_url) > 2000 then
    raise exception 'invalid url' using errcode = '22023';
  end if;
  select user_id into v_user from public.takeaway_inbox_tokens
    where token_hash = encode(sha256(convert_to(coalesce(p_token, ''), 'UTF8')), 'hex');
  if v_user is null then
    raise exception 'invalid token' using errcode = '28000';
  end if;
  insert into public.takeaway_items (user_id, url, platform)
    values (v_user, p_url, left(coalesce(p_platform, 'web'), 20))
  on conflict (user_id, url) do update
    set status = case when public.takeaway_items.status = 'failed' then 'queued' else public.takeaway_items.status end
  returning id into v_id;
  return v_id;
end;
$$;

revoke all on function public.takeaway_add_to_inbox(text, text, text) from public;
grant execute on function public.takeaway_add_to_inbox(text, text, text) to anon, authenticated;
