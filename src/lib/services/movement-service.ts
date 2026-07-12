import "server-only";
import { getSupabase } from "@/lib/supabase/server";
import { databaseError } from "@/lib/errors";
import type { InventoryMovement } from "@/types/models";

export async function listMovements(limit = 100): Promise<InventoryMovement[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("inventory_movements")
    .select(`
      id,
      item_id,
      trip_id,
      movement_type,
      quantity_delta,
      balance_after,
      note,
      created_at,
      item:items!inventory_movements_item_id_fkey(id, sku, name, unit),
      trip:trips!inventory_movements_trip_id_fkey(id, trip_number)
    `)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw databaseError(error);
  return (data ?? []) as unknown as InventoryMovement[];
}
