import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

// ============================================================================
// ZOD SCHEMAS
// ============================================================================

const listConversationsSchema = z.object({
  status: z.enum(['ACTIVE', 'ARCHIVED', 'SNOOZED']).optional(),
  channel: z.enum(['SMS', 'EMAIL', 'WHATSAPP', 'FACEBOOK', 'INSTAGRAM', 'VOICE']).optional(),
  contactId: z.string().optional(),
  limit: z.number().min(1).max(100).default(50).optional(),
  cursor: z.string().optional(),
});

const createConversationSchema = z.object({
  contactId: z.string(),
  channel: z.enum(['SMS', 'EMAIL', 'WHATSAPP', 'FACEBOOK', 'INSTAGRAM', 'VOICE']),
  listingId: z.string().optional(),
  leadId: z.string().optional(),
  assignedUserId: z.string().optional(),
});

const createOutboundMessageSchema = z.object({
  channel: z.enum(['SMS', 'EMAIL', 'WHATSAPP', 'FACEBOOK', 'INSTAGRAM', 'VOICE']),
  text: z.string().min(1),
  subject: z.string().optional(),
});

const outboundMetadataSchema = z.object({
  from: z.string(),
  to: z.string(),
  provider: z.string().optional(),
});

const createInboundMessageSchema = z.object({
  channel: z.enum(['SMS', 'EMAIL', 'WHATSAPP', 'FACEBOOK', 'INSTAGRAM', 'VOICE']),
  text: z.string().min(1),
  subject: z.string().optional(),
  from: z.string(),
  to: z.string(),
  provider: z.string().optional(),
  providerMessageId: z.string().optional(),
});

const addEngagementEventSchema = z.object({
  conversationId: z.string().optional(),
  messageId: z.string().optional(),
  type: z.string(),
  meta: z.record(z.any()).optional(),
});

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type ListConversationsParams = z.infer<typeof listConversationsSchema>;
export type CreateConversationParams = z.infer<typeof createConversationSchema>;
export type CreateOutboundMessageParams = z.infer<typeof createOutboundMessageSchema>;
export type OutboundMetadata = z.infer<typeof outboundMetadataSchema>;
export type CreateInboundMessageParams = z.infer<typeof createInboundMessageSchema>;
export type AddEngagementEventParams = z.infer<typeof addEngagementEventSchema>;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Verify that a contact belongs to the specified tenant
 */
async function verifyContactOwnership(tenantId: string, contactId: string): Promise<void> {
  const contact = await prisma.contact.findFirst({
    where: {
      id: contactId,
      tenantId,
    },
    select: { id: true },
  });

  if (!contact) {
    throw new Error(`Contact ${contactId} not found or does not belong to tenant ${tenantId}`);
  }
}

/**
 * Verify that a user belongs to the specified tenant
 */
async function verifyUserOwnership(tenantId: string, userId: string): Promise<void> {
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      tenantId,
    },
    select: { id: true },
  });

  if (!user) {
    throw new Error(`User ${userId} not found or does not belong to tenant ${tenantId}`);
  }
}

/**
 * Verify that a listing belongs to the specified tenant
 */
async function verifyListingOwnership(tenantId: string, listingId: string): Promise<void> {
  const listing = await prisma.listing.findFirst({
    where: {
      id: listingId,
      tenantId,
    },
    select: { id: true },
  });

  if (!listing) {
    throw new Error(`Listing ${listingId} not found or does not belong to tenant ${tenantId}`);
  }
}

/**
 * Verify that a lead belongs to the specified tenant
 */
async function verifyLeadOwnership(tenantId: string, leadId: string): Promise<void> {
  const lead = await prisma.lead.findFirst({
    where: {
      id: leadId,
      tenantId,
    },
    select: { id: true },
  });

  if (!lead) {
    throw new Error(`Lead ${leadId} not found or does not belong to tenant ${tenantId}`);
  }
}

// ============================================================================
// CONVERSATION OPERATIONS
// ============================================================================

/**
 * Get a conversation by ID with tenant ownership check
 * Throws if conversation doesn't exist or doesn't belong to tenant
 */
