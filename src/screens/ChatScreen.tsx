import { useState, useEffect, useRef } from 'react';
import { Settings, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import { useApp } from '../contexts/AppContext';
import { apiService } from '../services/api';
import type { Message } from '../types/message';

export function ChatScreen() {
  const { counselor, setCounselor, setShowInventory, clientLoading, sessionId } = useApp();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleBack = () => {
    setCounselor(null);
  };

  const handleSettings = () => {
    setShowInventory(true);
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading || !sessionId) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setError(null);
    setIsLoading(true);

    try {
      const response = await apiService.sendMessage({
        session_id: sessionId,
        message_data: {
          role: 'user',
          content: userMessage.content,
        },
      });

      const aiMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response.data.ai_response,
        timestamp: new Date().toISOString(),
        cards_loaded: response.data.cards_loaded,
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = async (messageContent: string) => {
    if (!sessionId) return;

    setError(null);
    setIsLoading(true);

    try {
      const response = await apiService.sendMessage({
        session_id: sessionId,
        message_data: {
          role: 'user',
          content: messageContent,
        },
      });

      const aiMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response.data.ai_response,
        timestamp: new Date().toISOString(),
        cards_loaded: response.data.cards_loaded,
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  if (clientLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gba-bg">
        <LoadingSpinner message="Setting up your profile..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col fade-in">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b-2 border-gba-border bg-gba-ui flex-shrink-0">
        <Button
          onClick={handleBack}
          variant="secondary"
          size="sm"
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <h1 className="font-retro text-xl text-gba-text flex-1 text-center px-2">
          {counselor?.name}
        </h1>
        <button
          onClick={handleSettings}
          className="p-2 border-2 border-gba-border rounded hover:bg-gba-highlight transition-colors min-h-[44px] min-w-[44px]"
          aria-label="Settings"
        >
          <Settings className="w-6 h-6 text-gba-text" />
        </button>
      </header>

      {/* Chat Area */}
      <main className="flex-1 flex flex-col p-4 overflow-y-auto">
        {messages.length === 0 && (
          <div className="flex-1 flex items-center justify-center text-center">
            <p className="font-sans text-gba-text opacity-75">
              Start a conversation with {counselor?.name}
            </p>
          </div>
        )}

          <div className="space-y-4 flex-1 overflow-y-auto">
           {messages.map((message) => (
             <div
               key={message.id}
               className={`flex ${
                 message.role === 'user' ? 'justify-end' : 'justify-start'
               }`}
             >
               <div
                 className={`max-w-[85%] sm:max-w-[80%] p-3 border-2 rounded-lg break-words ${
                   message.role === 'user'
                     ? 'bg-gba-highlight text-gba-border'
                     : ''
                 }`}
                 style={
                   message.role === 'assistant' && counselor?.visuals
                     ? {
                         backgroundColor: counselor.visuals.chatBubble.backgroundColor,
                         borderColor: counselor.visuals.chatBubble.borderColor,
                         borderWidth: counselor.visuals.chatBubble.borderWidth,
                         borderStyle: counselor.visuals.chatBubble.borderStyle,
                         borderRadius: counselor.visuals.chatBubble.borderRadius,
                         color: counselor.visuals.chatBubble.textColor,
                       }
                     : {}
                 }
               >
                 <p className="font-sans text-base sm:text-sm whitespace-pre-wrap">
                   {message.content}
                 </p>
                 {message.cards_loaded !== undefined && message.cards_loaded > 0 && (
                   <div className="mt-2 pt-2 border-t border-gba-border flex items-center gap-1">
                     <span className="text-xs">📎 {message.cards_loaded} cards loaded</span>
                   </div>
                 )}
               </div>
             </div>
           ))}
           <div ref={messagesEndRef} />
         </div>
      </main>

      {/* Input Area */}
      <footer className="p-4 border-t-2 border-gba-border bg-gba-ui flex-shrink-0">
        {error && (
          <div className="mb-2 p-3 bg-red-100 border-2 border-red-500 text-red-700 rounded font-sans text-sm">
            <p className="mb-2">{error}</p>
            {messages.length > 0 && (
              <Button onClick={() => handleRetry(messages[messages.length - 1].content)} size="sm">
                Retry
              </Button>
            )}
          </div>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border-2 border-gba-border rounded-lg font-sans text-gba-text bg-white min-h-[44px]"
            disabled={isLoading || !sessionId}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading || !sessionId}
            size="md"
          >
            {isLoading ? '...' : 'Send'}
          </Button>
        </div>
        {!sessionId && (
          <p className="mt-2 text-xs font-sans text-gba-text opacity-50">
            Connecting to session...
          </p>
        )}
      </footer>
    </div>
  );
}
