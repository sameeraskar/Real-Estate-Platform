import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  getConversationOrThrow,
  listMessages,
  createOutboundMessage,
} from "@/lib/messaging/conversationService";
import { SendMessageSchema } from "@/lib/messaging/schemas";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// ============================================================================
// GET - List Messages
// ============================================================================

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: conversationId } = await params;

    const messages = await listMessages(user.tenantId, conversationId);

    return NextResponse.json({ messages });
  } catch (error) {
    if (error instanceof Response) return error;

    console.error("List messages error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ============================================================================
// POST - Send Message (Stub Implementation)
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: conversationId } = await params;

    // Tenant check + includes contact + channel
    const conversation = await getConversationOrThrow(user.tenantId, conversationId);

    // Validate request body (expect text/subject/etc. from your schema)
    const body = await request.json();
    const validated = SendMessageSchema.parse(body);

    // Force channel from conversation (prevents mismatch bugs)
    const channel = conversation.channel;

    // Determine "to" based on conversation channel
    let to: string;
    if (channel === "SMS") {
      to = conversation.contact.phone || "";
      if (!to) {
        return NextResponse.json(
          { error: "Contact has no phone number for SMS" },
          { status: 400 }
        );
      }
    } else if (channel === "EMAIL") {
      to = conversation.contact.email || "";
      if (!to) {
        return NextResponse.json(
          { error: "Contact has no email address" },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json({ error: "Unsupported channel" }, { status: 400 });
    }

    // Tenant messaging profile (no channel field in schema)
    const messagingProfile = await prisma.tenantMessagingProfile.findUnique({
      where: { tenantId: user.tenantId },
      select: {
        smsFromNumber: true,
        emailFromAddress: true,
        emailFromName: true,
      },
    });

    // Determine "from" based on channel
    let from: string;
    if (channel === "SMS") {
      from = messagingProfile?.smsFromNumber || "demo";
    } else {
      // EMAIL
      from = messagingProfile?.emailFromAddress || "demo@example.com";
    }

    // Create outbound message (stub send for now)
    const message = await createOutboundMessage(
      user.tenantId,
      conversationId,
      { ...validated, channel }, // ensure channel matches conversation
      { from, to }
    );

    return NextResponse.json({ message, stub: true }, { status: 201 });
  } catch (error) {
    if (error instanceof Response) return error;

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Send message error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}