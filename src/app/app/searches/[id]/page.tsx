import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function SearchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = (await getServerSession(authOptions)) as any;
  if (!session?.tenantId) redirect("/login");

  const { id } = await params;

  const search = await prisma.savedSearch.findFirst({
    where: { id, tenantId: session.tenantId },
    include: {
      contact: { select: { fullName: true, email: true } },
      _count: { select: { matches: true } },
    },
  });

  if (!search) return <div className="p-6">Search not found.</div>;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Saved Search</h1>
        <Link className="underline text-sm" href="/app/searches">
          Back
        </Link>
      </div>

      <div className="rounded-xl border p-4 space-y-2">
        <div className="text-sm text-gray-600">
          Contact: <b>{search.contact?.fullName ?? search.contact?.email}</b>
        </div>

        <pre className="text-xs bg-gray-50 border rounded-md p-3 overflow-auto">
{JSON.stringify(
  {
    city: search.city,
    minPrice: search.minPrice,
    maxPrice: (search as any).maxPrice ?? undefined,
    minBeds: search.minBeds,
  },
  null,
  2
)}
        </pre>

        <div className="text-sm text-gray-600">
          Matches stored: <b>{search._count.matches}</b>
        </div>
      </div>
    </div>
  );
}
