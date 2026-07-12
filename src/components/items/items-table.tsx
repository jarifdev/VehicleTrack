"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiRequest } from "@/lib/api-client";
import { formatQuantity } from "@/lib/format";
import type { Item } from "@/types/models";

export function ItemsTable({ items }: { items: Item[] }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [archivingId, setArchivingId] = useState<string | null>(null);

  async function archive(item: Item) {
    if (!window.confirm(`Archive ${item.name}? Its history will be kept.`)) return;

    setArchivingId(item.id);
    setError("");
    try {
      await apiRequest(`/api/items/${item.id}`, { method: "DELETE" });
      router.refresh();
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Could not archive item",
      );
    } finally {
      setArchivingId(null);
    }
  }

  return (
    <div className="card table-card">
      {error ? <div className="alert alert-error">{error}</div> : null}
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>SKU</th>
              <th>Name</th>
              <th>Unit</th>
              <th className="numeric">On hand</th>
              <th className="numeric">Reorder at</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const low =
                Number(item.quantity_on_hand) <= Number(item.reorder_threshold);
              return (
                <tr key={item.id}>
                  <td><strong>{item.sku}</strong></td>
                  <td>{item.name}</td>
                  <td>{item.unit}</td>
                  <td className="numeric">{formatQuantity(item.quantity_on_hand)}</td>
                  <td className="numeric">{formatQuantity(item.reorder_threshold)}</td>
                  <td>
                    <span className={low ? "badge badge-low" : "badge badge-ok"}>
                      {low ? "Low stock" : "In stock"}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <Link className="button button-small button-secondary" href={`/items/${item.id}`}>
                      Edit
                    </Link>
                    <button
                      className="button button-small button-danger"
                      disabled={archivingId === item.id}
                      onClick={() => archive(item)}
                    >
                      Archive
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
