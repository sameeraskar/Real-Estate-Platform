import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import SavedSearchForm from "@/components/saved-searches/SavedSearchForm";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function NewSavedSearchPage() {
  const session = (await getServerSession(authOptions)) as any;
  if (!session?.tenantId) redirect("/login");

  const contacts = await prisma.contact.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { updatedAt: "desc" },
    take: 200,
    select: { id: true, fullName: true, email: true },
  });

  if (contacts.length === 0) {
    return <div className="p-6">Create a contact first.</div>;
  }

  return (
    <div className="p-6 max-w-3xl space-y-4">
      <h1 className="text-2xl font-semibold">New Saved Search</h1>
      <SavedSearchForm mode="create" contacts={contacts} />
    </div>
  );
}