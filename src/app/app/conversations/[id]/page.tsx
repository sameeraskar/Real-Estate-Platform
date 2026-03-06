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
      tenantId: user.tenantId,
    },
    include: {
      contact: {
        select: { id: true, fullName: true, email: true, phone: true },
      },
      messages: {
        orderBy: { createdAt: "asc" },
        take: 200,
        select: {
          id: true,
          createdAt: true,
          direction: true,
          status: true,
          channel: true,
          subject: true,
          text: true,
          trackingId: true,
        },
      },
      engagementEvents: {
        orderBy: { occurredAt: "desc" },
        take: 200,
        select: {
          id: true,
          type: true,
          occurredAt: true,
          messageId: true,
          meta: true,
        },
      },
    },
  });

  if (!conversation) {
    return <div className="p-6">Conversation not found.</div>;
  }

  const headerName = conversation.contact.fullName?.trim() || "Unknown Contact";
  const headerInfo = conversation.contact.phone || conversation.contact.email || "";

  // --- Engagement stats (conversation-level) ---
  const openEvents = conversation.engagementEvents.filter((e) => e.type === "OPEN");
  const clickEvents = conversation.engagementEvents.filter((e) => e.type === "CLICK");

  const lastOpen = openEvents[0]?.occurredAt ?? null;
  const lastClick = clickEvents[0]?.occurredAt ?? null;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{headerName}</h1>
          {headerInfo ? <p className="text-sm text-gray-500">{headerInfo}</p> : null}
        </div>
      </div>

      {/* Engagement Panel */}
      <div className="rounded-lg border bg-white p-4">
        <div className="text-sm font-medium mb-3">Engagement</div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <div className="rounded-md border p-3">
            <div className="text-gray-500">Opens</div>
            <div className="text-lg font-semibold">{openEvents.length}</div>
            <div className="text-xs text-gray-500">
              {lastOpen ? `Last: ${new Date(lastOpen).toLocaleString()}` : "No opens yet"}
            </div>
          </div>

          <div className="rounded-md border p-3">
            <div className="text-gray-500">Clicks</div>
            <div className="text-lg font-semibold">{clickEvents.length}</div>
            <div className="text-xs text-gray-500">
              {lastClick ? `Last: ${new Date(lastClick).toLocaleString()}` : "No clicks yet"}
            </div>
          </div>

          <div className="rounded-md border p-3">
            <div className="text-gray-500">Channel</div>
            <div className="text-lg font-semibold">{conversation.channel}</div>
            <div className="text-xs text-gray-500">Conversation</div>
          </div>

          <div className="rounded-md border p-3">
            <div className="text-gray-500">Status</div>
            <div className="text-lg font-semibold">{conversation.status}</div>
            <div className="text-xs text-gray-500">Workflow</div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="rounded-lg border bg-white">
        <div className="border-b px-4 py-2 text-sm font-medium">Messages</div>

        <div className="p-4 space-y-4">
          {conversation.messages.length === 0 ? (
            <p className="text-gray-500 text-sm">No messages yet.</p>
          ) : (
            conversation.messages.map((m) => (
              <div key={m.id} className="text-sm rounded-md border p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{m.direction}</span>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-500">{new Date(m.createdAt).toLocaleString()}</span>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-500">{m.status}</span>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-500">{m.channel}</span>
                </div>

                {m.channel === "EMAIL" && m.subject ? (
                  <div className="mt-2">
                    <span className="text-gray-500">Subject: </span>
                    <span className="font-medium">{m.subject}</span>
                  </div>
                ) : null}

                <div className="mt-2 whitespace-pre-wrap">
                  {m.text || <span className="text-gray-400">(no text)</span>}
                </div>

                {m.channel === "EMAIL" && m.trackingId ? (
                  <div className="mt-2 text-xs text-gray-500">
                    Tracking ID: <span className="font-mono">{m.trackingId}</span>
                  </div>
                ) : null}
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