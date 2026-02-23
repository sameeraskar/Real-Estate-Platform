import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

export default async function LeadsPage() {
  const session = (await getServerSession(authOptions)) as any;
  if (!session) redirect("/login");

  const leads = await prisma.lead.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Leads</h1>

      <div className="rounded-xl border overflow-hidden">
        <div className="grid grid-cols-4 gap-2 px-4 py-2 text-sm font-medium border-b">
          <div>Name</div>
          <div>Email</div>
          <div>Phone</div>
          <div>Created</div>
        </div>

        {leads.length === 0 ? (
          <div className="p-4 text-gray-600">No leads yet.</div>
        ) : (
          leads.map((l) => (
            <div key={l.id} className="grid grid-cols-4 gap-2 px-4 py-3 text-sm border-b">
              <div>{l.fullName ?? "-"}</div>
              <div>{l.email ?? "-"}</div>
              <div>{l.phone ?? "-"}</div>
              <div>{new Date(l.createdAt).toLocaleString()}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
