import { notFound } from "next/navigation";
import { z } from "zod";

import { getTrip } from "@/lib/services/trip-service";

const uuidSchema = z.string().uuid();

type TripPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function TripPage({
  params,
}: TripPageProps) {
  const { id } = await params;

  const parsedId = uuidSchema.safeParse(id);

  if (!parsedId.success) {
    notFound();
  }

  const trip = await getTrip(parsedId.data);

  return (
    <main>
      {/* Your existing trip details UI */}
    </main>
  );
}