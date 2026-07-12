import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { TripTable } from "@/components/trips/trip-table";
import { getDashboardData } from "@/lib/services/dashboard-service";
import { listTrips } from "@/lib/services/trip-service";
import { formatQuantity } from "@/lib/format";

export default async function DashboardPage() {
  const [dashboard, activeTrips] = await Promise.all([
    getDashboardData(),
    listTrips("out"),
  ]);

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Current store stock and trips that still need reconciliation."
        action={<Link className="button button-primary" href="/trips/new">Start a trip</Link>}
      />

      <section className="metric-grid">
        <div className="metric-card"><span>Active items</span><strong>{dashboard.activeItemCount}</strong></div>
        <div className="metric-card"><span>Vehicles</span><strong>{dashboard.activeVehicleCount}</strong></div>
        <div className="metric-card"><span>Trips currently out</span><strong>{dashboard.tripsOutCount}</strong></div>
        <div className="metric-card"><span>Low-stock items</span><strong>{dashboard.lowStockItems.length}</strong></div>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <h2>Trips currently out</h2>
          <Link href="/trips/out">View all</Link>
        </div>
        {activeTrips.length ? (
          <TripTable trips={activeTrips.slice(0, 5)} />
        ) : (
          <EmptyState title="No vehicles are out" description="Start a trip when a crew loads stock." action={<Link className="button button-primary" href="/trips/new">Start trip</Link>} />
        )}
      </section>

      <section className="section-block">
        <div className="section-heading"><h2>Low-stock attention</h2><Link href="/items">Manage stock</Link></div>
        <div className="card">
          {dashboard.lowStockItems.length ? (
            <ul className="attention-list">
              {dashboard.lowStockItems.slice(0, 8).map((item) => (
                <li key={item.id}>
                  <div><strong>{item.sku} — {item.name}</strong><span>Reorder threshold: {formatQuantity(item.reorder_threshold)} {item.unit}</span></div>
                  <strong>{formatQuantity(item.quantity_on_hand)} {item.unit}</strong>
                </li>
              ))}
            </ul>
          ) : <p className="muted">All active items are above their reorder thresholds.</p>}
        </div>
      </section>
    </>
  );
}
