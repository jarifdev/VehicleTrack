import Link from "next/link";
import { formatDateTime, tripLabel } from "@/lib/format";
import { StatusBadge } from "@/components/ui/status-badge";
import type { Trip } from "@/types/models";

export function TripTable({ trips }: { trips: Trip[] }) {
  return (
    <div className="card table-card">
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Trip</th>
              <th>Vehicle</th>
              <th>Departed</th>
              <th>Returned</th>
              <th>Item types</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {trips.map((trip) => (
              <tr key={trip.id}>
                <td><strong>{tripLabel(trip.trip_number)}</strong></td>
                <td>
                  {trip.vehicle.registration}<br />
                  <span className="muted">{trip.vehicle.name}</span>
                </td>
                <td>{formatDateTime(trip.taken_at)}</td>
                <td>{formatDateTime(trip.returned_at)}</td>
                <td>{trip.trip_items.length}</td>
                <td><StatusBadge status={trip.status} /></td>
                <td>
                  <Link className="button button-small button-secondary" href={`/trips/${trip.id}`}>
                    {trip.status === "out" ? "Return" : "View"}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
