import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import LeadStatusControls from "@/components/admin/LeadStatusControls";
import LeadLinkContactButton from "@/components/admin/LeadLinkContactButton";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const STATUSES = ["NEW", "CONTACTED", "APPOINTMENT", "WON", "LOST"] as const;

export default async function LeadsAdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const session = (await getServerSession(authOptions)) as any;
  if (!session?.tenantId) redirect("/login");

  const sp = await searchParams;
  const status = (sp.status ?? "NEW").toUpperCase();
  const activeStatus = STATUSES.includes(status as any) ? (status as any) : "NEW";

  const leads = await prisma.lead.findMany({
    where: { tenantId: session.tenantId, status: activeStatus },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      listing: { select: { id: true, title: true } },
      contact: { select: { id: true, fullName: true, email: true, phone: true } },
    },
  });

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-semibold">Leads</h1>

        <Link href="/app/listings" className="text-sm underline">
          Back to listings
        </Link>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 flex-wrap">
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={`/app/leads?status=${s}`}
            className={`rounded-md border px-3 py-1 text-sm ${
              s === activeStatus ? "bg-black text-white" : ""
            }`}
          >
            {s}
          </Link>
        ))}
      </div>

      <div className="rounded-xl border overflow-hidden">
        <div className="grid grid-cols-7 gap-2 px-4 py-2 text-sm font-medium border-b bg-gray-50">
          <div>Name</div>
          <div>Email</div>
          <div>Phone</div>
          <div>Listing</div>
          <div>Contact</div>
          <div>Created</div>
          <div>Move</div>
        </div>

        {leads.length === 0 ? (
          <div className="p-4 text-gray-600">No leads in {activeStatus}.</div>
        ) : (
          leads.map((l) => {
            const contactLabel =
              l.contact?.fullName?.trim() ||
              l.contact?.phone ||
              l.contact?.email ||
              null;

            return (
              <div
                key={l.id}
                className="grid grid-cols-7 gap-2 px-4 py-3 text-sm border-b items-center"
              >
                <div className="truncate">{l.fullName ?? "-"}</div>
                <div className="truncate">{l.email ?? "-"}</div>
                <div className="truncate">{l.phone ?? "-"}</div>
                <div className="truncate">{l.listing?.title ?? "-"}</div>

                {/* Contact column */}
                <div className="truncate">
                  {l.contact ? (
                    <Link className="underline" href={`/app/contacts/${l.contact.id}`}>
                      {contactLabel ?? "View contact"}
                    </Link>
                  ) : (
                    <LeadLinkContactButton leadId={l.id} />
                  )}
                </div>

                <div>{new Date(l.createdAt).toLocaleDateString()}</div>

                <LeadStatusControls leadId={l.id} current={l.status} />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}