import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = (await getServerSession(authOptions)) as any;
  if (!session?.tenantId) redirect("/login");

  return (
    <div className="min-h-screen flex bg-gray-50 text-gray-900">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-white p-6 space-y-6">
        <div className="text-lg font-semibold text-gray-900">Dashboard</div>

        <nav className="flex flex-col gap-2 text-sm">
          <Link
            href="/app"
            className="rounded-md px-3 py-2 text-gray-800 hover:bg-gray-100"
          >
            Dashboard
          </Link>

          <Link
            href="/app/listings"
            className="rounded-md px-3 py-2 text-gray-800 hover:bg-gray-100"
          >
            Listings
          </Link>

          <Link
            href="/app/leads"
            className="rounded-md px-3 py-2 text-gray-800 hover:bg-gray-100"
          >
            Leads
          </Link>

          <Link
            href="/app/contacts"
            className="rounded-md px-3 py-2 text-gray-800 hover:bg-gray-100"
          >
            Contacts
          </Link>

          <Link
            href="/app/conversations"
            className="rounded-md px-3 py-2 text-gray-800 hover:bg-gray-100"
          >
            Messages
          </Link>

          <Link
            href="/app/settings"
            className="rounded-md px-3 py-2 text-gray-800 hover:bg-gray-100"
          >
            Settings
          </Link>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
