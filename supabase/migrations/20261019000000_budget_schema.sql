-- ============================================================
-- Budget and cashflow — core schema (Phases 0–2 of the budget spec)
--
-- Lives in its own `budget` Postgres schema so it cannot touch the live
-- app's `public.store` table. Nothing in src/App.jsx reads or writes it yet.
--
-- NOT YET APPLIED to the production Supabase project. To apply later:
-- Supabase dashboard -> SQL Editor -> paste this file -> Run, then add
-- `budget` to Settings -> API -> Exposed schemas if the app should reach it.
--
-- Rules carried from the spec and enforced here:
--   * entity is required on every movement, cost and income row
--   * events and the three fact tables are append-only (no UPDATE / DELETE);
--     a correction is a new row, a stage change (committed -> invoiced -> paid)
--     is a new row that `supersedes` the old one
--   * every event carries effective_date and entry_date
--   * the stock reconciliation is derived from stock_movement, never entered
--   * discrepancies stay open and aged; they are never plugged
--   * income is recorded gross; deductions are cost rows
--   * cost.amount_ex_gst = rate x quantity whenever a rate is given
--   * source_ref is "<system>:<id>" (xero:..., bank:..., <provider>:<line>)
-- ============================================================

create schema if not exists budget;
set search_path = budget, public;

-- ---------- enums ----------
create type species           as enum ('cattle', 'sheep');
create type sex               as enum ('male', 'female', 'mixed');
create type entity_type       as enum ('company', 'trust', 'partnership', 'individual');
create type gst_basis         as enum ('cash', 'accruals');
create type gst_cycle         as enum ('monthly', 'quarterly');
create type au_state          as enum ('VIC', 'SA', 'NSW', 'QLD');
create type tenure            as enum ('owned', 'leased');
create type location_type     as enum ('owned_property', 'agistment', 'saleyard', 'transit', 'external');
create type event_type        as enum (
  'joining', 'scanning', 'preg_test', 'lambing', 'calving', 'marking', 'branding',
  'weaning', 'classing', 'shearing', 'muster', 'feeding', 'cutting', 'purchase',
  'sale', 'transfer', 'treatment', 'count'
);
create type direction         as enum ('in', 'out');
create type movement_reason   as enum (
  'birth', 'death', 'purchase', 'sale', 'transfer_in', 'transfer_out',
  'class_change', 'discrepancy'
);
create type stock_confidence  as enum ('assumed', 'scanned', 'marked', 'weaned', 'counted_at_sale');
create type rate_basis        as enum (
  'per_head', 'per_hour', 'per_day', 'per_km', 'per_ha',
  'per_head_per_day', 'per_head_per_week', 'per_dse_per_week', 'per_deck', 'fixed'
);
create type cost_treatment    as enum ('expense', 'balance_sheet', 'capitalise');
create type cost_stage        as enum ('committed', 'invoiced', 'paid');
create type income_stage      as enum ('assumed', 'contracted', 'invoiced', 'received');
create type count_confidence  as enum ('exact', 'good', 'rough');
create type discrepancy_outcome as enum ('resolved_mismuster', 'reclassified_death');
create type agreement_type    as enum ('agistment', 'lease', 'contract', 'facility');
create type payment_freq      as enum ('weekly', 'monthly', 'quarterly', 'annual_advance');
create type price_basis       as enum ('per_head', 'per_kg_live', 'per_kg_dressed', 'per_kg_clean');
create type account_type      as enum ('revenue', 'expense', 'asset', 'liability', 'equity');
create type gst_type          as enum ('standard', 'gst_free', 'input_taxed', 'export');
create type asset_type        as enum ('plant', 'vehicle', 'infrastructure', 'land');
create type loan_rate_type    as enum ('fixed', 'variable');
create type repayment_type    as enum ('p_and_i', 'interest_only');

-- ---------- Phase 0: blockers (structure only; rows come from the spreadsheets) ----------
create table entity (
  code           text primary key,
  name           text not null,
  type           entity_type not null,
  abn            text,
  gst_basis      gst_basis,          -- confirm with accountant
  gst_cycle      gst_cycle,
  state_payroll  au_state[] not null default '{}'
);

