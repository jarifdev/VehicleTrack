import "server-only";
import { getSupabase } from "@/lib/supabase/server";
import { databaseError, AppError } from "@/lib/errors";
import type { Vehicle } from "@/types/models";

export async function listVehicles(includeArchived = false): Promise<Vehicle[]> {
  const supabase = getSupabase();
  let query = supabase.from("vehicles").select("*").order("name");
  if (!includeArchived) query = query.eq("is_active", true);

  const { data, error } = await query;
  if (error) throw databaseError(error);
  return (data ?? []) as Vehicle[];
}

export async function getVehicle(id: string): Promise<Vehicle> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("vehicles")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw databaseError(error);
  if (!data) throw new AppError("VEHICLE_NOT_FOUND", "Vehicle not found.", 404);
  return data as Vehicle;
}

export async function createVehicle(input: {
  registration: string;
  name: string;
  type: string;
}): Promise<Vehicle> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("vehicles")
    .insert({
      registration: input.registration,
      name: input.name,
      type: input.type,
    })
    .select("*")
    .single();

  if (error) throw databaseError(error);
  return data as Vehicle;
}

export async function updateVehicle(
  id: string,
  input: {
    registration: string;
    name: string;
    type: string;
    isActive: boolean;
  },
): Promise<Vehicle> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("vehicles")
    .update({
      registration: input.registration,
      name: input.name,
      type: input.type,
      is_active: input.isActive,
    })
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error) throw databaseError(error);
  if (!data) throw new AppError("VEHICLE_NOT_FOUND", "Vehicle not found.", 404);
  return data as Vehicle;
}
