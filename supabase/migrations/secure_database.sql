-- The application uses a server-only Supabase secret/service-role key.
-- Public browser clients receive no direct table or function access.
alter table items enable row level security;
alter table vehicles enable row level security;
alter table trips enable row level security;
alter table trip_items enable row level security;
alter table inventory_movements enable row level security;

revoke all on table items from anon, authenticated;
revoke all on table vehicles from anon, authenticated;
revoke all on table trips from anon, authenticated;
revoke all on table trip_items from anon, authenticated;
revoke all on table inventory_movements from anon, authenticated;

grant select, insert, update, delete on table items to service_role;
grant select, insert, update, delete on table vehicles to service_role;
grant select, insert, update, delete on table trips to service_role;
grant select, insert, update, delete on table trip_items to service_role;
grant select, insert, update, delete on table inventory_movements to service_role;
grant usage, select on all sequences in schema public to service_role;

revoke all on function create_inventory_item(text, text, text, numeric, numeric)
  from public, anon, authenticated;
revoke all on function update_inventory_item(uuid, text, text, text, numeric, numeric, boolean, text)
  from public, anon, authenticated;
revoke all on function take_out_trip(uuid, jsonb, text)
  from public, anon, authenticated;
revoke all on function return_trip(uuid, jsonb)
  from public, anon, authenticated;

grant execute on function create_inventory_item(text, text, text, numeric, numeric)
  to service_role;
grant execute on function update_inventory_item(uuid, text, text, text, numeric, numeric, boolean, text)
  to service_role;
grant execute on function take_out_trip(uuid, jsonb, text)
  to service_role;
grant execute on function return_trip(uuid, jsonb)
  to service_role;
