import { PageHeader } from "@/components/ui/page-header";
import { ReturnTripForm } from "@/components/trips/return-trip-form";
import { TripSummary } from "@/components/trips/trip-summary";
import { getTrip } from "@/lib/services/trip-service";
import { tripLabel } from "@/lib/format";

export default async function TripDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const trip = await getTrip(id);
  return <><PageHeader title={tripLabel(trip.trip_number)} description={`${trip.vehicle.registration} — ${trip.vehicle.name}`} /><TripSummary trip={trip} />{trip.status === "out" ? <section className="section-block"><ReturnTripForm trip={trip} /></section> : null}</>;
}
