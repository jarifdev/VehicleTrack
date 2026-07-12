import { apiError, apiSuccess } from "@/lib/api-response";
import { getTrip } from "@/lib/services/trip-service";

interface Context {
  params: Promise<{ id: string }>;
}

export async function GET(_: Request, context: Context) {
  try {
    const { id } = await context.params;
    return apiSuccess(await getTrip(id));
  } catch (error) {
    return apiError(error);
  }
}
