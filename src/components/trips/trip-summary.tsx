import { formatDateTime, formatQuantity, tripLabel } from "@/lib/format";
import { StatusBadge } from "@/components/ui/status-badge";
import type { Trip } from "@/types/models";

export function TripSummary({ trip }: { trip: Trip }) {
  return (
    <div className="stack">
      <div className="card detail-grid">
        <div><span>Trip</span><strong>{tripLabel(trip.trip_number)}</strong></div>
        <div><span>Status</span><StatusBadge status={trip.status} /></div>
        <div><span>Vehicle</span><strong>{trip.vehicle.registration} — {trip.vehicle.name}</strong></div>
        <div><span>Departed</span><strong>{formatDateTime(trip.taken_at)}</strong></div>
        <div><span>Returned</span><strong>{formatDateTime(trip.returned_at)}</strong></div>
        <div><span>Notes</span><strong>{trip.notes || "—"}</strong></div>
      </div>

      <div className="card table-card">
        <h2>Trip items</h2>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>SKU</th>
                <th>Item</th>
                <th>Unit</th>
                <th className="numeric">Taken</th>
                <th className="numeric">Returned</th>
                <th className="numeric">Used</th>
              </tr>
            </thead>
            <tbody>
              {trip.trip_items.map((line) => (
                <tr key={line.id}>
                  <td><strong>{line.item.sku}</strong></td>
                  <td>{line.item.name}</td>
                  <td>{line.item.unit}</td>
                  <td className="numeric">{formatQuantity(line.qty_taken)}</td>
                  <td className="numeric">{formatQuantity(line.qty_returned)}</td>
                  <td className="numeric"><strong>{formatQuantity(line.qty_used)}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
