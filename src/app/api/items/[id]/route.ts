import { apiError, apiSuccess } from "@/lib/api-response";
import { archiveItem, getItem, updateItem } from "@/lib/services/item-service";
import { updateItemSchema } from "@/lib/validation/item";

interface Context {
  params: Promise<{ id: string }>;
}

export async function GET(_: Request, context: Context) {
  try {
    const { id } = await context.params;
    return apiSuccess(await getItem(id));
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const input = updateItemSchema.parse(await request.json());
    return apiSuccess(await updateItem(id, input));
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(_: Request, context: Context) {
  try {
    const { id } = await context.params;
    await archiveItem(id);
    return apiSuccess({ archived: true });
  } catch (error) {
    return apiError(error);
  }
}
