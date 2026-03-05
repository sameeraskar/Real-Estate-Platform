import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function isSafeHttpUrl(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  const tid = req.nextUrl.searchParams.get("tid") || "";
  const u = req.nextUrl.searchParams.get("u") || "";

  const decodedUrl = decodeURIComponent(u);

  // Always redirect somewhere safe
  if (!decodedUrl || !isSafeHttpUrl(decodedUrl)) {
    return NextResponse.redirect(new URL("/", req.url), { status: 302 });
  }

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

      if (message && message.channel === "EMAIL") {
        const ua = req.headers.get("user-agent") || null;

        await prisma.engagementEvent.create({
          data: {
            tenantId: message.tenantId,
            type: "CLICK",
            conversationId: message.conversationId,
            messageId: message.id,
            meta: {
              url: decodedUrl,
              userAgent: ua,
            },
          },
        });
      }
    } catch (e) {
      // Never break redirect
      console.error("Click tracking error:", e);
    }
  }

  return NextResponse.redirect(decodedUrl, { status: 302 });
}