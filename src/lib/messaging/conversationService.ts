// src/lib/messaging/conversationService.ts

import { prisma } from "@/lib/prisma";
import type { CreateConversationInput, SendMessageInput } from "@/lib/messaging/schemas";
import { randomUUID } from "crypto";

/**
 * Throw a Response so route handlers can return it directly.
 */
function httpError(status: number, message: string) {
  throw new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// ============================================================================
// Conversations
// ============================================================================

export async function listConversations(tenantId: string) {
  return prisma.conversation.findMany({
    where: { tenantId },
    orderBy: [{ lastMessageAt: "desc" }, { createdAt: "desc" }],
    take: 200,
    include: {
      contact: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
        },
      },
      _count: { select: { messages: true } },
    },
  });
}

export async function getConversationOrThrow(tenantId: string, conversationId: string) {
  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, tenantId },
    include: {
      contact: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
        },
      },
      listing: { select: { id: true, title: true, address: true } },
      lead: { select: { id: true, status: true, source: true } },
    },
  });

  if (!conversation) {
    httpError(404, "Conversation not found");
  }

  return conversation;
}

export async function createConversationOrThrow(
  tenantId: string,
  input: CreateConversationInput
) {
  const contact = await prisma.contact.findFirst({
    where: { id: input.contactId, tenantId },
    select: { id: true },
  });

  if (!contact) {
    httpError(404, "Contact not found");
  }

  let safeListingId: string | null = null;
  if (input.listingId) {
    const listing = await prisma.listing.findFirst({
      where: { id: input.listingId, tenantId },
      select: { id: true },
    });
    if (!listing) httpError(404, "Listing not found");
    safeListingId = listing.id;
  }

  let safeLeadId: string | null = null;
  if (input.leadId) {
    const lead = await prisma.lead.findFirst({
      where: { id: input.leadId, tenantId },
      select: { id: true },
    });
    if (!lead) httpError(404, "Lead not found");
    safeLeadId = lead.id;
  }

  const conversation = await prisma.conversation.create({
    data: {
      tenantId,
      contactId: input.contactId,
      channel: input.channel, // "SMS" | "EMAIL"
      listingId: safeListingId,
      leadId: safeLeadId,
      // status defaults to OPEN
    },
    include: {
      contact: {
        select: { id: true, fullName: true, email: true, phone: true },
      },
      listing: { select: { id: true, title: true, address: true } },
      lead: { select: { id: true, status: true, source: true } },
      _count: { select: { messages: true } },
    },
  });

  return conversation;
}

// ============================================================================
// Messages
// ============================================================================

export async function listMessages(tenantId: string, conversationId: string) {
  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, tenantId },
    select: { id: true },
  });

  if (!conversation) {
    httpError(404, "Conversation not found");
  }

  return prisma.message.findMany({
    where: { tenantId, conversationId },
    orderBy: { createdAt: "asc" },
    take: 500,
    select: {
      id: true,
      createdAt: true,
      updatedAt: true,
      conversationId: true,
      channel: true,
      direction: true,
      status: true,
      from: true,
      to: true,
      subject: true,
      text: true,
      html: true,
      provider: true,
      providerMessageId: true,
      errorCode: true,
      errorMessage: true,
      sentAt: true,
      deliveredAt: true,
      failedAt: true,
      trackingId: true,
    },
  });
}

/**
 * Stub outbound sender: writes Message row + updates conversation timestamps.
 * Real provider sending (Twilio/SendGrid) comes later.
 *
 * ✅ Email open/click tracking foundation:
 * - For EMAIL outbound messages, we generate trackingId and store it on Message.
 * - Pixel/click endpoints will use trackingId to create EngagementEvent rows.
 */
export async function createOutboundMessage(
  tenantId: string,
  conversationId: string,
  validated: SendMessageInput,
  addressing: { from: string; to: string }
) {
  const { from, to } = addressing;

  const convo = await prisma.conversation.findFirst({
    where: { id: conversationId, tenantId },
    select: { id: true, channel: true, status: true },
  });

  if (!convo) httpError(404, "Conversation not found");
  if (convo.status !== "OPEN") httpError(400, "Conversation is not open");

  const now = new Date();

  // ✅ Only email gets trackingId
  const trackingId =
    validated.channel === "EMAIL" ? `trk_${randomUUID().replace(/-/g, "")}` : null;

  const [message] = await prisma.$transaction([
    prisma.message.create({
      data: {
        tenantId,
        conversationId,
        channel: validated.channel,
        direction: "OUTBOUND",
        status: "SENT", // stub
        from,
        to,
        subject: validated.subject ?? null,
        text: validated.text,
        sentAt: now,
        trackingId,
      },
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        conversationId: true,
        channel: true,
        direction: true,
        status: true,
        from: true,
        to: true,
        subject: true,
        text: true,
        sentAt: true,
        trackingId: true,
      },
    }),

    prisma.conversation.updateMany({
      where: { id: conversationId, tenantId },
      data: {
        lastMessageAt: now,
        lastOutboundAt: now,
      },
    }),
  ]);

  return message;
}