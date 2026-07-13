import "server-only";

import { z } from "zod";

import { getSupabase } from "@/lib/supabase/server";
import { databaseError, AppError } from "@/lib/errors";
import type { Trip, TripStatus } from "@/types/models";

const tripIdSchema = z.string().uuid();

const tripSelection = `
  id,
  trip_number,
  vehicle_id,
  status,
  taken_at,
  returned_at,
  notes,
  created_at,
  vehicle:vehicles!trips_vehicle_id_fkey(
    id,
    registration,
    name,
    type
  ),
  trip_items(
    id,
    trip_id,
    item_id,
    qty_taken,
    qty_returned,
    qty_used,
    item:items!trip_items_item_id_fkey(
      id,
      sku,
      name,
      unit
    )
  )
`;

export async function listTrips(
  status?: TripStatus,
): Promise<Trip[]> {
  const supabase = getSupabase();

  let query = supabase
    .from("trips")
    .select(tripSelection)
    .order("taken_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    console.error("listTrips failed:", {
      status,
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });

    throw databaseError(error);
  }

  return (data ?? []) as unknown as Trip[];
}

export async function getTrip(id: string): Promise<Trip> {
  const parsedId = tripIdSchema.safeParse(id);

  if (!parsedId.success) {
    console.error("getTrip received an invalid trip ID:", {
      id,
      stack: new Error().stack,
    });

    throw new AppError(
      "INVALID_TRIP_ID",
      `Invalid trip ID: ${id}`,
      400,
    );
  }

  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("trips")
    .select(tripSelection)
    .eq("id", parsedId.data)
    .maybeSingle();

  if (error) {
    console.error("getTrip failed:", {
      id: parsedId.data,
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });

    throw databaseError(error);
  }

  if (!data) {
    throw new AppError(
      "TRIP_NOT_FOUND",
      "Trip not found.",
      404,
    );
  }

  return data as unknown as Trip;
}