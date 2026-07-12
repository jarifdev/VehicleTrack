import { apiError, apiSuccess } from "@/lib/api-response";
import { getVehicle, updateVehicle } from "@/lib/services/vehicle-service";
import { updateVehicleSchema } from "@/lib/validation/vehicle";

interface Context {
  params: Promise<{ id: string }>;
}

export async function GET(_: Request, context: Context) {
  try {
    const { id } = await context.params;
    return apiSuccess(await getVehicle(id));
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const input = updateVehicleSchema.parse(await request.json());
    return apiSuccess(await updateVehicle(id, input));
  } catch (error) {
    return apiError(error);
  }
}
