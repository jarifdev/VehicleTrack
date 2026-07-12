import { apiError, apiSuccess } from "@/lib/api-response";
import { completeTripReturn } from "@/lib/services/trip-service";
import { returnTripSchema } from "@/lib/validation/trip";

interface Context {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const input = returnTripSchema.parse(await request.json());
    return apiSuccess(await completeTripReturn(id, input.lines));
  } catch (error) {
    return apiError(error);
  }
}
