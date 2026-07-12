export type TripStatus = "out" | "returned";
export type MovementType = "initial" | "adjustment" | "trip_out" | "trip_return";

export interface Item {
  id: string;
  sku: string;
  name: string;
  unit: string;
  quantity_on_hand: number;
  reorder_threshold: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Vehicle {
  id: string;
  registration: string;
  name: string;
  type: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TripItem {
  id: string;
  trip_id?: string;
  item_id?: string;
  qty_taken: number;
  qty_returned: number;
  qty_used: number;
  item: Pick<Item, "id" | "sku" | "name" | "unit">;
}

export interface Trip {
  id: string;
  trip_number: number;
  vehicle_id?: string;
  status: TripStatus;
  taken_at: string;
  returned_at: string | null;
  notes: string | null;
  created_at: string;
  vehicle: Pick<Vehicle, "id" | "registration" | "name" | "type">;
  trip_items: TripItem[];
}

export interface InventoryMovement {
  id: string;
  item_id: string;
  trip_id: string | null;
  movement_type: MovementType;
  quantity_delta: number;
  balance_after: number;
  note: string | null;
  created_at: string;
  item: Pick<Item, "id" | "sku" | "name" | "unit">;
  trip: { id: string; trip_number: number } | null;
}
