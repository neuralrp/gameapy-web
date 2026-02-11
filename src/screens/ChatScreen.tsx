import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ArrowUp } from 'lucide-react';
import { CounselorInfoModal } from '../components/counselor/CounselorInfoModal';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import { HealthStatusIcon } from '../components/shared/HealthStatusIcon';
import { HealthStatusModal } from '../components/shared/HealthStatusModal';
import { useApp } from '../contexts/AppContext';
import { apiService } from '../services/api';
import type { Message } from '../types/message';
import type { Counselor } from '../types/counselor';

export function ChatScreen() {
  const { counselor, setCounselor, clientLoading, sessionId, sessionMessageCount, incrementSessionMessageCount, resetSessionMessageCount, showToast, startHealthChecks, stopHealthChecks, setShowHealthModal } = useApp();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCounselorInfo, setShowCounselorInfo] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    startHealthChecks();
    return () => {
      stopHealthChecks();
    };
  }, []);

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

      if (response.data.counselor_switched && response.data.new_counselor) {
        const newCounselor: Counselor = {
          id: counselor?.id || 0,
          name: response.data.new_counselor.name,
          description: response.data.new_counselor.who_you_are,
          specialty: response.data.new_counselor.your_vibe,
          visuals: response.data.new_counselor.visuals,
        };
        setCounselor(newCounselor);
        showToast({ message: `✨ ${response.data.new_counselor.name} has joined the conversation!`, type: 'success' });
      }

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

  const counselorColor = counselor?.visuals.selectionCard.backgroundColor || '#E8D0A0';
  const counselorTextColor = counselor?.visuals.textColor || '#483018';

  console.log('ChatScreen rendering counselor visuals:', counselor?.visuals);

  return (
    <div className="h-screen flex flex-col fade-in" style={{ backgroundColor: `${counselorColor} !important` }}>
      {/* Header - Taller */}
      <header
        className="flex items-center justify-between px-4 py-5 border-b-2 border-gba-border flex-shrink-0"
        style={{ backgroundColor: `${counselorColor} !important`, color: `${counselorTextColor} !important` }}
      >
        <button
          onClick={handleBack}
          className="flex items-center gap-2 hover:underline min-h-[44px] min-w-[44px]"
          style={{ color: counselorTextColor }}
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => counselor && setShowCounselorInfo(true)}
          className="flex-1 text-center"
        >
          <h1
            className="font-retro text-2xl underline cursor-pointer"
            style={{ color: counselorTextColor }}
          >
            {counselor?.name}
          </h1>
        </button>
        <HealthStatusIcon onClick={() => setShowHealthModal(true)} />
      </header>

      {/* Chat Area */}
      <main
        className="flex-1 flex flex-col p-4 overflow-y-auto"
        style={{ backgroundColor: `${counselorColor} !important` }}
      >
        {messages.length === 0 && (
          <div className="flex-1 flex items-center justify-center text-center">
            <p 
              className="font-sans opacity-75"
              style={{ color: counselorTextColor }}
            >
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
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                      }
                    : {
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                    }
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
      <footer
        className="p-4 border-t-2 border-gba-border flex-shrink-0"
        style={{ backgroundColor: `${counselorColor}99 !important` }}
      >
        <div className="flex gap-3 items-end">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your message..."
            className="input-bubble flex-1 px-4 py-3 font-sans bg-white min-h-[44px]"
            style={{ color: counselorTextColor }}
            disabled={isLoading || !sessionId}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading || !sessionId}
            className="send-button min-h-[44px] min-w-[44px]"
            style={{
              backgroundColor: `${counselor?.visuals.borderColor || '#306850'} !important`
            }}
            aria-label="Send message"
          >
            <ArrowUp className="w-5 h-5 text-white" />
          </button>
        </div>
        {!sessionId && (
          <p 
            className="mt-2 text-xs font-sans opacity-50 text-center"
            style={{ color: counselorTextColor }}
          >
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

      {/* Health Status Modal */}
      <HealthStatusModal />
    </div>
  );
}
