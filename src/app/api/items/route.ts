import { apiError, apiSuccess } from "@/lib/api-response";
import { createItem, listItems } from "@/lib/services/item-service";
import { createItemSchema } from "@/lib/validation/item";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const includeArchived = url.searchParams.get("includeArchived") === "true";
    const search = url.searchParams.get("search") ?? undefined;
    return apiSuccess(await listItems({ includeArchived, search }));
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const input = createItemSchema.parse(await request.json());
    return apiSuccess(await createItem(input), 201);
  } catch (error) {
    return apiError(error);
  }
}
