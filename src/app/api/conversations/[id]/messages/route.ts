import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth';
import {
  getConversationOrThrow,
  listMessages,
  createOutboundMessage,
  addEngagementEvent,
} from '@/lib/messaging/conversationService';
import { prisma } from '@/lib/prisma';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const sendMessageSchema = z.object({
  channel: z.enum(['SMS', 'EMAIL', 'WHATSAPP', 'FACEBOOK', 'INSTAGRAM', 'VOICE']),
  text: z.string().min(1, 'Message text is required'),
  subject: z.string().optional(),
});

// ============================================================================
// GET - List Messages
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Authenticate user
    const user = await getCurrentUser();
    if (!user || !user.tenantId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const conversationId = params.id;

    // 2. Verify conversation belongs to tenant (throws if not found/unauthorized)
    await getConversationOrThrow(user.tenantId, conversationId);

    // 3. Parse query parameters
    const { searchParams } = new URL(request.url);
    const options = {
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 100,
      cursor: searchParams.get('cursor') || undefined,
    };

    // 4. Get messages with tenant check
    const messages = await listMessages(user.tenantId, conversationId, options);

    return NextResponse.json({
      messages,
      hasMore: messages.length === options.limit,
      nextCursor: messages.length > 0 ? messages[messages.length - 1].id : null,
    });
  } catch (error) {
    console.error('List messages error:', error);

    if (error instanceof Error) {
      if (error.message.includes('not found') || error.message.includes('access denied')) {
        return NextResponse.json(
          { error: 'Conversation not found' },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Send Message (Stub Implementation)
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Authenticate user
    const user = await getCurrentUser();
    if (!user || !user.tenantId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const conversationId = params.id;

    // 2. Verify conversation belongs to tenant
    const conversation = await getConversationOrThrow(user.tenantId, conversationId);

    // 3. Parse and validate request body
    const body = await request.json();
    const validated = sendMessageSchema.parse(body);

    // 4. Get tenant messaging profile for "from" details (stub)
    const messagingProfile = await prisma.tenantMessagingProfile.findFirst({
      where: {
        tenantId: user.tenantId,
        channel: validated.channel,
      },
      select: {
        phoneNumber: true,
        email: true,
      },
    });

    // Determine "from" and "to" based on channel
    let from: string;
    let to: string;

    if (validated.channel === 'SMS' || validated.channel === 'WHATSAPP' || validated.channel === 'VOICE') {
      from = messagingProfile?.phoneNumber || '+1234567890'; // Stub fallback
      to = conversation.contact.phone || '';
    } else if (validated.channel === 'EMAIL') {
      from = messagingProfile?.email || 'noreply@example.com'; // Stub fallback
      to = conversation.contact.email || '';
    } else {
      // For social channels, use IDs
      from = `tenant_${user.tenantId}`;
      to = `contact_${conversation.contactId}`;
    }

    // 5. STUB SEND IMPLEMENTATION
    // Step 1: Create message with QUEUED status
    const now = new Date();
    let message = await prisma.message.create({
      data: {
        conversationId,
        channel: validated.channel,
        direction: 'OUTBOUND',
        text: validated.text,
        subject: validated.subject || null,
        status: 'QUEUED',
        from,
        to,
        provider: 'STUB_PROVIDER',
      },
    });

    // Step 2: Immediately update to SENT (simulating successful send)
    message = await prisma.message.update({
      where: {
        id: message.id,
        conversation: {
          tenantId: user.tenantId, // Ensure tenant isolation
        },
      },
      data: {
        status: 'SENT',
        sentAt: now,
      },
    });

    // Step 3: Update conversation timestamps
    await prisma.conversation.update({
      where: {
        id: conversationId,
        tenantId: user.tenantId,
      },
      data: {
        lastMessageAt: now,
        lastOutboundAt: now,
      },
    });

    // Step 4: Add engagement events (for SMS stub)
    if (validated.channel === 'SMS') {
      // Simulate delivery event
      await addEngagementEvent(user.tenantId, {
        conversationId,
        messageId: message.id,
        type: 'DELIVERED',
        meta: {
          provider: 'STUB_PROVIDER',
          timestamp: now.toISOString(),
        },
      });
    }

    return NextResponse.json(
      {
        message,
        stub: true, // Indicate this is a stub implementation
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Send message error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      if (error.message.includes('not found') || error.message.includes('access denied')) {
        return NextResponse.json(
          { error: 'Conversation not found' },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}