-- ============================================================
-- Minto Pastoral — Supabase schema (Track 2, milestone 3)
--
-- Design note: BUILD 78 already treats storage as a key/value store
-- (window.storage.get/set with one JSON string per key). The fastest,
-- lowest-risk way to make it shared + backed-up is a single KV table.
-- No app logic changes — only the storage backend swaps under it.
--
-- Run this in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- ============================================================

create table if not exists store (
  key         text primary key,
  value       text not null,
  updated_at  timestamptz not null default now()
);

-- Keep updated_at fresh on every write.
create or replace function touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists store_touch on store;
create trigger store_touch
  before update on store
  for each row execute function touch_updated_at();

-- Realtime: let the app hear about changes other devices make.
alter publication supabase_realtime add table store;

-- Row Level Security. We start permissive (any signed-in user can read/write
-- the shared farm book), then tighten later if needed. Enable RLS and add
-- policies once we turn on login (milestone 5). For the first shared trial we
-- can run with a single project anon key; we'll lock this down before wide use.
-- alter table store enable row level security;
-- create policy "team read"  on store for select using (auth.role() = 'authenticated');
-- create policy "team write" on store for all    using (auth.role() = 'authenticated');