create table stock_class (
  code             text primary key,  -- stable, never reused
  name             text not null,
  species          species not null,
  sex              sex,
  age_band         text,
  breeding         boolean,
  app_class        text,               -- the class name in the app (NEW_CLASSES), the master list
  unique (species, app_class)
);

-- The spec puts one `becomes` on each class, but transitions branch
-- (M/S weaners become heifers or steers), so they get their own table.
create table class_transition (
  from_class       text not null references stock_class (code),
  to_class         text not null references stock_class (code),
  at_event         event_type,          -- the event that triggers it, e.g. weaning
  transition_rule  text,
  primary key (from_class, to_class)
);

-- The app keeps status (Joined, PTIC, Wet, Dry...) apart from class, and its
-- DSE depends on both. status = '' is the class's plain value, used for any
-- status not listed (matches dseFor in the app).
create table class_dse (
  stock_class  text not null references stock_class (code),
  status       text not null default '',
  dse          numeric not null check (dse >= 0),
  primary key (stock_class, status)
);

-- ---------- Phase 1.1: reference tables ----------
create table property (
  code      text primary key,
  name      text not null,
  entity    text not null references entity (code),
  state     au_state not null,
  pic       text,
  tenure    tenure not null,
  area_ha   numeric check (area_ha >= 0),
  app_name  text unique             -- the property's name in the app (store key settings-v5.properties)
);

-- Paddock names repeat across properties, so the code must be globally unique
-- (e.g. "MAG-LD-HENRYS"); (property, name) is unique too.
create table paddock (
  code      text primary key,
  property  text not null references property (code),
  name      text not null,
  area_ha   numeric not null check (area_ha >= 0),
  unique (property, name)
);

create table location (
  code      text primary key,
  type      location_type not null,
  property  text references property (code),
  name      text not null,
  check ((type = 'owned_property') = (property is not null))
);

-- Referenced by the spec but never defined there. Minimal on purpose:
-- the app stays authoritative for mobs; app_mob_id links back to it.
create table mob (
  code         text primary key,
  name         text not null,
  entity       text not null references entity (code),
  stock_class  text references stock_class (code),
  app_mob_id   text unique
);

