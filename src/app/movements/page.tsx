import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { listMovements } from "@/lib/services/movement-service";
import { formatDateTime, formatQuantity, movementLabel, tripLabel } from "@/lib/format";

export default async function MovementsPage() {
  const movements = await listMovements();
  return <><PageHeader title="Stock movements" description="Audit trail for initial stock, manual corrections, trip departures, and returns." /><div className="card table-card"><div className="table-scroll"><table><thead><tr><th>Date</th><th>SKU</th><th>Item</th><th>Type</th><th className="numeric">Change</th><th className="numeric">Balance</th><th>Trip</th><th>Note</th></tr></thead><tbody>{movements.map((movement) => <tr key={movement.id}><td>{formatDateTime(movement.created_at)}</td><td><strong>{movement.item.sku}</strong></td><td>{movement.item.name}</td><td>{movementLabel(movement.movement_type)}</td><td className={`numeric ${Number(movement.quantity_delta) < 0 ? "negative" : "positive"}`}>{Number(movement.quantity_delta) > 0 ? "+" : ""}{formatQuantity(movement.quantity_delta)}</td><td className="numeric">{formatQuantity(movement.balance_after)} {movement.item.unit}</td><td>{movement.trip ? <Link href={`/trips/${movement.trip.id}`}>{tripLabel(movement.trip.trip_number)}</Link> : "—"}</td><td>{movement.note || "—"}</td></tr>)}</tbody></table></div></div></>;
}
