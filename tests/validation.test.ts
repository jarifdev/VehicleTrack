import { describe, expect, it } from "vitest";
import { createItemSchema } from "@/lib/validation/item";
import { startTripSchema } from "@/lib/validation/trip";

const firstId = "550e8400-e29b-41d4-a716-446655440000";
const secondId = "550e8400-e29b-41d4-a716-446655440001";

describe("item validation", () => {
  it("normalizes SKU casing", () => {
    const result = createItemSchema.parse({
      sku: " cable-001 ",
      name: "Cable",
      unit: "metre",
      quantityOnHand: 10,
      reorderThreshold: 2,
    });
    expect(result.sku).toBe("CABLE-001");
  });

  it("rejects negative stock", () => {
    expect(() =>
      createItemSchema.parse({
        sku: "A",
        name: "A",
        unit: "piece",
        quantityOnHand: -1,
        reorderThreshold: 0,
      }),
    ).toThrow();
  });
});

describe("trip validation", () => {
  it("accepts multiple unique trip lines", () => {
    const result = startTripSchema.safeParse({
      vehicleId: firstId,
      lines: [
        { itemId: firstId, quantity: 1 },
        { itemId: secondId, quantity: 2 },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects duplicate items in one trip", () => {
    const result = startTripSchema.safeParse({
      vehicleId: secondId,
      lines: [
        { itemId: firstId, quantity: 1 },
        { itemId: firstId, quantity: 2 },
      ],
    });
    expect(result.success).toBe(false);
  });
});
