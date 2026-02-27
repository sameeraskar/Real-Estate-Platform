import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import SavedSearchForm from "@/components/saved-searches/SavedSearchForm";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function EditSavedSearchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = (await getServerSession(authOptions)) as any;
  if (!session?.tenantId) redirect("/login");

  const { id } = await params;

  const savedSearch = await prisma.savedSearch.findFirst({
    where: { id, tenantId: session.tenantId },
    select: { id: true, name: true, isActive: true, criteria: true, contactId: true },
  });

  if (!savedSearch) return <div className="p-6">Not found.</div>;

  const contacts = await prisma.contact.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { updatedAt: "desc" },
    take: 200,
    select: { id: true, fullName: true, email: true },
  });

  return (
    <div className="p-6 max-w-3xl space-y-4">
      <h1 className="text-2xl font-semibold">Edit Saved Search</h1>
      <SavedSearchForm mode="edit" contacts={contacts} initial={savedSearch as any} />
    </div>
  );
}