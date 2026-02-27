import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import SavedSearchForm from "@/components/crm/SavedSearchForm";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function NewSavedSearchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = (await getServerSession(authOptions)) as any;
  if (!session?.tenantId) redirect("/login");

  const { id } = await params;

  const contact = await prisma.contact.findFirst({
    where: { id, tenantId: session.tenantId },
    select: { id: true, fullName: true, email: true, phone: true },
  });

  if (!contact) {
    return (
      <div className="p-6">
        <div className="rounded-xl border p-4">Contact not found.</div>
        <div className="mt-4">
          <Link className="underline" href="/app/contacts">
            Back to contacts
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-500">Contact</div>
          <h1 className="text-2xl font-semibold">
            New Saved Search{contact.fullName ? ` — ${contact.fullName}` : ""}
          </h1>
        </div>

        <Link className="underline text-sm" href={`/app/contacts/${contact.id}`}>
          Back
        </Link>
      </div>

      <div className="rounded-xl border p-4">
        <SavedSearchForm contactId={contact.id} />
      </div>
    </div>
  );
}
