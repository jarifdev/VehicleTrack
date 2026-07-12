"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api-client";
import type { Vehicle } from "@/types/models";

const emptyForm = {
  registration: "",
  name: "",
  type: "Van",
  isActive: true,
};

export function VehicleManager({ vehicles }: { vehicles: Vehicle[] }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function edit(vehicle: Vehicle) {
    setEditingId(vehicle.id);
    setForm({
      registration: vehicle.registration,
      name: vehicle.name,
      type: vehicle.type,
      isActive: vehicle.is_active,
    });
    setError("");
  }

  function reset() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      await apiRequest(editingId ? `/api/vehicles/${editingId}` : "/api/vehicles", {
        method: editingId ? "PATCH" : "POST",
        body: JSON.stringify(form),
      });
      reset();
      router.refresh();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not save vehicle",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="two-column">
      <form className="card form-grid" onSubmit={submit}>
        <h2>{editingId ? "Edit vehicle" : "Add vehicle"}</h2>
        {error ? <div className="alert alert-error">{error}</div> : null}

        <label>
          Registration
          <input
            required
            value={form.registration}
            onChange={(event) =>
              setForm({ ...form, registration: event.target.value })
            }
            placeholder="OM-1234"
          />
        </label>

        <label>
          Name
          <input
            required
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            placeholder="Maintenance Van 1"
          />
        </label>

        <label>
          Type
          <input
            required
            value={form.type}
            onChange={(event) => setForm({ ...form, type: event.target.value })}
            placeholder="Van"
          />
        </label>

        {editingId ? (
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) =>
                setForm({ ...form, isActive: event.target.checked })
              }
            />
            Active and selectable for trips
          </label>
        ) : null}

        <div className="form-actions">
          <button className="button button-primary" disabled={saving}>
            {saving ? "Saving..." : editingId ? "Save changes" : "Add vehicle"}
          </button>
          {editingId ? (
            <button type="button" className="button button-secondary" onClick={reset}>
              Cancel
            </button>
          ) : null}
        </div>
      </form>

      <div className="card table-card">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Registration</th>
                <th>Name</th>
                <th>Type</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((vehicle) => (
                <tr key={vehicle.id}>
                  <td><strong>{vehicle.registration}</strong></td>
                  <td>{vehicle.name}</td>
                  <td>{vehicle.type}</td>
                  <td>
                    <span className={`badge ${vehicle.is_active ? "badge-ok" : "badge-low"}`}>
                      {vehicle.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <button
                      className="button button-small button-secondary"
                      onClick={() => edit(vehicle)}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
