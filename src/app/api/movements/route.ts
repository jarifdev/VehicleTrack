import { apiError, apiSuccess } from "@/lib/api-response";
import { listMovements } from "@/lib/services/movement-service";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const requestedLimit = Number(url.searchParams.get("limit") ?? 100);
    const limit = Number.isFinite(requestedLimit)
      ? Math.min(Math.max(requestedLimit, 1), 500)
      : 100;
    return apiSuccess(await listMovements(limit));
  } catch (error) {
    return apiError(error);
  }
}
