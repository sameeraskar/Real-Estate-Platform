import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { listConversations, createConversationOrThrow } from '@/lib/messaging/conversationService';
import { CreateConversationSchema } from '@/lib/messaging/schemas';
import { z } from 'zod';

export async function GET(_request: NextRequest) {
  try {
    const user = await requireAuth();
    const conversations = await listConversations(user.tenantId);
    return NextResponse.json({ conversations });
  } catch (error) {
    // If requireAuth or service throws a Response, return it directly
    if (error instanceof Response) return error;

    // If requireAuth throws a normal Error, treat Unauthorized explicitly
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.error('List conversations error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    const body = await request.json();
    const validated = CreateConversationSchema.parse(body);

    const conversation = await createConversationOrThrow(user.tenantId, validated);

    return NextResponse.json({ conversation }, { status: 201 });
  } catch (error) {
    if (error instanceof Response) return error;

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Create conversation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}