import "server-only";
import { getSupabase } from "@/lib/supabase/server";
import { databaseError } from "@/lib/errors";
import type { Item } from "@/types/models";

export interface DashboardData {
  activeItemCount: number;
  activeVehicleCount: number;
  tripsOutCount: number;
  lowStockItems: Item[];
}

export async function getDashboardData(): Promise<DashboardData> {
  const supabase = getSupabase();
  const [itemsResult, vehiclesResult, tripsResult] = await Promise.all([
    supabase.from("items").select("*", { count: "exact" }).eq("is_active", true),
    supabase
      .from("vehicles")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true),
    supabase
      .from("trips")
      .select("id", { count: "exact", head: true })
      .eq("status", "out"),
  ]);

if (itemsResult.error) {
  console.error(
    "ITEMS DATABASE ERROR:",
    JSON.stringify(itemsResult.error, null, 2),
  );

  throw databaseError(itemsResult.error);
}

if (vehiclesResult.error) {
  console.error(
    "VEHICLES DATABASE ERROR:",
    JSON.stringify(vehiclesResult.error, null, 2),
  );

  throw databaseError(vehiclesResult.error);
}

if (tripsResult.error) {
  console.error(
    "TRIPS DATABASE ERROR:",
    JSON.stringify(tripsResult.error, null, 2),
  );

  throw databaseError(tripsResult.error);
}
  const items = (itemsResult.data ?? []) as Item[];
  const lowStockItems = items
    .filter(
      (item) =>
        Number(item.quantity_on_hand) <= Number(item.reorder_threshold),
    )
    .sort(
      (a, b) => Number(a.quantity_on_hand) - Number(b.quantity_on_hand),
    );

  return {
    activeItemCount: itemsResult.count ?? items.length,
    activeVehicleCount: vehiclesResult.count ?? 0,
    tripsOutCount: tripsResult.count ?? 0,
    lowStockItems,
  };
}
