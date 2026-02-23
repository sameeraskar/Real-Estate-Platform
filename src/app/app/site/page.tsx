import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import SiteForm from "./SiteForm";

export default async function SitePage() {
  const session = (await getServerSession(authOptions)) as any;

  if (!session?.tenantId) redirect("/login");

  const site = await prisma.site.upsert({
    where: { tenantId: session.tenantId },
    update: {},
    create: {
      tenantId: session.tenantId,
      brandName: "Demo Realty",
      tagline: "Helping you find home.",
      template: "modern",
    },
    select: {
      brandName: true,
      tagline: true,
      phone: true,
      email: true,
      template: true,
    },
  });

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-semibold mb-4">Site Settings</h1>
      <SiteForm initialData={site} />
    </div>
  );
}
