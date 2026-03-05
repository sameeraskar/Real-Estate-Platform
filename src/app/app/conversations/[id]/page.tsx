import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import MessageComposer from "@/components/MessageComposer";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;

  const conversation = await prisma.conversation.findFirst({
    where: {
      id,
      tenantId: user.tenantId, // ✅ tenant isolation
    },
    include: {
      contact: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
        },
      },
      messages: {
        orderBy: { createdAt: "asc" },
        take: 200,
        select: {
          id: true,
          createdAt: true,
          direction: true,
          status: true,
          text: true,
        },
      },
      listing: { select: { id: true, title: true } },
      lead: { select: { id: true, status: true, source: true } },
    },
  });

  if (!conversation) {
    return <div className="p-6">Conversation not found.</div>;
  }

  const headerName = conversation.contact.fullName?.trim() || "Unknown Contact";
  const headerInfo = conversation.contact.phone || conversation.contact.email || "";

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{headerName}</h1>
          {headerInfo ? <p className="text-sm text-gray-500">{headerInfo}</p> : null}
        </div>
      </div>

      {/* Messages */}
      <div className="rounded-lg border bg-white">
        <div className="border-b px-4 py-2 text-sm font-medium">Messages</div>

        <div className="p-4 space-y-3">
          {conversation.messages.length === 0 ? (
            <p className="text-gray-500 text-sm">No messages yet.</p>
          ) : (
            conversation.messages.map((m) => (
              <div key={m.id} className="text-sm">
                <span className="font-medium">{m.direction}</span>
                <span className="text-gray-400"> • </span>
                <span className="text-gray-500">{new Date(m.createdAt).toLocaleString()}</span>
                <div className="mt-1">{m.text || <span className="text-gray-400">(no text)</span>}</div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Composer */}
      <MessageComposer conversationId={id} channel={conversation.channel} />
    </div>
  );
}