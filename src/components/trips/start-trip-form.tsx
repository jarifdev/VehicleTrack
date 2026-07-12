"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api-client";
import { formatQuantity } from "@/lib/format";
import type { Item, Trip, Vehicle } from "@/types/models";

interface EditableLine {
  key: string;
  sku: string;
  itemId: string;
  quantity: string;
}

function newLine(): EditableLine {
  return {
    key: crypto.randomUUID(),
    sku: "",
    itemId: "",
    quantity: "1",
  };
}

export function StartTripForm({
  vehicles,
  items,
}: {
  vehicles: Vehicle[];
  items: Item[];
}) {
  const router = useRouter();
  const [vehicleId, setVehicleId] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<EditableLine[]>([newLine()]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const itemBySku = useMemo(
    () => new Map(items.map((item) => [item.sku.toUpperCase(), item])),
    [items],
  );

  function updateLine(key: string, patch: Partial<EditableLine>) {
    setLines((current) =>
      current.map((line) => (line.key === key ? { ...line, ...patch } : line)),
    );
  }

  function chooseSku(key: string, sku: string) {
    const normalizedSku = sku.trim().toUpperCase();
    const item = itemBySku.get(normalizedSku);
    updateLine(key, {
      sku,
      itemId: item?.id ?? "",
    });
  }

  function removeLine(key: string) {
    setLines((current) => current.filter((line) => line.key !== key));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");

    const invalidLine = lines.find((line) => !line.itemId);
    if (invalidLine) {
      setError(`Unknown SKU: ${invalidLine.sku || "blank SKU"}`);
      return;
    }

    for (const line of lines) {
      const item = items.find((candidate) => candidate.id === line.itemId);
      const quantity = Number(line.quantity);
      if (!Number.isFinite(quantity) || quantity <= 0) {
        setError("Every quantity must be greater than zero.");
        return;
      }
      if (item && quantity > Number(item.quantity_on_hand)) {
        setError(`Only ${formatQuantity(item.quantity_on_hand)} ${item.unit} of ${item.name} are available.`);
        return;
      }
    }

    setSaving(true);
    try {
      const trip = await apiRequest<Trip>("/api/trips", {
        method: "POST",
        body: JSON.stringify({
          vehicleId,
          notes,
          lines: lines.map((line) => ({
            itemId: line.itemId,
            quantity: Number(line.quantity),
          })),
        }),
      });
      router.push(`/trips/${trip.id}`);
      router.refresh();
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Could not start trip",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="card form-grid" onSubmit={submit}>
      {error ? <div className="alert alert-error">{error}</div> : null}

      <label>
        Vehicle
        <select
          required
          value={vehicleId}
          onChange={(event) => setVehicleId(event.target.value)}
        >
          <option value="">Select a vehicle</option>
          {vehicles.map((vehicle) => (
            <option key={vehicle.id} value={vehicle.id}>
              {vehicle.registration} — {vehicle.name}
            </option>
          ))}
        </select>
      </label>

      <fieldset className="line-fieldset">
        <legend>Items loaded</legend>
        <datalist id="item-skus">
          {items.map((item) => (
            <option key={item.id} value={item.sku}>
              {item.name}
            </option>
          ))}
        </datalist>

        <div className="trip-line trip-line-header">
          <span>Barcode / SKU</span>
          <span>Item and available stock</span>
          <span>Quantity taken</span>
          <span></span>
        </div>

        {lines.map((line) => {
          const item = items.find((candidate) => candidate.id === line.itemId);
          return (
            <div className="trip-line" key={line.key}>
              <input
                required
                list="item-skus"
                value={line.sku}
                placeholder="Type or paste SKU"
                onChange={(event) => chooseSku(line.key, event.target.value)}
              />
              <div className="line-description">
                {item ? (
                  <>
                    <strong>{item.name}</strong>
                    <span>
                      Available: {formatQuantity(item.quantity_on_hand)} {item.unit}
                    </span>
                  </>
                ) : (
                  <span>Select a valid SKU</span>
                )}
              </div>
              <input
                required
                type="number"
                min="1"
                step="1"
                value={line.quantity}
                onChange={(event) =>
                  updateLine(line.key, { quantity: event.target.value })
                }
              />
              <button
                type="button"
                className="button button-small button-danger"
                onClick={() => removeLine(line.key)}
                disabled={lines.length === 1}
              >
                Remove
              </button>
            </div>
          );
        })}

        <button
          type="button"
          className="button button-secondary"
          onClick={() => setLines((current) => [...current, newLine()])}
        >
          + Add another item
        </button>
      </fieldset>

      <label>
        Notes (optional)
        <textarea
          rows={3}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Job reference or crew notes"
        />
      </label>

      <div className="form-actions">
        <button className="button button-primary" disabled={saving || vehicles.length === 0}>
          {saving ? "Starting trip..." : "Start trip and deduct stock"}
        </button>
      </div>
    </form>
  );
}
