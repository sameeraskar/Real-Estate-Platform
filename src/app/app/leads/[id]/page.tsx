import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = (await getServerSession(authOptions)) as any;
  if (!session?.tenantId) redirect("/login");

  const { id } = await params;

  const lead = await prisma.lead.findFirst({
    where: { id, tenantId: session.tenantId },
    include: {
      listing: { select: { id: true, title: true } },
      contact: { select: { id: true, fullName: true, email: true } },
    },
  });

  if (!lead) return <div className="p-6">Not found.</div>;

  const anyLead = lead as any;

  return (
    <div className="p-6 space-y-4 max-w-4xl">
      <div className="flex items-center justify-between">
        <Link className="underline text-sm" href="/app/leads">
          Back
        </Link>
      </div>

      <div className="rounded-2xl border p-6 space-y-2">
        <div className="text-xs text-gray-500">Lead</div>
        <div className="text-2xl font-semibold">
          {lead.fullName ?? "Unnamed lead"}
        </div>
        <div className="text-sm text-gray-600">
          {lead.email ?? ""} {lead.phone ? `• ${lead.phone}` : ""}
        </div>
        {lead.message ? (
          <div className="mt-3 rounded-lg border bg-gray-50 p-3 text-sm">
            {lead.message}
          </div>
        ) : null}
      </div>

      <div className="rounded-2xl border p-6 space-y-3">
        <div className="text-sm font-semibold">Attribution</div>

        <div className="grid md:grid-cols-2 gap-3 text-sm">
          <Field label="source" value={lead.source ?? "-"} />
          <Field label="utm_source" value={anyLead.utmSource ?? "-"} />
          <Field label="utm_medium" value={anyLead.utmMedium ?? "-"} />
          <Field label="utm_campaign" value={anyLead.utmCampaign ?? "-"} />
          <Field label="utm_content" value={anyLead.utmContent ?? "-"} />
          <Field label="utm_term" value={anyLead.utmTerm ?? "-"} />
          <Field label="gclid" value={anyLead.gclid ?? "-"} />
          <Field label="fbclid" value={anyLead.fbclid ?? "-"} />
          <Field label="landingPath" value={anyLead.landingPath ?? "-"} />
          <Field label="referrer" value={anyLead.referrer ?? "-"} />
          <Field
            label="firstTouchAt"
            value={anyLead.firstTouchAt ? new Date(anyLead.firstTouchAt).toLocaleString() : "-"}
          />
        </div>
      </div>

      <div className="rounded-2xl border p-6 space-y-2">
        <div className="text-sm font-semibold">Links</div>

        <div className="text-sm">
          Listing:{" "}
          {lead.listing ? (
            <Link className="underline" href={`/app/listings/${lead.listing.id}/edit`}>
              {lead.listing.title}
            </Link>
          ) : (
            "-"
          )}
        </div>

        <div className="text-sm">
          Contact:{" "}
          {lead.contact ? (
            <Link className="underline" href={`/app/contacts/${lead.contact.id}`}>
              {lead.contact.fullName ?? lead.contact.email ?? "Contact"}
            </Link>
          ) : (
            "-"
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-3">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="truncate">{value}</div>
    </div>
  );
}