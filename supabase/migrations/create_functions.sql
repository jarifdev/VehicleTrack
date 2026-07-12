-- Create an item and its initial stock movement in one transaction.
create or replace function create_inventory_item(
  p_sku text,
  p_name text,
  p_unit text,
  p_quantity numeric,
  p_reorder_threshold numeric default 0
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item_id uuid;
begin
  if p_quantity < 0 then
    raise exception 'Initial quantity cannot be negative';
  end if;

  if p_reorder_threshold < 0 then
    raise exception 'Reorder threshold cannot be negative';
  end if;

  insert into items (sku, name, unit, quantity_on_hand, reorder_threshold)
  values (
    upper(trim(p_sku)),
    trim(p_name),
    trim(p_unit),
    p_quantity,
    p_reorder_threshold
  )
  returning id into v_item_id;

  if p_quantity <> 0 then
    insert into inventory_movements (
      item_id,
      movement_type,
      quantity_delta,
      balance_after,
      note
    ) values (
      v_item_id,
      'initial',
      p_quantity,
      p_quantity,
      'Initial stock'
    );
  end if;

  return v_item_id;
end;
$$;

-- Update item metadata and, if needed, record a manual stock adjustment atomically.
create or replace function update_inventory_item(
  p_item_id uuid,
  p_sku text,
  p_name text,
  p_unit text,
  p_quantity numeric,
  p_reorder_threshold numeric,
  p_is_active boolean,
  p_adjustment_note text default 'Manual stock adjustment'
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old_quantity numeric;
  v_delta numeric;
begin
  if p_quantity < 0 then
    raise exception 'Quantity cannot be negative';
  end if;

  if p_reorder_threshold < 0 then
    raise exception 'Reorder threshold cannot be negative';
  end if;

  select quantity_on_hand
  into v_old_quantity
  from items
  where id = p_item_id
  for update;

  if not found then
    raise exception 'Item not found';
  end if;

  v_delta := p_quantity - v_old_quantity;

  update items
  set
    sku = upper(trim(p_sku)),
    name = trim(p_name),
    unit = trim(p_unit),
    quantity_on_hand = p_quantity,
    reorder_threshold = p_reorder_threshold,
    is_active = p_is_active
  where id = p_item_id;

  if v_delta <> 0 then
    insert into inventory_movements (
      item_id,
      movement_type,
      quantity_delta,
      balance_after,
      note
    ) values (
      p_item_id,
      'adjustment',
      v_delta,
      p_quantity,
      nullif(trim(p_adjustment_note), '')
    );
  end if;
end;
$$;

-- Atomically creates a trip, records its lines, and decrements stock.
-- p_items shape: [{"item_id":"<uuid>","qty":5}, ...]
create or replace function take_out_trip(
  p_vehicle_id uuid,
  p_items jsonb,
  p_notes text default null
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_trip_id uuid;
  v_row jsonb;
  v_item_id uuid;
  v_qty numeric;
  v_on_hand numeric;
  v_balance numeric;
  v_item_name text;
  v_is_active boolean;
  v_duplicate_count integer;
begin
  if p_items is null
     or jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) = 0 then
    raise exception 'A trip needs at least one item';
  end if;

  select count(*) - count(distinct value->>'item_id')
  into v_duplicate_count
  from jsonb_array_elements(p_items);

  if v_duplicate_count > 0 then
    raise exception 'The same item cannot be added twice to one trip';
  end if;

  perform 1
  from vehicles
  where id = p_vehicle_id and is_active = true;

  if not found then
    raise exception 'Vehicle not found or inactive';
  end if;

  insert into trips (vehicle_id, notes)
  values (p_vehicle_id, nullif(trim(p_notes), ''))
  returning id into v_trip_id;

  -- Sorting by item id gives concurrent calls a consistent lock order.
  for v_row in
    select value
    from jsonb_array_elements(p_items)
    order by value->>'item_id'
  loop
    begin
      v_item_id := (v_row->>'item_id')::uuid;
      v_qty := (v_row->>'qty')::numeric;
    exception
      when others then
        raise exception 'Every trip line needs a valid item_id and numeric qty';
    end;

    if v_qty <= 0 then
      raise exception 'Quantity must be greater than zero';
    end if;

    select quantity_on_hand, name, is_active
    into v_on_hand, v_item_name, v_is_active
    from items
    where id = v_item_id
    for update;

    if not found then
      raise exception 'Item % not found', v_item_id;
    end if;

    if not v_is_active then
      raise exception 'Item % is archived and cannot be taken out', v_item_name;
    end if;

    if v_on_hand < v_qty then
      raise exception 'Insufficient stock for %: have %, requested %',
        v_item_name, v_on_hand, v_qty;
    end if;

    update items
    set quantity_on_hand = quantity_on_hand - v_qty
    where id = v_item_id
    returning quantity_on_hand into v_balance;

    insert into trip_items (trip_id, item_id, qty_taken)
    values (v_trip_id, v_item_id, v_qty);

    insert into inventory_movements (
      item_id,
      trip_id,
      movement_type,
      quantity_delta,
      balance_after,
      note
    ) values (
      v_item_id,
      v_trip_id,
      'trip_out',
      -v_qty,
      v_balance,
      'Loaded onto vehicle'
    );
  end loop;

  return v_trip_id;
end;
$$;

-- Final reconciliation for one trip.
-- Every trip line must be supplied exactly once.
-- p_returns shape: [{"trip_item_id":"<uuid>","qty":2}, ...]
create or replace function return_trip(
  p_trip_id uuid,
  p_returns jsonb
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row jsonb;
  v_trip_item_id uuid;
  v_qty numeric;
  v_item_id uuid;
  v_qty_taken numeric;
  v_balance numeric;
  v_status trip_status;
  v_expected_lines integer;
  v_submitted_lines integer;
  v_duplicate_count integer;
begin
  if p_returns is null
     or jsonb_typeof(p_returns) <> 'array'
     or jsonb_array_length(p_returns) = 0 then
    raise exception 'Provide a returned quantity for every trip item';
  end if;

  select status
  into v_status
  from trips
  where id = p_trip_id
  for update;

  if not found then
    raise exception 'Trip not found';
  end if;

  if v_status <> 'out' then
    raise exception 'Trip has already been returned';
  end if;

  select count(*)
  into v_expected_lines
  from trip_items
  where trip_id = p_trip_id;

  v_submitted_lines := jsonb_array_length(p_returns);

  if v_submitted_lines <> v_expected_lines then
    raise exception 'A returned quantity is required for every trip item';
  end if;

  select count(*) - count(distinct value->>'trip_item_id')
  into v_duplicate_count
  from jsonb_array_elements(p_returns);

  if v_duplicate_count > 0 then
    raise exception 'Each trip item can only appear once in the return';
  end if;

  -- Lock returned items in item-id order to reduce deadlock risk when
  -- two trips containing overlapping SKUs are returned concurrently.
  for v_row in
    select submitted.value
    from jsonb_array_elements(p_returns) as submitted(value)
    join trip_items existing
      on existing.id = (submitted.value->>'trip_item_id')::uuid
     and existing.trip_id = p_trip_id
    order by existing.item_id
  loop
    begin
      v_trip_item_id := (v_row->>'trip_item_id')::uuid;
      v_qty := (v_row->>'qty')::numeric;
    exception
      when others then
        raise exception 'Every return line needs a valid trip_item_id and numeric qty';
    end;

    if v_qty < 0 then
      raise exception 'Returned quantity cannot be negative';
    end if;

    select item_id, qty_taken
    into v_item_id, v_qty_taken
    from trip_items
    where id = v_trip_item_id and trip_id = p_trip_id
    for update;

    if not found then
      raise exception 'Trip item % was not found on this trip', v_trip_item_id;
    end if;

    if v_qty > v_qty_taken then
      raise exception 'Cannot return more than was taken (taken %, returning %)',
        v_qty_taken, v_qty;
    end if;

    update trip_items
    set qty_returned = v_qty
    where id = v_trip_item_id;

    update items
    set quantity_on_hand = quantity_on_hand + v_qty
    where id = v_item_id
    returning quantity_on_hand into v_balance;

    if v_qty <> 0 then
      insert into inventory_movements (
        item_id,
        trip_id,
        movement_type,
        quantity_delta,
        balance_after,
        note
      ) values (
        v_item_id,
        p_trip_id,
        'trip_return',
        v_qty,
        v_balance,
        'Unused stock returned from vehicle'
      );
    end if;
  end loop;

  update trips
  set status = 'returned', returned_at = now()
  where id = p_trip_id;
end;
$$;