export async function getConversationOrThrow(
  tenantId: string,
  conversationId: string
) {
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      tenantId,
    },
    include: {
      contact: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
      },
      assignedUser: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      listing: {
        select: {
          id: true,
          title: true,
          address: true,
        },
      },
      lead: {
        select: {
          id: true,
          status: true,
          source: true,
        },
      },
    },
  });

  if (!conversation) {
    throw new Error(`Conversation ${conversationId} not found or access denied`);
  }

  return conversation;
}

/**
 * List conversations for a tenant with optional filters
 */
export async function listConversations(
  tenantId: string,
  params: ListConversationsParams = {}
) {
  const validated = listConversationsSchema.parse(params);

  const where: Prisma.ConversationWhereInput = {
    tenantId,
    ...(validated.status && { status: validated.status }),
    ...(validated.channel && { channel: validated.channel }),
    ...(validated.contactId && { contactId: validated.contactId }),
  };

  const [conversations, total] = await Promise.all([
    prisma.conversation.findMany({
      where,
      include: {
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
      orderBy: {
        lastMessageAt: 'desc',
      },
      take: validated.limit || 50,
      ...(validated.cursor && {
        skip: 1,
        cursor: {
          id: validated.cursor,
        },
      }),
    }),
    prisma.conversation.count({ where }),
  ]);

  return {
    conversations,
    total,
    hasMore: conversations.length === (validated.limit || 50),
    nextCursor: conversations.length > 0 ? conversations[conversations.length - 1].id : null,
  };
}

/**
 * Create a new conversation or return existing one
 * Ensures all related entities belong to the tenant
 */
export async function createOrGetConversation(
  tenantId: string,
  params: CreateConversationParams
) {
  const validated = createConversationSchema.parse(params);

  // Verify contact ownership
  await verifyContactOwnership(tenantId, validated.contactId);

  // Verify optional relations
  if (validated.assignedUserId) {
    await verifyUserOwnership(tenantId, validated.assignedUserId);
  }
  if (validated.listingId) {
    await verifyListingOwnership(tenantId, validated.listingId);
  }
  if (validated.leadId) {
    await verifyLeadOwnership(tenantId, validated.leadId);
  }

  // Check if conversation already exists
  const existing = await prisma.conversation.findFirst({
    where: {
      tenantId,
      contactId: validated.contactId,
      channel: validated.channel,
      status: 'ACTIVE',
    },
    include: {
      contact: true,
      assignedUser: true,
      listing: true,
      lead: true,
    },
  });

  if (existing) {
    return { conversation: existing, created: false };
  }

  // Create new conversation
  const conversation = await prisma.conversation.create({
    data: {
      tenantId,
      contactId: validated.contactId,
      channel: validated.channel,
      status: 'ACTIVE',
      ...(validated.listingId && { listingId: validated.listingId }),
      ...(validated.leadId && { leadId: validated.leadId }),
      ...(validated.assignedUserId && { assignedUserId: validated.assignedUserId }),
      lastMessageAt: new Date(),
    },
    include: {
      contact: true,
      assignedUser: true,
      listing: true,
      lead: true,
    },
  });

  return { conversation, created: true };
}

// ============================================================================
// MESSAGE OPERATIONS
// ============================================================================

/**
 * List messages for a conversation with tenant check
 */
export async function listMessages(
  tenantId: string,
  conversationId: string,
  options: { limit?: number; cursor?: string } = {}
) {
  // Verify conversation ownership first
  await getConversationOrThrow(tenantId, conversationId);

  const messages = await prisma.message.findMany({
    where: {
      conversationId,
      conversation: {
        tenantId, // Double-check tenant isolation
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: options.limit || 100,
    ...(options.cursor && {
      skip: 1,
      cursor: {
        id: options.cursor,
      },
    }),
  });

  return messages;
}

/**
 * Create an outbound message
 * Updates conversation timestamps
 */
export async function createOutboundMessage(
  tenantId: string,
  conversationId: string,
  messageData: CreateOutboundMessageParams,
  metadata: OutboundMetadata
) {
  const validatedMessage = createOutboundMessageSchema.parse(messageData);
  const validatedMetadata = outboundMetadataSchema.parse(metadata);

  // Verify conversation ownership
  await getConversationOrThrow(tenantId, conversationId);

  const now = new Date();

  // Create message and update conversation in a transaction
  const [message] = await prisma.$transaction([
    prisma.message.create({
      data: {
        conversationId,
        channel: validatedMessage.channel,
        direction: 'OUTBOUND',
        text: validatedMessage.text,
        subject: validatedMessage.subject || null,
        status: 'SENT',
        from: validatedMetadata.from,
        to: validatedMetadata.to,
        provider: validatedMetadata.provider || null,
        sentAt: now,
      },
    }),
    prisma.conversation.update({
      where: {
        id: conversationId,
        tenantId, // Ensure tenant isolation
      },
      data: {
        lastMessageAt: now,
        lastOutboundAt: now,
      },
    }),
  ]);

  return message;
}

/**
 * Create an inbound message
 * Updates conversation timestamps
 */
export async function createInboundMessage(
  tenantId: string,
  conversationId: string,
  messageData: CreateInboundMessageParams
) {
  const validated = createInboundMessageSchema.parse(messageData);

  // Verify conversation ownership
  await getConversationOrThrow(tenantId, conversationId);

  const now = new Date();

  // Create message and update conversation in a transaction
  const [message] = await prisma.$transaction([
    prisma.message.create({
      data: {
        conversationId,
        channel: validated.channel,
        direction: 'INBOUND',
        text: validated.text,
        subject: validated.subject || null,
        status: 'RECEIVED',
        from: validated.from,
        to: validated.to,
        provider: validated.provider || null,
        providerMessageId: validated.providerMessageId || null,
        receivedAt: now,
      },
    }),
    prisma.conversation.update({
      where: {
        id: conversationId,
        tenantId, // Ensure tenant isolation
      },
      data: {
        lastMessageAt: now,
        lastInboundAt: now,
        unreadCount: {
          increment: 1,
        },
      },
    }),
  ]);

  return message;
}

// ============================================================================
// ENGAGEMENT EVENTS
// ============================================================================

/**
 * Add an engagement event
 * Validates conversation/message ownership if provided
 */
export async function addEngagementEvent(
  tenantId: string,
  params: AddEngagementEventParams
) {
  const validated = addEngagementEventSchema.parse(params);

  // Verify conversation ownership if conversationId provided
  if (validated.conversationId) {
    await getConversationOrThrow(tenantId, validated.conversationId);
  }

  // Verify message ownership if messageId provided
  if (validated.messageId) {
    const message = await prisma.message.findFirst({
      where: {
        id: validated.messageId,
        conversation: {
          tenantId,
        },
      },
      select: { id: true },
    });

    if (!message) {
      throw new Error(`Message ${validated.messageId} not found or access denied`);
    }
  }

  const event = await prisma.engagementEvent.create({
    data: {
      tenantId,
      type: validated.type,
      conversationId: validated.conversationId || null,
      messageId: validated.messageId || null,
      meta: validated.meta || Prisma.JsonNull,
      timestamp: new Date(),
    },
  });

  return event;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Mark conversation as read
 */
export async function markConversationAsRead(
  tenantId: string,
  conversationId: string
) {
  await getConversationOrThrow(tenantId, conversationId);

  return prisma.conversation.update({
    where: {
      id: conversationId,
      tenantId,
    },
    data: {
      unreadCount: 0,
      lastReadAt: new Date(),
    },
  });
}

/**
 * Update conversation status
 */
export async function updateConversationStatus(
  tenantId: string,
  conversationId: string,
  status: 'ACTIVE' | 'ARCHIVED' | 'SNOOZED'
) {
  await getConversationOrThrow(tenantId, conversationId);

  return prisma.conversation.update({
    where: {
      id: conversationId,
      tenantId,
    },
    data: {
      status,
    },
  });
}

/**
 * Assign conversation to user
 */
export async function assignConversation(
  tenantId: string,
  conversationId: string,
  userId: string
) {
  await getConversationOrThrow(tenantId, conversationId);
  await verifyUserOwnership(tenantId, userId);

  return prisma.conversation.update({
    where: {
      id: conversationId,
      tenantId,
    },
    data: {
      assignedUserId: userId,
    },
  });
}