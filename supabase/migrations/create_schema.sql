create extension if not exists "pgcrypto";
create extension if not exists "citext";

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'trip_status') THEN
    CREATE TYPE trip_status AS ENUM ('out', 'returned');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'inventory_movement_type') THEN
    CREATE TYPE inventory_movement_type AS ENUM (
      'initial',
      'adjustment',
      'trip_out',
      'trip_return'
    );
  END IF;
END
$$;

create table if not exists items (
  id uuid primary key default gen_random_uuid(),
  sku citext not null unique,
  name text not null,
  unit text not null,
  quantity_on_hand numeric(12, 3) not null default 0,
  reorder_threshold numeric(12, 3) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint items_sku_not_blank check (length(trim(sku::text)) > 0),
  constraint items_name_not_blank check (length(trim(name)) > 0),
  constraint items_unit_not_blank check (length(trim(unit)) > 0),
  constraint items_quantity_nonnegative check (quantity_on_hand >= 0),
  constraint items_threshold_nonnegative check (reorder_threshold >= 0)
);

create table if not exists vehicles (
  id uuid primary key default gen_random_uuid(),
  registration citext not null unique,
  name text not null,
  type text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint vehicles_registration_not_blank check (length(trim(registration::text)) > 0),
  constraint vehicles_name_not_blank check (length(trim(name)) > 0),
  constraint vehicles_type_not_blank check (length(trim(type)) > 0)
);

create table if not exists trips (
  id uuid primary key default gen_random_uuid(),
  trip_number bigint generated always as identity unique,
  vehicle_id uuid not null references vehicles(id) on delete restrict,
  status trip_status not null default 'out',
  taken_at timestamptz not null default now(),
  returned_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),

  constraint trips_return_state_consistent check (
    (status = 'out' and returned_at is null)
    or
    (status = 'returned' and returned_at is not null)
  )
);

create table if not exists trip_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  item_id uuid not null references items(id) on delete restrict,
  qty_taken numeric(12, 3) not null,
  qty_returned numeric(12, 3) not null default 0,
  qty_used numeric(12, 3) generated always as (qty_taken - qty_returned) stored,

  constraint trip_items_unique_item_per_trip unique (trip_id, item_id),
  constraint trip_items_taken_positive check (qty_taken > 0),
  constraint trip_items_returned_nonnegative check (qty_returned >= 0),
  constraint trip_items_returned_not_over_taken check (qty_returned <= qty_taken)
);

create table if not exists inventory_movements (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references items(id) on delete restrict,
  trip_id uuid references trips(id) on delete restrict,
  movement_type inventory_movement_type not null,
  quantity_delta numeric(12, 3) not null,
  balance_after numeric(12, 3) not null,
  note text,
  created_at timestamptz not null default now(),

  constraint inventory_movements_balance_nonnegative check (balance_after >= 0)
);

create index if not exists idx_items_active on items(is_active);
create index if not exists idx_items_sku on items(sku);
create index if not exists idx_vehicles_active on vehicles(is_active);
create index if not exists idx_trip_items_trip on trip_items(trip_id);
create index if not exists idx_trip_items_item on trip_items(item_id);
create index if not exists idx_trips_status_taken_at on trips(status, taken_at desc);
create index if not exists idx_movements_item_created on inventory_movements(item_id, created_at desc);
create index if not exists idx_movements_trip on inventory_movements(trip_id);

-- Product rule: a vehicle cannot be out on two trips at the same time.
create unique index if not exists idx_one_open_trip_per_vehicle
  on trips(vehicle_id)
  where status = 'out';

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists items_set_updated_at on items;
create trigger items_set_updated_at
before update on items
for each row execute function set_updated_at();

drop trigger if exists vehicles_set_updated_at on vehicles;
create trigger vehicles_set_updated_at
before update on vehicles
for each row execute function set_updated_at();
