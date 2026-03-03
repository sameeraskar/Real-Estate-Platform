import { prisma } from '@/lib/prisma';
import { CreateConversationSchema, SendMessageSchema } from './schemas';
import type { CreateConversationInput, SendMessageInput } from './schemas';

// ============================================================================
// CONVERSATION OPERATIONS
// ============================================================================

/**
 * Get a conversation by ID with tenant ownership check
 * Throws Response 404 if conversation doesn't exist or doesn't belong to tenant
 */
export async function getConversationOrThrow(
  tenantId: string,
  conversationId: string
) {
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      tenantId, // TENANT ISOLATION
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
    throw new Response('Conversation not found', { status: 404 });
  }

  return conversation;
}

/**
 * List all conversations for a tenant
 * Returns conversations ordered by lastMessageAt descending
 */
export async function listConversations(tenantId: string) {
  const conversations = await prisma.conversation.findMany({
    where: {
      tenantId, // TENANT ISOLATION
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
      _count: {
        select: {
          messages: true,
        },
      },
    },
    orderBy: {
      lastMessageAt: 'desc',
    },
  });

  return conversations;
}

/**
 * Create a new conversation
 * Verifies contact belongs to tenant before creating
 * Throws Response 404 if contact not found
 */
export async function createConversationOrThrow(
  tenantId: string,
  data: CreateConversationInput
) {
  // Validate input
  const validated = CreateConversationSchema.parse(data);

  // Verify contact belongs to tenant
  const contact = await prisma.contact.findFirst({
    where: {
      id: validated.contactId,
      tenantId, // TENANT ISOLATION
    },
    select: { id: true },
  });

  if (!contact) {
    throw new Response('Contact not found or access denied', { status: 404 });
  }

  // Verify listing belongs to tenant if provided
  if (validated.listingId) {
    const listing = await prisma.listing.findFirst({
      where: {
        id: validated.listingId,
        tenantId, // TENANT ISOLATION
      },
      select: { id: true },
    });

    if (!listing) {
      throw new Response('Listing not found or access denied', { status: 404 });
    }
  }

  // Verify lead belongs to tenant if provided
  if (validated.leadId) {
    const lead = await prisma.lead.findFirst({
      where: {
        id: validated.leadId,
        tenantId, // TENANT ISOLATION
      },
      select: { id: true },
    });

    if (!lead) {
      throw new Response('Lead not found or access denied', { status: 404 });
    }
  }

  // Create conversation
  const conversation = await prisma.conversation.create({
    data: {
      tenantId, // TENANT ISOLATION
      contactId: validated.contactId,
      channel: validated.channel,
      status: 'ACTIVE',
      listingId: validated.listingId || null,
      leadId: validated.leadId || null,
      lastMessageAt: new Date(),
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

  return conversation;
}

// ============================================================================
// MESSAGE OPERATIONS
// ============================================================================

/**
 * List messages for a conversation
 * Verifies conversation belongs to tenant
 * Returns messages ordered by createdAt ascending (oldest first)
 */
export async function listMessages(
  tenantId: string,
  conversationId: string
) {
  // Verify conversation ownership first
  await getConversationOrThrow(tenantId, conversationId);

  const messages = await prisma.message.findMany({
    where: {
      conversationId,
      conversation: {
        tenantId, // TENANT ISOLATION - double check
      },
    },
    orderBy: {
      createdAt: 'asc', // Oldest first (chat order)
    },
  });

  return messages;
}

/**
 * Create an outbound message
 * Stub implementation: immediately marks as SENT
 * Updates conversation timestamps
 */
export async function createOutboundMessage(
  tenantId: string,
  conversationId: string,
  messageData: SendMessageInput,
  metadata: { from: string; to: string }
) {
  // Validate input
  const validated = SendMessageSchema.parse(messageData);

  // Verify conversation ownership
  await getConversationOrThrow(tenantId, conversationId);

  const now = new Date();

  // Create message and update conversation in a transaction
  const [message] = await prisma.$transaction([
    // Create outbound message
    prisma.message.create({
      data: {
        conversationId,
        channel: validated.channel,
        direction: 'OUTBOUND',
        text: validated.text,
        subject: validated.subject || null,
        status: 'SENT', // Stub: immediately mark as sent
        from: metadata.from,
        to: metadata.to,
        sentAt: now,
      },
    }),
    // Update conversation timestamps
    prisma.conversation.update({
      where: {
        id: conversationId,
        tenantId, // TENANT ISOLATION
      },
      data: {
        lastMessageAt: now,
        lastOutboundAt: now,
      },
    }),
  ]);

  return message;
}