import "server-only";
import { getSupabase } from "@/lib/supabase/server";
import { databaseError, AppError } from "@/lib/errors";
import type { Item } from "@/types/models";

export async function listItems(options?: {
  includeArchived?: boolean;
  search?: string;
}): Promise<Item[]> {
  const supabase = getSupabase();
  let query = supabase.from("items").select("*").order("name");

  if (!options?.includeArchived) query = query.eq("is_active", true);

  const search = options?.search?.trim();
  if (search) {
    query = query.or(`sku.ilike.%${search}%,name.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error) throw databaseError(error);
  return (data ?? []) as Item[];
}

export async function getItem(id: string): Promise<Item> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("items")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw databaseError(error);
  if (!data) throw new AppError("ITEM_NOT_FOUND", "Item not found.", 404);
  return data as Item;
}

export async function createItem(input: {
  sku: string;
  name: string;
  unit: string;
  quantityOnHand: number;
  reorderThreshold: number;
}): Promise<Item> {
  const supabase = getSupabase();
  const { data: id, error } = await supabase.rpc("create_inventory_item", {
    p_sku: input.sku,
    p_name: input.name,
    p_unit: input.unit,
    p_quantity: input.quantityOnHand,
    p_reorder_threshold: input.reorderThreshold,
  });

  if (error) throw databaseError(error);
  return getItem(id as string);
}

export async function updateItem(
  id: string,
  input: {
    sku: string;
    name: string;
    unit: string;
    quantityOnHand: number;
    reorderThreshold: number;
    isActive: boolean;
    adjustmentNote?: string;
  },
): Promise<Item> {
  const supabase = getSupabase();
  const { error } = await supabase.rpc("update_inventory_item", {
    p_item_id: id,
    p_sku: input.sku,
    p_name: input.name,
    p_unit: input.unit,
    p_quantity: input.quantityOnHand,
    p_reorder_threshold: input.reorderThreshold,
    p_is_active: input.isActive,
    p_adjustment_note: input.adjustmentNote ?? "Manual stock adjustment",
  });

  if (error) throw databaseError(error);
  return getItem(id);
}

export async function archiveItem(id: string): Promise<void> {
  const item = await getItem(id);
  await updateItem(id, {
    sku: item.sku,
    name: item.name,
    unit: item.unit,
    quantityOnHand: Number(item.quantity_on_hand),
    reorderThreshold: Number(item.reorder_threshold),
    isActive: false,
    adjustmentNote: "",
  });
}
