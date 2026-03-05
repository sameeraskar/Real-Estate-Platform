import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// 1x1 transparent GIF
const PIXEL = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==",
  "base64"
);

export async function GET(req: NextRequest) {
  const tid = req.nextUrl.searchParams.get("tid") || "";

  if (tid) {
    try {
      const message = await prisma.message.findUnique({
        where: { trackingId: tid },
        select: {
          id: true,
          tenantId: true,
          conversationId: true,
          channel: true,
        },
      });

      // Only track opens for EMAIL messages
      if (message && message.channel === "EMAIL") {
        const ua = req.headers.get("user-agent") || null;

        await prisma.engagementEvent.create({
          data: {
            tenantId: message.tenantId,
            type: "OPEN",
            conversationId: message.conversationId,
            messageId: message.id,
            meta: {
              userAgent: ua,
              // ip is not reliable in dev / proxies; we keep it optional
            },
          },
        });

        // Optional: mark deliveredAt if not set yet (many systems do this)
        await prisma.message.updateMany({
          where: { id: message.id, deliveredAt: null },
          data: { deliveredAt: new Date() },
        });
      }
    } catch (e) {
      // Never break the pixel response
      console.error("Open tracking error:", e);
    }
  }

  return new NextResponse(PIXEL, {
    status: 200,
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    },
  });
}