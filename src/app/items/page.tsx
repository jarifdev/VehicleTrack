import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ItemsTable } from "@/components/items/items-table";
import { listItems } from "@/lib/services/item-service";

export default async function ItemsPage() {
  const items = await listItems();
  return (
    <>
      <PageHeader title="Stock" description="Current quantities available in the store." action={<Link className="button button-primary" href="/items/new">Add item</Link>} />
      {items.length ? <ItemsTable items={items} /> : <EmptyState title="No stock items yet" description="Create the first SKU to begin tracking inventory." action={<Link className="button button-primary" href="/items/new">Add item</Link>} />}
    </>
  );
}
