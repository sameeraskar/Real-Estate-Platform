import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth';
import { createOrGetConversation } from '@/lib/messaging/conversationService';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const createConversationSchema = z.object({
  contactId: z.string().min(1, 'Contact ID is required'),
  channel: z.enum(['SMS', 'EMAIL', 'WHATSAPP', 'FACEBOOK', 'INSTAGRAM', 'VOICE']),
  listingId: z.string().optional(),
  leadId: z.string().optional(),
  assignedUserId: z.string().optional(),
});

// ============================================================================
// GET - List Conversations
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate user
    const user = await getCurrentUser();
    if (!user || !user.tenantId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Parse query parameters
    const { searchParams } = new URL(request.url);
    const filters = {
      status: searchParams.get('status') as 'ACTIVE' | 'ARCHIVED' | 'SNOOZED' | undefined,
      channel: searchParams.get('channel') as 'SMS' | 'EMAIL' | 'WHATSAPP' | 'FACEBOOK' | 'INSTAGRAM' | 'VOICE' | undefined,
      contactId: searchParams.get('contactId') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
      cursor: searchParams.get('cursor') || undefined,
    };

    // 3. Import and call service function
    const { listConversations } = await import('@/lib/messaging/conversationService');
    const result = await listConversations(user.tenantId, filters);

    return NextResponse.json({
      conversations: result.conversations,
      total: result.total,
      hasMore: result.hasMore,
      nextCursor: result.nextCursor,
    });
  } catch (error) {
    console.error('List conversations error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Create or Get Conversation
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const user = await getCurrentUser();
    if (!user || !user.tenantId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Parse and validate request body
    const body = await request.json();
    const validated = createConversationSchema.parse(body);

    // 3. Create or get conversation with tenant isolation
    const result = await createOrGetConversation(user.tenantId, validated);

    return NextResponse.json(
      {
        conversation: result.conversation,
        created: result.created,
      },
      { status: result.created ? 201 : 200 }
    );
  } catch (error) {
    console.error('Create conversation error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      // Handle tenant ownership errors
      if (error.message.includes('not found') || error.message.includes('does not belong')) {
        return NextResponse.json(
          { error: error.message },
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