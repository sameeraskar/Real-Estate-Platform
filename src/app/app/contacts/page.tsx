import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const session = (await getServerSession(authOptions)) as any;
  if (!session?.tenantId) redirect("/login");

  const sp = await searchParams;
  const q = (sp.q ?? "").trim();

  const contacts = await prisma.contact.findMany({
    where: {
      tenantId: session.tenantId,
      ...(q
        ? {
            OR: [
              { fullName: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
              { phone: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { updatedAt: "desc" },
    take: 200,
    include: {
      _count: { select: { leads: true } }, // ✅ only what exists
      leads: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { createdAt: true },
      },
    },
  });
  

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Contacts</h1>
          <p className="text-sm text-gray-600">Your CRM contacts (tenant-isolated).</p>
        </div>

        <form className="flex gap-2" method="GET">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search name/email/phone…"
            className="border rounded-md px-3 py-2 text-sm"
          />
          <button className="rounded-md bg-black text-white px-4 py-2 text-sm">
            Search
          </button>
          <Link href="/app/contacts" className="rounded-md border px-4 py-2 text-sm">
            Clear
          </Link>
        </form>
      </div>

      <div className="rounded-xl border overflow-hidden">
        <div className="grid grid-cols-5 gap-2 px-4 py-2 text-sm font-medium border-b">
          <div>Name</div>
          <div>Email</div>
          <div>Phone</div>
          <div>Leads</div>
          <div>Last Activity</div>
        </div>

        {contacts.length === 0 ? (
          <div className="p-4 text-gray-600">No contacts found.</div>
        ) : (
          contacts.map((c) => {
            const last = c.leads?.[0]?.createdAt ?? c.updatedAt;
            return (
              <div
                key={c.id}
                className="grid grid-cols-5 gap-2 px-4 py-3 text-sm border-b"
              >
                <div className="truncate">
                  <Link className="underline" href={`/app/contacts/${c.id}`}>
                    {c.fullName || "Unnamed contact"}
                  </Link>
                </div>
                <div className="truncate">{c.email ?? "-"}</div>
                <div className="truncate">{c.phone ?? "-"}</div>
                <div>{c._count.leads}</div>
                <div>{new Date(last).toLocaleDateString()}</div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
