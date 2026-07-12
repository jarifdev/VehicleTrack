"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api-client";
import { calculateUsed, isValidReturn } from "@/lib/trip-calculations";
import { formatQuantity } from "@/lib/format";
import type { Trip } from "@/types/models";

export function ReturnTripForm({ trip }: { trip: Trip }) {
  const router = useRouter();
  const [returns, setReturns] = useState<Record<string, string>>(
    Object.fromEntries(trip.trip_items.map((line) => [line.id, "0"])),
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");

    for (const line of trip.trip_items) {
      const returned = Number(returns[line.id]);
      if (!isValidReturn(Number(line.qty_taken), returned)) {
        setError(
          `Returned quantity for ${line.item.name} must be between 0 and ${formatQuantity(line.qty_taken)}.`,
        );
        return;
      }
    }

    if (!window.confirm("Finalize this return? The trip cannot be returned twice.")) {
      return;
    }

    setSaving(true);
    try {
      await apiRequest(`/api/trips/${trip.id}/return`, {
        method: "POST",
        body: JSON.stringify({
          lines: trip.trip_items.map((line) => ({
            tripItemId: line.id,
            quantityReturned: Number(returns[line.id]),
          })),
        }),
      });
      router.refresh();
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Could not return trip",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="card" onSubmit={submit}>
      <h2>Reconcile returned stock</h2>
      <p className="muted">
        Enter what physically came back. Used quantity is calculated as taken minus returned.
      </p>
      {error ? <div className="alert alert-error">{error}</div> : null}

      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>SKU</th>
              <th>Item</th>
              <th className="numeric">Taken</th>
              <th className="numeric">Returned</th>
              <th className="numeric">Used</th>
            </tr>
          </thead>
          <tbody>
            {trip.trip_items.map((line) => {
              const returned = Number(returns[line.id] || 0);
              const used = calculateUsed(Number(line.qty_taken), returned);
              return (
                <tr key={line.id}>
                  <td><strong>{line.item.sku}</strong></td>
                  <td>{line.item.name}</td>
                  <td className="numeric">
                    {formatQuantity(line.qty_taken)} {line.item.unit}
                  </td>
                  <td className="numeric return-input-cell">
                    <input
                      aria-label={`Returned quantity for ${line.item.name}`}
                      type="number"
                      min="0"
                      max={line.qty_taken}
                      step="0.001"
                      required
                      value={returns[line.id]}
                      onChange={(event) =>
                        setReturns({ ...returns, [line.id]: event.target.value })
                      }
                    />
                  </td>
                  <td className="numeric">
                    {formatQuantity(used)} {line.item.unit}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="form-actions">
        <button className="button button-primary" disabled={saving}>
          {saving ? "Finalizing..." : "Finalize trip return"}
        </button>
      </div>
    </form>
  );
}
