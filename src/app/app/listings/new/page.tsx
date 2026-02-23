import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import ListingForm from "../shared/ListingForm";

export default async function NewListingPage() {
  const session = (await getServerSession(authOptions)) as any;
  if (!session?.tenantId) redirect("/login");

  return (
    <div className="p-6 max-w-2xl space-y-4">
      <h1 className="text-2xl font-semibold">New listing</h1>
      <ListingForm mode="create" />
    </div>
  );
}
