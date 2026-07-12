-- Run after migrations against an empty test database.
-- The transaction is rolled back so the test leaves no data behind.
begin;

do $$
declare
  v_item uuid;
  v_vehicle uuid;
  v_trip uuid;
  v_trip_item uuid;
  v_stock numeric;
  v_used numeric;
begin
  select create_inventory_item('TEST-001', 'Test Item', 'piece', 20, 5)
  into v_item;

  insert into vehicles (registration, name, type)
  values ('TEST-VEHICLE', 'Test Vehicle', 'Van')
  returning id into v_vehicle;

  select take_out_trip(
    v_vehicle,
    jsonb_build_array(jsonb_build_object('item_id', v_item, 'qty', 8)),
    'SQL workflow test'
  ) into v_trip;

  select quantity_on_hand into v_stock from items where id = v_item;
  if v_stock <> 12 then
    raise exception 'Expected stock 12 after take-out, got %', v_stock;
  end if;

  select id into v_trip_item from trip_items where trip_id = v_trip;

  perform return_trip(
    v_trip,
    jsonb_build_array(jsonb_build_object('trip_item_id', v_trip_item, 'qty', 3))
  );

  select quantity_on_hand into v_stock from items where id = v_item;
  if v_stock <> 15 then
    raise exception 'Expected stock 15 after return, got %', v_stock;
  end if;

  select qty_used into v_used from trip_items where id = v_trip_item;
  if v_used <> 5 then
    raise exception 'Expected used quantity 5, got %', v_used;
  end if;
end
$$;

rollback;
