do $$
declare
  v_cable uuid;
  v_bolts uuid;
  v_pipe uuid;
  v_gloves uuid;
  v_tape uuid;
  v_van uuid;
  v_truck uuid;
  v_trip uuid;
  v_trip_item_cable uuid;
  v_trip_item_bolts uuid;
begin
  select create_inventory_item('CABLE-001', 'Ethernet Cable', 'metre', 100, 20) into v_cable;
  select create_inventory_item('BOLT-010', 'Steel Bolt', 'piece', 250, 50) into v_bolts;
  select create_inventory_item('PIPE-020', 'PVC Pipe', 'metre', 60, 15) into v_pipe;
  select create_inventory_item('GLOVE-001', 'Safety Gloves', 'pair', 40, 10) into v_gloves;
  select create_inventory_item('TAPE-001', 'Electrical Tape', 'roll', 25, 5) into v_tape;

  insert into vehicles (registration, name, type)
  values ('OM-1234', 'Maintenance Van 1', 'Van')
  returning id into v_van;

  insert into vehicles (registration, name, type)
  values ('OM-9012', 'Field Truck 1', 'Truck')
  returning id into v_truck;

  -- One completed trip for history.
  select take_out_trip(
    v_van,
    jsonb_build_array(
      jsonb_build_object('item_id', v_cable, 'qty', 20),
      jsonb_build_object('item_id', v_bolts, 'qty', 30)
    ),
    'Completed sample maintenance job'
  ) into v_trip;

  select id into v_trip_item_cable
  from trip_items where trip_id = v_trip and item_id = v_cable;

  select id into v_trip_item_bolts
  from trip_items where trip_id = v_trip and item_id = v_bolts;

  perform return_trip(
    v_trip,
    jsonb_build_array(
      jsonb_build_object('trip_item_id', v_trip_item_cable, 'qty', 5),
      jsonb_build_object('trip_item_id', v_trip_item_bolts, 'qty', 10)
    )
  );

  -- One trip currently out.
  perform take_out_trip(
    v_truck,
    jsonb_build_array(
      jsonb_build_object('item_id', v_pipe, 'qty', 12),
      jsonb_build_object('item_id', v_gloves, 'qty', 4),
      jsonb_build_object('item_id', v_tape, 'qty', 3)
    ),
    'Sample active field trip'
  );
end
$$;
