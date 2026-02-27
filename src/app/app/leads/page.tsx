import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const session = (await getServerSession(authOptions)) as any;
  if (!session?.tenantId) redirect("/login");

  const sp = await searchParams;
  const q = (sp.q ?? "").trim();

  const leads = await prisma.lead.findMany({
    where: {
      tenantId: session.tenantId,
      ...(q
        ? {
            OR: [
              { fullName: { contains: q } },
              { email: { contains: q } },
              { phone: { contains: q } },
              { source: { contains: q } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      listing: { select: { id: true, title: true } },
      contact: { select: { id: true, fullName: true, email: true } },
    },
  });

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Leads</h1>
          <div className="text-sm text-gray-600">{leads.length} recent</div>
        </div>

        <form method="GET" className="flex gap-2">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search name, email, phone, source…"
            className="border rounded-md px-3 py-2 text-sm"
          />
          <button className="rounded-md bg-black text-white px-3 py-2 text-sm">
            Search
          </button>
        </form>
      </div>

      <div className="rounded-xl border overflow-hidden">
        <div className="grid grid-cols-6 gap-2 px-4 py-2 text-xs font-medium border-b bg-gray-50">
          <div>Lead</div>
          <div>Source</div>
          <div>Campaign</div>
          <div>Listing</div>
          <div>Created</div>
          <div>Contact</div>
        </div>

        {leads.length === 0 ? (
          <div className="p-4 text-gray-600">No leads found.</div>
        ) : (
          leads.map((l) => (
            <div key={l.id} className="grid grid-cols-6 gap-2 px-4 py-3 text-sm border-b">
              <div className="truncate">
                <Link className="underline" href={`/app/leads/${l.id}`}>
                  {l.fullName ?? l.email ?? l.phone ?? "Unnamed lead"}
                </Link>
                {l.email ? <div className="text-xs text-gray-500 truncate">{l.email}</div> : null}
              </div>

              <div className="truncate">
                <div className="text-xs text-gray-500">source</div>
                <div>{l.source ?? "-"}</div>
              </div>

              <div className="truncate">
                <div className="text-xs text-gray-500">utm_campaign</div>
                {/* rename fields if yours differ */}
                <div>{(l as any).utmCampaign ?? "-"}</div>
              </div>

              <div className="truncate">
                {l.listing ? (
                  <Link className="underline" href={`/app/listings/${l.listing.id}/edit`}>
                    {l.listing.title}
                  </Link>
                ) : (
                  "-"
                )}
              </div>

              <div>{new Date(l.createdAt).toLocaleString()}</div>

              <div className="truncate">
                {l.contact ? (
                  <Link className="underline" href={`/app/contacts/${l.contact.id}`}>
                    {l.contact.fullName ?? l.contact.email ?? "Contact"}
                  </Link>
                ) : (
                  "-"
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}