-- ---------- Phase 2 reference tables (needed by the fact tables' keys) ----------
create table gst_code (
  code  text primary key,
  rate  numeric not null check (rate in (0, 0.10)),
  type  gst_type not null
);

create table account (                    -- mirror Xero's chart of accounts
  code         text primary key,
  name         text not null,
  type         account_type not null,
  gst_default  text references gst_code (code)
);

create table asset (
  code            text primary key,
  name            text not null,
  entity          text not null references entity (code),
  type            asset_type not null,
  xero_asset_id   text unique,          -- same id as Xero's fixed asset register
  property        text references property (code),
  purchase_date   date,
  purchase_cost   numeric,
  usage_hours     numeric
);

create table loan (
  code            text primary key,
  entity          text not null references entity (code),
  provider        text not null,
  principal       numeric not null,
  rate            numeric not null,
  rate_type       loan_rate_type not null,
  repayment_type  repayment_type not null,
  term_months     integer not null check (term_months > 0),
  repayment_freq  payment_freq not null,
  "limit"         numeric,
  covenant_notes  text
);

create table trading_account (
  code                 text primary key,
  entity               text not null references entity (code),
  provider             text not null,
  is_finance_facility  boolean not null,
  is_agent_account     boolean not null,
  rate                 numeric,
  "limit"              numeric,
  purchase_terms_days  integer
);

create table scenario (
  code          text primary key,
  name          text not null,
  base_version  integer not null default 0   -- which base version it ran against
);
insert into scenario (code, name) values ('base', 'Base');

-- ---------- Phase 1.2: events ----------
create table event (
  id              uuid primary key default gen_random_uuid(),
  type            event_type not null,
  entity          text not null references entity (code),
  effective_date  date not null,            -- when it happened in the paddock
  entry_date      date not null default current_date,  -- when it was keyed in
  stock_class     text references stock_class (code),
  mob             text references mob (code),
  location        text references location (code),
  paddock         text references paddock (code),
  corrects        uuid references event (id),  -- set on a correction entry
  notes           text,
  created_at      timestamptz not null default now()
);

-- ---------- Phase 1.3: the three fact tables ----------
create table stock_movement (
  id             uuid primary key default gen_random_uuid(),
  event          uuid not null references event (id),
  entity         text not null references entity (code),
  stock_class    text not null references stock_class (code),
  direction      direction not null,
  reason         movement_reason not null,
  head           integer not null check (head > 0),
  location_from  text references location (code),
  location_to    text references location (code),
  owned          boolean not null,          -- false = on hand, owned by someone else
  weight_kg      numeric check (weight_kg >= 0),
  confidence     stock_confidence,
  tag_id         text,                      -- NLIS, Phase 5
  source_ref     text check (source_ref ~ '^[a-z0-9_-]+:.+$'),
  created_at     timestamptz not null default now(),
  check (
    (reason in ('birth', 'purchase', 'transfer_in') and direction = 'in') or
    (reason in ('death', 'sale', 'transfer_out')   and direction = 'out') or
    reason in ('class_change', 'discrepancy')
  ),
  -- the reconciliation finds the property from the location on the side that changed
  check ((direction = 'in' and location_to is not null) or (direction = 'out' and location_from is not null))
);

create table cost (
  id             uuid primary key default gen_random_uuid(),
  event          uuid references event (id),        -- null for overheads
  entity         text not null references entity (code),
  account_code   text not null references account (code),
  amount_ex_gst  numeric not null,
  gst_code       text not null references gst_code (code),
  rate           numeric,
  rate_basis     rate_basis,
  quantity       numeric,
  stock_class    text references stock_class (code),
  mob            text references mob (code),
  property       text references property (code),   -- not in the spec; see PR notes
  paddock        text references paddock (code),
  treatment      cost_treatment not null,
  asset          text references asset (code),
  stage          cost_stage not null,
  due_date       date,
  paid_date      date,
  supersedes     uuid unique references cost (id),  -- previous rung of the same cost
  source_ref     text check (source_ref ~ '^[a-z0-9_-]+:.+$'),
  created_at     timestamptz not null default now(),
  check ((rate is null) = (rate_basis is null)),
  check (rate is null or quantity is null or amount_ex_gst = round(rate * quantity, 2)),
  check (stage <> 'paid' or paid_date is not null)
);

create table income (
  id             uuid primary key default gen_random_uuid(),
  event          uuid references event (id),
  entity         text not null references entity (code),
  account_code   text not null references account (code),
  amount_ex_gst  numeric not null,          -- GROSS: before commission, freight, levies
  gst_code       text not null references gst_code (code),
  stock_class    text references stock_class (code),
  head           integer check (head >= 0),
  weight_kg      numeric check (weight_kg >= 0),
  stage          income_stage not null,
  expected_date  date,
  received_date  date,
  supersedes     uuid unique references income (id),
  source_ref     text check (source_ref ~ '^[a-z0-9_-]+:.+$'),
  created_at     timestamptz not null default now(),
  check (stage <> 'received' or received_date is not null)
);

-- ---------- Phase 1.4: agreements ----------
create table agreement (
  code          text primary key,
  type          agreement_type not null,
  entity        text not null references entity (code),
  counterparty  text not null,
  rate          numeric not null,
  rate_basis    rate_basis not null,
  start_date    date not null,
  end_date      date,
  notice_date   date,
  payment_freq  payment_freq,
  area_ha       numeric check (area_ha >= 0),
  location      text references location (code),
  check (end_date is null or end_date >= start_date),
  check (notice_date is null or end_date is null or notice_date <= end_date)
);

-- ---------- Phase 1.6: assumptions and pricing ----------
create table assumption (
  id           uuid primary key default gen_random_uuid(),
  key          text not null,
  entity       text references entity (code),
  property     text references property (code),
  stock_class  text references stock_class (code),
  period       text not null check (period ~ '^\d{4}(-(0[1-9]|1[0-2]))?$'),
  value        numeric not null,
  scenario     text not null default 'base' references scenario (code),
  unique nulls not distinct (key, entity, property, stock_class, period, scenario)
);

create table price (
  id           uuid primary key default gen_random_uuid(),
  stock_class  text not null references stock_class (code),
  period       text not null check (period ~ '^\d{4}(-(0[1-9]|1[0-2]))?$'),
  basis        price_basis not null,
  value        numeric not null,
  scenario     text not null default 'base' references scenario (code),
  unique (stock_class, period, basis, scenario)
);

-- ---------- Phase 1.8: discrepancies ----------
-- The register of open counts. Its effect on head is posted as a
-- stock_movement with reason 'discrepancy' on the same event, so the
-- reconciliation sees it once (not twice).
create table discrepancy (
  id                uuid primary key default gen_random_uuid(),
  event             uuid not null references event (id),   -- the count that found it
  entity            text not null references entity (code),
  property          text not null references property (code),
  stock_class       text not null references stock_class (code),
  head              integer not null check (head <> 0),     -- signed: negative = missing
  opened_date       date not null,
  count_confidence  count_confidence not null,
  created_at        timestamptz not null default now()
);

-- Resolution is its own append-only row so the open item is never edited.
create table discrepancy_resolution (
  discrepancy     uuid primary key references discrepancy (id),
  outcome         discrepancy_outcome not null,
  resolved_event  uuid not null references event (id),
  resolved_date   date not null,
  created_at      timestamptz not null default now()
);

-- ---------- append-only enforcement ----------
create function forbid_change() returns trigger language plpgsql as $$
begin
  raise exception '% is append-only: add a correcting row instead of %', tg_table_name, lower(tg_op);
end;
$$;

do $$
declare t text;
begin
  foreach t in array array['event', 'stock_movement', 'cost', 'income', 'discrepancy', 'discrepancy_resolution'] loop
    execute format('create trigger %I_append_only before update or delete on %I for each row execute function forbid_change()', t, t);
  end loop;
end;
$$;

-- A superseding row must move up the confidence ladder (or stay level) and
-- keep the same entity.
create function check_supersedes() returns trigger language plpgsql as $$
declare old_stage text; old_entity text;
begin
  if new.supersedes is null then return new; end if;
  execute format('select stage::text, entity from %I where id = $1', tg_table_name)
    into old_stage, old_entity using new.supersedes;
  if old_entity <> new.entity then
    raise exception '% row % supersedes a row in another entity', tg_table_name, new.id;
  end if;
  if tg_table_name = 'cost' then
    if new.stage::text::cost_stage < old_stage::cost_stage then
      raise exception 'cost stage cannot go back from % to %', old_stage, new.stage;
    end if;
  else
    if new.stage::text::income_stage < old_stage::income_stage then
      raise exception 'income stage cannot go back from % to %', old_stage, new.stage;
    end if;
  end if;
  return new;
end;
$$;
create trigger cost_supersedes   before insert on cost   for each row execute function check_supersedes();
create trigger income_supersedes before insert on income for each row execute function check_supersedes();

-- ---------- current-state views ----------
create view cost_current as
  select c.* from cost c where not exists (select 1 from cost n where n.supersedes = c.id);

create view income_current as
  select i.* from income i where not exists (select 1 from income n where n.supersedes = i.id);

create view discrepancy_status as
  select d.*,
         coalesce(r.outcome::text, 'open') as status,
         r.resolved_event,
         r.resolved_date,
         case when r.discrepancy is null then current_date - d.opened_date end as age_days
    from discrepancy d
    left join discrepancy_resolution r on r.discrepancy = d.id;

-- ---------- Phase 1.7: stock reconciliation (derived) ----------
-- One row per entity x property x stock_class x month for owned head on
-- owned country, from the first month with a movement to the current month.
create view stock_reconciliation as
with mv as (
  select m.entity,
         l.property,
         m.stock_class,
         date_trunc('month', e.effective_date)::date as month,
         m.direction,
         m.reason,
         m.head
    from stock_movement m
    join event e on e.id = m.event
    join location l on l.code = case when m.direction = 'in' then m.location_to else m.location_from end
   where m.owned and l.property is not null
),
monthly as (
  select entity, property, stock_class, month,
         sum(head) filter (where reason = 'birth')                             as births,
         sum(head) filter (where reason = 'death')                             as deaths,
         sum(head) filter (where reason = 'purchase')                          as purchases,
         sum(head) filter (where reason = 'sale')                              as sales,
         sum(head) filter (where reason = 'transfer_in')                       as transfers_in,
         sum(head) filter (where reason = 'transfer_out')                      as transfers_out,
         sum(head) filter (where reason = 'class_change' and direction = 'in')  as class_in,
         sum(head) filter (where reason = 'class_change' and direction = 'out') as class_out,
         sum(case when direction = 'out' then head else -head end)
           filter (where reason = 'discrepancy')                               as discrepancy_open
    from mv
   group by 1, 2, 3, 4
),
grid as (
  select k.entity, k.property, k.stock_class, gs::date as month
    from (select entity, property, stock_class, min(month) as first_month
            from monthly group by 1, 2, 3) k
   cross join lateral generate_series(
           k.first_month,
           greatest(date_trunc('month', current_date)::date, (select max(month) from monthly)),
           interval '1 month') gs
),
filled as (
  select g.entity, g.property, g.stock_class, g.month,
         coalesce(births, 0) as births, coalesce(deaths, 0) as deaths,
         coalesce(purchases, 0) as purchases, coalesce(sales, 0) as sales,
         coalesce(transfers_in, 0) as transfers_in, coalesce(transfers_out, 0) as transfers_out,
         coalesce(class_in, 0) as class_in, coalesce(class_out, 0) as class_out,
         coalesce(discrepancy_open, 0) as discrepancy_open
    from grid g
    left join monthly m using (entity, property, stock_class, month)
),
net as (
  select f.*,
         births - deaths + purchases - sales + transfers_in - transfers_out
           + class_in - class_out - discrepancy_open as net_change
    from filled f
)
select entity, property, stock_class, month,
       coalesce(sum(net_change) over w_prior, 0)::integer as opening_head,
       births, deaths, purchases, sales, transfers_in, transfers_out,
       class_in, class_out, discrepancy_open,
       sum(net_change) over w_to_date::integer as closing_head
  from net
window w_prior   as (partition by entity, property, stock_class order by month
                     rows between unbounded preceding and 1 preceding),
       w_to_date as (partition by entity, property, stock_class order by month
                     rows between unbounded preceding and current row);

-- The balance rule as a failing test: any row here is a break.
create view stock_reconciliation_breaks as
  select r.*,
         case when r.closing_head < 0 then 'negative closing head'
              when r.opening_head <> r.prior_closing then 'opening does not equal last month''s closing'
              else 'closing does not equal opening plus movements' end as problem
    from (select s.*,
                 coalesce(lag(s.closing_head) over (
                   partition by s.entity, s.property, s.stock_class order by s.month), 0) as prior_closing
            from stock_reconciliation s) r
   where r.closing_head < 0
      or r.opening_head <> r.prior_closing
      or r.closing_head <> r.opening_head + r.births - r.deaths + r.purchases - r.sales
                           + r.transfers_in - r.transfers_out + r.class_in - r.class_out
                           - r.discrepancy_open;

-- ---------- access: same rule as public.store (signed-in team only) ----------
grant usage on schema budget to authenticated;
grant select, insert on all tables in schema budget to authenticated;
grant update, delete on entity, stock_class, property, paddock, location, mob, gst_code,
  account, asset, loan, trading_account, scenario, agreement, assumption, price to authenticated;

do $$
declare t text;
begin
  for t in select tablename from pg_tables where schemaname = 'budget' loop
    execute format('alter table budget.%I enable row level security', t);
    execute format('create policy "team access" on budget.%I for all to authenticated using (true) with check (true)', t);
  end loop;
end;
$$;

-- views run with the caller's rights so RLS on the tables still applies
alter view cost_current               set (security_invoker = true);
alter view income_current             set (security_invoker = true);
alter view discrepancy_status         set (security_invoker = true);
alter view stock_reconciliation       set (security_invoker = true);
alter view stock_reconciliation_breaks set (security_invoker = true);
