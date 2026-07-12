import { apiError, apiSuccess } from "@/lib/api-response";
import { listTrips, startTrip } from "@/lib/services/trip-service";
import { startTripSchema, tripStatusSchema } from "@/lib/validation/trip";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const rawStatus = url.searchParams.get("status");
    const status = rawStatus ? tripStatusSchema.parse(rawStatus) : undefined;
    return apiSuccess(await listTrips(status));
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const input = startTripSchema.parse(await request.json());
    return apiSuccess(await startTrip(input), 201);
  } catch (error) {
    return apiError(error);
  }
}
