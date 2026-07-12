import "server-only";
import { getSupabase } from "@/lib/supabase/server";
import { databaseError, AppError } from "@/lib/errors";
import type { Trip, TripStatus } from "@/types/models";

const tripSelection = `
  id,
  trip_number,
  vehicle_id,
  status,
  taken_at,
  returned_at,
  notes,
  created_at,
  vehicle:vehicles!trips_vehicle_id_fkey(id, registration, name, type),
  trip_items(
    id,
    trip_id,
    item_id,
    qty_taken,
    qty_returned,
    qty_used,
    item:items!trip_items_item_id_fkey(id, sku, name, unit)
  )
`;

export async function listTrips(status?: TripStatus): Promise<Trip[]> {
  const supabase = getSupabase();
  let query = supabase
    .from("trips")
    .select(tripSelection)
    .order("taken_at", { ascending: false });

  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) throw databaseError(error);
  return (data ?? []) as unknown as Trip[];
}

export async function getTrip(id: string): Promise<Trip> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("trips")
    .select(tripSelection)
    .eq("id", id)
    .maybeSingle();

  if (error) throw databaseError(error);
  if (!data) throw new AppError("TRIP_NOT_FOUND", "Trip not found.", 404);
  return data as unknown as Trip;
}

export async function startTrip(input: {
  vehicleId: string;
  notes?: string;
  lines: Array<{ itemId: string; quantity: number }>;
}): Promise<Trip> {
  const supabase = getSupabase();
  const { data: id, error } = await supabase.rpc("take_out_trip", {
    p_vehicle_id: input.vehicleId,
    p_items: input.lines.map((line) => ({
      item_id: line.itemId,
      qty: line.quantity,
    })),
    p_notes: input.notes ?? null,
  });

  if (error) throw databaseError(error);
  return getTrip(id as string);
}

export async function completeTripReturn(
  tripId: string,
  lines: Array<{ tripItemId: string; quantityReturned: number }>,
): Promise<Trip> {
  const supabase = getSupabase();
  const { error } = await supabase.rpc("return_trip", {
    p_trip_id: tripId,
    p_returns: lines.map((line) => ({
      trip_item_id: line.tripItemId,
      qty: line.quantityReturned,
    })),
  });

  if (error) throw databaseError(error);
  return getTrip(tripId);
}
