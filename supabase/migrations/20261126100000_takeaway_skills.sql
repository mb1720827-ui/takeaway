-- Links a save to a Stride skill it helps with (Stride shares this Supabase project and account).
-- Skipped when Stride isn't set up in this project, so Takeaway still works on its own.
do $$
begin
  if to_regclass('public.stride_plans') is not null then
    alter table public.takeaway_items add column if not exists skill_id uuid references public.stride_plans on delete set null;
    create index if not exists takeaway_items_skill on public.takeaway_items (skill_id) where skill_id is not null;
  end if;
end $$;
