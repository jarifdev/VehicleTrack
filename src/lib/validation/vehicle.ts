import { z } from "zod";

const commonVehicleFields = {
  registration: z
    .string()
    .trim()
    .min(1, "Registration is required")
    .max(100)
    .transform((value) => value.toUpperCase()),
  name: z.string().trim().min(1, "Name is required").max(150),
  type: z.string().trim().min(1, "Type is required").max(80),
};

export const createVehicleSchema = z.object(commonVehicleFields);
export const updateVehicleSchema = z.object({
  ...commonVehicleFields,
  isActive: z.boolean(),
});
