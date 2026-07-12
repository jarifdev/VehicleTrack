import { z } from "zod";

const commonItemFields = {
  sku: z
    .string()
    .trim()
    .min(1, "SKU is required")
    .max(100, "SKU is too long")
    .transform((value) => value.toUpperCase()),
  name: z.string().trim().min(1, "Name is required").max(150),
  unit: z.string().trim().min(1, "Unit is required").max(50),
  quantityOnHand: z.coerce
    .number()
    .finite()
    .min(0, "Quantity cannot be negative"),
  reorderThreshold: z.coerce
    .number()
    .finite()
    .min(0, "Reorder threshold cannot be negative"),
};

export const createItemSchema = z.object(commonItemFields);

export const updateItemSchema = z.object({
  ...commonItemFields,
  isActive: z.boolean(),
  adjustmentNote: z.string().trim().max(300).optional(),
});
