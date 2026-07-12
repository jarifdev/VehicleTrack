import { ItemForm } from "@/components/items/item-form";
import { PageHeader } from "@/components/ui/page-header";

export default function NewItemPage() {
  return <><PageHeader title="Add stock item" description="Create a uniquely identified item and its starting quantity." /><ItemForm /></>;
}
