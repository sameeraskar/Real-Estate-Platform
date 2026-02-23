import { PrismaClient } from "@prisma/client";
import ContactForm from "./ContactForm";
import ModernTemplate from "@/templates/modern";
import ClassicTemplate from "@/templates/classic";
import MinimalTemplate from "@/templates/minimal";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const prisma = new PrismaClient();

export default async function TenantHome({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    include: { site: true },
  });

  if (!tenant) {
    return <div className="p-6">Unknown tenant.</div>;
  }

  const site = tenant.site;

  const props = {
    brandName: site?.brandName ?? tenant.name,
    tagline: site?.tagline ?? "",
    phone: site?.phone ?? "",
    email: site?.email ?? "",
  };

  switch (site?.template) {
    case "classic":
      return <ClassicTemplate {...props} />;
    case "minimal":
      return <MinimalTemplate {...props} />;
    default:
      return <ModernTemplate {...props} />;
  }


}
