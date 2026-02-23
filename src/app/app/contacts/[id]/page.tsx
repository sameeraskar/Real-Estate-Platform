import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = (await getServerSession(authOptions)) as any;
  if (!session?.tenantId) redirect("/login");

  const { id } = await params;

  const contact = await prisma.contact.findFirst({
    where: { id, tenantId: session.tenantId },
    include: {
      leads: {
        orderBy: { createdAt: "desc" },
        take: 50,
        include: {
          listing: { select: { id: true, title: true } },
        },
      },
      messages: { orderBy: { createdAt: "desc" }, take: 50 },
    },
  });

  if (!contact) return <div className="p-6">Contact not found.</div>;

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <Link href="/app/contacts" className="text-sm underline">
          Back to contacts
        </Link>
      </div>

      <div className="rounded-xl border p-5 space-y-1">
        <div className="text-xl font-semibold">{contact.fullName || "Unnamed contact"}</div>
        <div className="text-sm text-gray-600">{contact.email ?? "—"}</div>
        <div className="text-sm text-gray-600">{contact.phone ?? "—"}</div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-xl border p-5 space-y-3">
          <h2 className="font-semibold">Leads</h2>
          {contact.leads.length === 0 ? (
            <div className="text-sm text-gray-600">No leads yet.</div>
          ) : (
            <div className="space-y-3">
              {contact.leads.map((l) => (
                <div key={l.id} className="border rounded-lg p-3">
                  <div className="text-sm text-gray-600">
                    {new Date(l.createdAt).toLocaleString()}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Source:</span> {l.source ?? "website"}
                  </div>
                  {l.listing && (
                    <div className="text-sm">
                      <span className="font-medium">Listing:</span>{" "}
                      <Link className="underline" href={`/app/listings/${l.listing.id}/edit`}>
                        {l.listing.title}
                      </Link>
                    </div>
                  )}
                  {l.message && <div className="text-sm mt-2">{l.message}</div>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border p-5 space-y-3">
          <h2 className="font-semibold">Messages</h2>
          <div className="text-sm text-gray-600">
            Messaging UI comes next (Twilio later). For now this will show stored messages.
          </div>

          {contact.messages.length === 0 ? (
            <div className="text-sm text-gray-600">No messages yet.</div>
          ) : (
            <div className="space-y-2">
              {contact.messages.map((m) => (
                <div key={m.id} className="border rounded-lg p-3 text-sm">
                  <div className="text-xs text-gray-600">
                    {m.direction} • {new Date(m.createdAt).toLocaleString()}
                  </div>
                  <div className="mt-1">{m.body}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
