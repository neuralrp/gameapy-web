import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ArrowUp, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    startHealthChecks();
    return () => {
      stopHealthChecks();
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
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
        apiService.analyzeSessionFriendship(sessionId).catch(err => {
          console.error('Background friendship analysis failed:', err);
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

    const assistantMessageId = crypto.randomUUID();
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, assistantMessage]);

    let retries = 0;
    const maxRetries = 3;

    while (retries < maxRetries) {
      try {
        const stream = apiService.sendMessageStream({
          session_id: sessionId,
          message_data: {
            role: 'user',
            content: userMessage.content,
          },
        });

        let fullContent = '';

        for await (const chunk of stream) {
          if (chunk.type === 'content' && chunk.content) {
            fullContent += chunk.content;
            setMessages(prev =>
              prev.map(msg =>
                msg.id === assistantMessageId
                  ? { ...msg, content: fullContent }
                  : msg
              )
            );
            requestAnimationFrame(() => scrollToBottom());
          } else if (chunk.type === 'done' && chunk.data) {
            const { cards_loaded, counselor_switched, new_counselor } = chunk.data;

            setMessages(prev =>
              prev.map(msg =>
                msg.id === assistantMessageId
                  ? { ...msg, cards_loaded }
                  : msg
              )
            );

            incrementSessionMessageCount();

            if (counselor_switched && new_counselor) {
              const newCounselorData: Counselor = {
                id: counselor?.id || 0,
                name: new_counselor.name,
                description: new_counselor.who_you_are,
                specialty: new_counselor.your_vibe,
                visuals: {
                  ...counselor?.visuals,
                  ...new_counselor.visuals,
                } as Counselor['visuals'],
              };
              setCounselor(newCounselorData);
              showToast({
                message: `✨ ${new_counselor.name} has joined the conversation!`,
                type: 'success',
              });
            }

            if (sessionMessageCount > 0 && (sessionMessageCount + 1) % 5 === 0) {
              triggerCardAnalysis();
            }
          } else if (chunk.type === 'error') {
            throw new Error(chunk.error || 'Stream error occurred');
          }
        }

        break;
      } catch (err) {
        retries++;
        if (retries >= maxRetries) {
          showToast({
            message: err instanceof Error ? err.message : 'Failed to send message',
            type: 'error',
          });
          setMessages(prev => prev.filter(msg => msg.id !== assistantMessageId));
        }
      }
    }

    setIsLoading(false);
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
  const backdrop = counselor?.visuals.chatBackdrop;
  const chatTextColor = backdrop?.textColor || counselorTextColor;

  // Build backdrop styles
  const getBackdropStyle = (includePattern: boolean = false): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      backgroundImage: backdrop?.gradient || counselorColor,
      backgroundSize: 'cover',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center',
    };

    if (includePattern && backdrop?.type === 'pattern' && backdrop.pattern) {
      baseStyle.backgroundImage = `${backdrop.gradient}, var(--pattern-${backdrop.pattern})`;
      baseStyle.backgroundBlendMode = 'overlay';
    }

    return baseStyle;
  };

  console.log('ChatScreen rendering counselor visuals:', counselor?.visuals);

  return (
    <div
      className="h-screen flex flex-col fade-in"
      style={getBackdropStyle(true)}
    >
      {/* Header - Taller */}
      <header
        className="flex items-center justify-between px-4 py-5 border-b-2 border-gba-border flex-shrink-0"
        style={{
          backgroundImage: backdrop?.type === 'pattern' && backdrop.pattern
            ? `${backdrop.gradient}, var(--pattern-${backdrop.pattern})`
            : (backdrop?.gradient || counselorColor),
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          backgroundBlendMode: backdrop?.type === 'pattern' ? 'overlay' : undefined,
          color: chatTextColor
        }}
      >
        <button
          onClick={handleBack}
          className="flex items-center gap-2 hover:underline min-h-[44px] min-w-[44px]"
          style={{ color: chatTextColor }}
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
            style={{ color: chatTextColor }}
          >
            {counselor?.name}
          </h1>
        </button>
        <button
          onClick={() => navigate('/farm')}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center"
          style={{ color: chatTextColor }}
          aria-label="Go to Farm"
        >
          <Home className="w-6 h-6" />
        </button>
        <HealthStatusIcon onClick={() => setShowHealthModal(true)} />
      </header>

      {/* Chat Area - Clean themed color only, no pattern */}
      <main
        className="flex-1 flex flex-col p-4 overflow-y-auto"
        style={{
          backgroundImage: backdrop?.gradient || counselorColor,
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center'
        }}
      >
        {messages.length === 0 && (
          <div className="flex-1 flex items-center justify-center text-center">
            <p
              className="font-sans opacity-75"
              style={{ color: chatTextColor }}
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
        style={{
          backgroundImage: backdrop?.type === 'pattern' && backdrop.pattern
            ? `${backdrop.gradient}, var(--pattern-${backdrop.pattern})`
            : (backdrop?.gradient || counselorColor),
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          backgroundBlendMode: backdrop?.type === 'pattern' ? 'overlay' : undefined,
          opacity: 0.95
        }}
      >
        <div className="flex gap-3 items-end">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              adjustTextareaHeight();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
                if (textareaRef.current) {
                  textareaRef.current.style.height = 'auto';
                }
              }
            }}
            placeholder="Type your message..."
            className="input-bubble flex-1 px-4 py-3 font-sans bg-white min-h-[44px] resize-none overflow-hidden"
            style={{ color: '#000000' }}
            disabled={isLoading || !sessionId}
            rows={1}
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
            style={{ color: chatTextColor }}
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
