import { z } from 'zod';

/**
 * Schema for creating a new conversation
 */
export const CreateConversationSchema = z.object({
  contactId: z.string().min(1, 'Contact ID is required'),
  channel: z.enum(['SMS', 'EMAIL'], {
    errorMap: () => ({ message: 'Channel must be SMS or EMAIL' }),
  }),
  listingId: z.string().optional(),
  leadId: z.string().optional(),
});

export type CreateConversationInput = z.infer<typeof CreateConversationSchema>;

/**
 * Schema for sending a message
 */
export const SendMessageSchema = z.object({
  channel: z.enum(['SMS', 'EMAIL'], {
    errorMap: () => ({ message: 'Channel must be SMS or EMAIL' }),
  }),
  text: z.string().min(1, 'Message text is required').max(1600, 'Message too long'),
  subject: z.string().max(200, 'Subject too long').optional(),
});

export type SendMessageInput = z.infer<typeof SendMessageSchema>;