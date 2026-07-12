import { apiError, apiSuccess } from "@/lib/api-response";
import { getDashboardData } from "@/lib/services/dashboard-service";

export async function GET() {
  try {
    return apiSuccess(await getDashboardData());
  } catch (error) {
    return apiError(error);
  }
}
