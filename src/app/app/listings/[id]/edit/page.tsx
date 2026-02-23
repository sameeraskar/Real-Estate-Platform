import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import ListingForm from "../../shared/ListingForm";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const prisma = new PrismaClient();

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = (await getServerSession(authOptions)) as any;
  if (!session?.tenantId) redirect("/login");

  const { id } = await params;

  const listing = await prisma.listing.findFirst({
    where: { id, tenantId: session.tenantId },
  });

  if (!listing) redirect("/app/listings");

  return (
    <div className="p-6 max-w-2xl space-y-4">
      <h1 className="text-2xl font-semibold">Edit listing</h1>

      <ListingForm
        mode="edit"
        listingId={listing.id}
        initial={{
          title: listing.title,
          status: listing.status as any,
          address: listing.address ?? "",
          city: listing.city ?? "",
          province: listing.province ?? "AB",
          postal: listing.postal ?? "",
          price: listing.price?.toString() ?? "",
          beds: listing.beds?.toString() ?? "",
          baths: listing.baths?.toString() ?? "",
          sqft: listing.sqft?.toString() ?? "",
          imageUrl: listing.imageUrl ?? "",
          description: listing.description ?? "",
        }}
      />
    </div>
  );
}
