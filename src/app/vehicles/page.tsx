import { VehicleManager } from "@/components/vehicles/vehicle-manager";
import { PageHeader } from "@/components/ui/page-header";
import { listVehicles } from "@/lib/services/vehicle-service";

export default async function VehiclesPage() {
  const vehicles = await listVehicles(true);
  return <><PageHeader title="Vehicles" description="Create vehicles and control which ones may be selected for new trips." /><VehicleManager vehicles={vehicles} /></>;
}
