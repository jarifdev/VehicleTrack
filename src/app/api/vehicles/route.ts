import { apiError, apiSuccess } from "@/lib/api-response";
import { createVehicle, listVehicles } from "@/lib/services/vehicle-service";
import { createVehicleSchema } from "@/lib/validation/vehicle";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const includeArchived = url.searchParams.get("includeArchived") === "true";
    return apiSuccess(await listVehicles(includeArchived));
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const input = createVehicleSchema.parse(await request.json());
    return apiSuccess(await createVehicle(input), 201);
  } catch (error) {
    return apiError(error);
  }
}
