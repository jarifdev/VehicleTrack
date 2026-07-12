import { ItemForm } from "@/components/items/item-form";
import { PageHeader } from "@/components/ui/page-header";
import { getItem } from "@/lib/services/item-service";

export default async function EditItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await getItem(id);
  return <><PageHeader title={`Edit ${item.name}`} description="Quantity changes are recorded in the stock movement audit trail." /><ItemForm item={item} /></>;
}
