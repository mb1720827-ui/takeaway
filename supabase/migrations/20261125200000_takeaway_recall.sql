-- Takeaway "Recall": spaced-repetition cards generated from each save.
-- Run once in the Supabase SQL Editor (safe to re-run).

alter table public.takeaway_items add column if not exists cards_generated_at timestamptz;

create table if not exists public.takeaway_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  item_id uuid not null references public.takeaway_items (id) on delete cascade,
  question text not null check (char_length(question) between 3 and 500),
  answer text not null check (char_length(answer) between 1 and 1500),
  -- Leitner box: 0 = just learned or forgotten, 6 = well known. Higher boxes come back less often.
  box int not null default 0 check (box between 0 and 6),
  due_at timestamptz not null default now(),
  reviews int not null default 0,
  last_reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists takeaway_cards_due_idx on public.takeaway_cards (user_id, due_at);
create index if not exists takeaway_items_cards_idx on public.takeaway_items (user_id, status) where cards_generated_at is null;

alter table public.takeaway_cards enable row level security;
drop policy if exists "Owners manage their rows" on public.takeaway_cards;
create policy "Owners manage their rows" on public.takeaway_cards for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
