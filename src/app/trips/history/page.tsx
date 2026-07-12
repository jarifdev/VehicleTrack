import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { TripTable } from "@/components/trips/trip-table";
import { listTrips } from "@/lib/services/trip-service";

export default async function TripHistoryPage() {
  const trips = await listTrips("returned");
  return <><PageHeader title="Trip history" description="Completed trips with taken, returned, and used quantities." />{trips.length ? <TripTable trips={trips} /> : <EmptyState title="No completed trips" description="Returned trips will appear here." />}</>;
}
