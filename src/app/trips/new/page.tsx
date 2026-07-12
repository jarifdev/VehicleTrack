import { StartTripForm } from "@/components/trips/start-trip-form";
import { PageHeader } from "@/components/ui/page-header";
import { listItems } from "@/lib/services/item-service";
import { listVehicles } from "@/lib/services/vehicle-service";

export default async function NewTripPage() {
  const [items, vehicles] = await Promise.all([listItems(), listVehicles()]);
  return <><PageHeader title="Start a trip" description="Select a vehicle, type or paste each SKU, and record what leaves the store." /><StartTripForm items={items} vehicles={vehicles} /></>;
}
