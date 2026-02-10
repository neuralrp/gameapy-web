import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ArrowUp } from 'lucide-react';
import { CounselorInfoModal } from '../components/counselor/CounselorInfoModal';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import { useApp } from '../contexts/AppContext';
import { apiService } from '../services/api';
import type { Message } from '../types/message';

export function ChatScreen() {
  const { counselor, setCounselor, clientLoading, sessionId, sessionMessageCount, incrementSessionMessageCount, resetSessionMessageCount, showToast } = useApp();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCounselorInfo, setShowCounselorInfo] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    return () => {
      if (sessionId && sessionMessageCount > 0) {
        apiService.analyzeSession(sessionId).catch(err => {
          console.error('Background session analysis failed:', err);
        });
      }
    };
  }, [sessionId, sessionMessageCount]);

  const handleBack = () => {
    resetSessionMessageCount();
    setCounselor(null);
  };

  const triggerCardAnalysis = async () => {
    if (!sessionId) return;

    try {
      const response = await apiService.analyzeSession(sessionId);
      if (response.success && response.data) {
        showToast({ message: `✅ ${response.data.cards_updated} cards updated`, type: 'success' });
      }
    } catch (err) {
      console.error('Card analysis failed:', err);
    }
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

      incrementSessionMessageCount();

      if (sessionMessageCount > 0 && (sessionMessageCount + 1) % 5 === 0) {
        triggerCardAnalysis();
      }
    } catch (err) {
      showToast({ message: err instanceof Error ? err.message : 'Failed to send message', type: 'error' });
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
    <div className="h-screen flex flex-col fade-in">
      {/* Header - Taller */}
      <header className="flex items-center justify-between px-4 py-5 border-b-2 border-gba-border bg-gba-ui flex-shrink-0">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-gba-text hover:underline min-h-[44px] min-w-[44px]"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => counselor && setShowCounselorInfo(true)}
          className="flex-1 text-center"
        >
          <h1 className="font-retro text-2xl text-gba-text underline cursor-pointer">
            {counselor?.name}
          </h1>
        </button>
        <div className="w-[44px]" />
      </header>

      {/* Chat Area */}
      <main className="flex-1 flex flex-col p-4 overflow-y-auto bg-gba-bg">
        {messages.length === 0 && (
          <div className="flex-1 flex items-center justify-center text-center">
            <p className="font-sans text-gba-text opacity-75">
              Start a conversation with {counselor?.name}
            </p>
          </div>
        )}

        <div className="space-y-3 flex-1 overflow-y-auto">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`message-bubble ${
                  message.role === 'user' ? 'user' : 'assistant'
                }`}
                style={
                  message.role === 'assistant' && counselor?.visuals
                    ? {
                        backgroundColor: counselor.visuals.chatBubble.backgroundColor,
                        color: counselor.visuals.chatBubble.textColor,
                      }
                    : {}
                }
              >
                <p className="font-sans text-base whitespace-pre-wrap">
                  {message.content}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <footer className="p-4 border-t-2 border-gba-border bg-gba-ui flex-shrink-0">
        <div className="flex gap-3 items-end">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your message..."
            className="input-bubble flex-1 px-4 py-3 font-sans text-gba-text bg-white min-h-[44px]"
            disabled={isLoading || !sessionId}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading || !sessionId}
            className="send-button min-h-[44px] min-w-[44px]"
            aria-label="Send message"
          >
            <ArrowUp className="w-5 h-5 text-white" />
          </button>
        </div>
        {!sessionId && (
          <p className="mt-2 text-xs font-sans text-gba-text opacity-50 text-center">
            Connecting to session...
          </p>
        )}
      </footer>

      {/* Counselor Info Modal */}
      {showCounselorInfo && counselor && (
        <CounselorInfoModal
          counselor={counselor}
          onClose={() => setShowCounselorInfo(false)}
        />
      )}
    </div>
  );
}
