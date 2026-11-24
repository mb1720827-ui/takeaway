-- Takeaway "Ask": questions about your saves, answered by the laptop worker from your own notes.
-- Run once in the Supabase SQL Editor (safe to re-run).

create table if not exists public.takeaway_questions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  question text not null check (char_length(question) between 3 and 1000),
  scope text not null default 'all' check (scope in ('all', 'collection', 'item')),
  collection_id uuid references public.takeaway_collections (id) on delete cascade,
  item_id uuid references public.takeaway_items (id) on delete cascade,
  status text not null default 'queued' check (status in ('queued', 'answering', 'answered', 'failed')),
  answer jsonb,
  error text,
  attempts int not null default 0,
  created_at timestamptz not null default now(),
  answered_at timestamptz,
  check ((scope = 'collection') = (collection_id is not null) and (scope = 'item') = (item_id is not null))
);

create index if not exists takeaway_questions_queue_idx on public.takeaway_questions (user_id, status, created_at);

alter table public.takeaway_questions enable row level security;
drop policy if exists "Owners manage their rows" on public.takeaway_questions;
create policy "Owners manage their rows" on public.takeaway_questions for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Ready saves ranked by how well they match a search (websearch syntax, e.g. "microservices or kafka").
-- SECURITY INVOKER, so row-level security limits results to the caller's own saves.
create or replace function public.takeaway_search(p_query text, p_limit int default 12)
returns setof public.takeaway_items
language sql stable security invoker set search_path = ''
as $$
  select i.*
  from public.takeaway_items i
  where i.status = 'ready' and i.search @@ websearch_to_tsquery('english', p_query)
  order by ts_rank(i.search, websearch_to_tsquery('english', p_query)) desc, i.processed_at desc
  limit least(greatest(p_limit, 1), 50);
$$;
