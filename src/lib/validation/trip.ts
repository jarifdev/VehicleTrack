import { z } from "zod";

const tripLineSchema = z.object({
  itemId: z.string().uuid("Select a valid item"),
  quantity: z.coerce.number().finite().positive("Quantity must be greater than zero"),
});

export const startTripSchema = z
  .object({
    vehicleId: z.string().uuid("Select a vehicle"),
    notes: z.string().trim().max(500).optional(),
    lines: z.array(tripLineSchema).min(1, "Add at least one item"),
  })
  .superRefine((value, context) => {
    const ids = value.lines.map((line) => line.itemId);
    if (new Set(ids).size !== ids.length) {
      context.addIssue({
        code: "custom",
        path: ["lines"],
        message: "The same item cannot be added twice",
      });
    }
  });

export const returnTripSchema = z
  .object({
    lines: z
      .array(
        z.object({
          tripItemId: z.string().uuid(),
          quantityReturned: z.coerce.number().finite().min(0),
        }),
      )
      .min(1, "Provide at least one return line"),
  })
  .superRefine((value, context) => {
    const ids = value.lines.map((line) => line.tripItemId);
    if (new Set(ids).size !== ids.length) {
      context.addIssue({
        code: "custom",
        path: ["lines"],
        message: "Each trip item can only appear once",
      });
    }
  });

export const tripStatusSchema = z.enum(["out", "returned"]);
