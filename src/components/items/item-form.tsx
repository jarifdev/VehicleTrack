"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api-client";
import type { Item } from "@/types/models";

interface ItemFormProps {
  item?: Item;
}

export function ItemForm({ item }: ItemFormProps) {
  const router = useRouter();
  const [form, setForm] = useState({
    sku: item?.sku ?? "",
    name: item?.name ?? "",
    unit: item?.unit ?? "piece",
    quantityOnHand: String(item?.quantity_on_hand ?? 0),
    reorderThreshold: String(item?.reorder_threshold ?? 0),
    isActive: item?.is_active ?? true,
    adjustmentNote: "Manual stock correction",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const body = {
        ...form,
        quantityOnHand: Number(form.quantityOnHand),
        reorderThreshold: Number(form.reorderThreshold),
      };

      if (item) {
        await apiRequest(`/api/items/${item.id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
      } else {
        await apiRequest("/api/items", {
          method: "POST",
          body: JSON.stringify(body),
        });
      }

      router.push("/items");
      router.refresh();
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Could not save item",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="card form-grid" onSubmit={handleSubmit}>
      {error ? <div className="alert alert-error">{error}</div> : null}

      <label>
        Barcode / SKU
        <input
          required
          value={form.sku}
          onChange={(event) => setForm({ ...form, sku: event.target.value })}
          placeholder="CABLE-001"
        />
      </label>

      <label>
        Item name
        <input
          required
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
          placeholder="Ethernet Cable"
        />
      </label>

      <label>
        Unit
        <input
          required
          value={form.unit}
          onChange={(event) => setForm({ ...form, unit: event.target.value })}
          placeholder="piece, metre, box..."
        />
      </label>

      <label>
        Quantity on hand
        <input
          required
          type="number"
          min="0"
          step="1"
          value={form.quantityOnHand}
          onChange={(event) =>
            setForm({ ...form, quantityOnHand: event.target.value })
          }
        />
      </label>

      <label>
        Reorder threshold
        <input
          required
          type="number"
          min="0"
          step="1"
          value={form.reorderThreshold}
          onChange={(event) =>
            setForm({ ...form, reorderThreshold: event.target.value })
          }
        />
      </label>

      {item ? (
        <>
          <label>
            Adjustment note
            <input
              value={form.adjustmentNote}
              onChange={(event) =>
                setForm({ ...form, adjustmentNote: event.target.value })
              }
              placeholder="Why did the stock quantity change?"
            />
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) =>
                setForm({ ...form, isActive: event.target.checked })
              }
            />
            Active and available for new trips
          </label>
        </>
      ) : null}

      <div className="form-actions">
        <button className="button button-primary" disabled={saving}>
          {saving ? "Saving..." : item ? "Save item" : "Create item"}
        </button>
        <button
          type="button"
          className="button button-secondary"
          onClick={() => router.push("/items")}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
