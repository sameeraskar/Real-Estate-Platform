import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import MessageComposer from '@/components/MessageComposer';

async function getConversation(conversationId: string) {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/auth/signin');
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const response = await fetch(`${baseUrl}/api/conversations/${conversationId}`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch conversation');
  }

  const data = await response.json();
  return data.conversation;
}

async function getMessages(conversationId: string) {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/auth/signin');
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const response = await fetch(`${baseUrl}/api/conversations/${conversationId}/messages`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch messages');
  }

  const data = await response.json();
  return data.messages || [];
}

function formatMessageTime(date: string | Date) {
  const d = new Date(date);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export default async function ConversationPage({ params }: { params: { id: string } }) {
  const [conversation, messages] = await Promise.all([
    getConversation(params.id),
    getMessages(params.id),
  ]);

  const contactName = conversation.contact 
    ? `${conversation.contact.firstName || ''} ${conversation.contact.lastName || ''}`.trim() || 'Unknown Contact'
    : 'Unknown Contact';

  // Reverse to show oldest first (bottom to top like chat)
  const sortedMessages = [...messages].reverse();

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          
            href="/app/conversations"
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </a>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{contactName}</h1>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span>{conversation.contact?.email || conversation.contact?.phone}</span>
              <span>•</span>
              <span className="capitalize">{conversation.channel.toLowerCase()}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            {conversation.status}
          </span>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {sortedMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <p>No messages yet. Send the first message below.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 max-w-4xl mx-auto">
            {sortedMessages.map((message: any) => {
              const isOutbound = message.direction === 'OUTBOUND';
              
              return (
                <div
                  key={message.id}
                  className={`flex ${isOutbound ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-lg ${isOutbound ? 'items-end' : 'items-start'} flex flex-col`}>
                    <div
                      className={`rounded-lg px-4 py-3 ${
                        isOutbound
                          ? 'bg-blue-600 text-white'
                          : 'bg-white border border-gray-200 text-gray-900'
                      }`}
                    >
                      {message.subject && (
                        <div className={`font-semibold mb-1 ${isOutbound ? 'text-blue-100' : 'text-gray-700'}`}>
                          {message.subject}
                        </div>
                      )}
                      <p className="whitespace-pre-wrap break-words">{message.text}</p>
                    </div>
                    <div className="flex items-center mt-1 space-x-2 text-xs text-gray-500">
                      <span>{formatMessageTime(message.createdAt)}</span>
                      {isOutbound && message.status && (
                        <>
                          <span>•</span>
                          <span className="capitalize">{message.status.toLowerCase()}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Message Composer */}
      <div className="bg-white border-t border-gray-200 px-6 py-4">
        <MessageComposer 
          conversationId={params.id} 
          channel={conversation.channel}
        />
      </div>
    </div>
  );
}