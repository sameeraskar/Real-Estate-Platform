import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import NewSearchForm from "@/components/app/NewSearchForm";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function NewSearchPage() {
  const session = (await getServerSession(authOptions)) as any;
  if (!session?.tenantId) redirect("/login");

  const contacts = await prisma.contact.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { updatedAt: "desc" },
    take: 300,
    select: { id: true, fullName: true, email: true },
  });

  return (
    <div className="p-6 max-w-2xl space-y-4">
      <h1 className="text-2xl font-semibold">New Saved Search</h1>
      <NewSearchForm contacts={contacts} />
    </div>
  );
}
