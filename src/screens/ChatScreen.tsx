import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ArrowUp, LayoutGrid, Play, X } from 'lucide-react';
import { CounselorInfoModal } from '../components/counselor/CounselorInfoModal';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import { HealthStatusIcon } from '../components/shared/HealthStatusIcon';
import { HealthStatusModal } from '../components/shared/HealthStatusModal';
import { GameTable } from '../components/table/GameTable';
import { CardHand } from '../components/cards/CardHand';
import { TableProvider, useTable } from '../contexts/TableContext';
import { useApp } from '../contexts/AppContext';
import { apiService } from '../services/api';
import type { Message } from '../types/message';
import type { Counselor } from '../types/counselor';
import type { HandCard, TableSlotPosition } from '../types/card';

export function ChatScreen() {
  return (
    <TableProvider>
      <ChatScreenContent />
    </TableProvider>
  );
}

function ChatScreenContent() {
  const { counselor, setCounselor, clientLoading, sessionId, sessionMessageCount, incrementSessionMessageCount, resetSessionMessageCount, showToast, startHealthChecks, stopHealthChecks, setShowHealthModal, endCurrentSession, loadSessions } = useApp();
  const {
    slots,
    hand,
    conversationMode,
    isTableVisible,
    setIsTableVisible,
    toggleTableVisibility,
    draggedCard,
    setDraggedCard,
    playCard,
    removeCard,
    loadTableState,
    loadAllCards,
    conversationPartner,
  } = useTable();

  const activeCounselor = conversationPartner || counselor;
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCounselorInfo, setShowCounselorInfo] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    startHealthChecks();
    return () => {
      stopHealthChecks();
    };
  }, []);

  useEffect(() => {
    if (sessionId) {
      loadTableState(sessionId);
      loadSessionHistory(sessionId);
    }
  }, [sessionId, loadTableState]);

  const loadSessionHistory = async (sid: number) => {
    setIsLoadingHistory(true);
    try {
      const historyMessages = await apiService.getSessionMessages(sid, 100);
      if (historyMessages && historyMessages.length > 0) {
        const formattedMessages: Message[] = historyMessages.map((msg: any) => ({
          id: msg.id?.toString() || crypto.randomUUID(),
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp,
        }));
        setMessages(formattedMessages);
        resetSessionMessageCount();
      }
    } catch (error) {
      console.error('Failed to load session history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadAllCards();
  }, [loadAllCards]);

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
      if (sessionId && sessionMessageCount >= 5) {
        apiService.analyzeSession(sessionId).catch(err => {
          console.error('Background session analysis failed:', err);
        });
        apiService.analyzeSessionFriendship(sessionId).catch(err => {
          console.error('Background friendship analysis failed:', err);
        });
      }
    };
  }, [sessionId, sessionMessageCount]);

  const handleBack = async () => {
    if (sessionId && sessionMessageCount > 0) {
      await endCurrentSession();
    }
    resetSessionMessageCount();
    setCounselor(null);
    await loadSessions();
  };

  const handleCardDragStart = (card: HandCard) => {
    setDraggedCard(card);
  };

  const handleWildcardDragStart = () => {
    setDraggedCard({
      id: 0,
      client_id: 0,
      card_type: 'wildcard',
      card_id: 0,
      position: 0,
      added_at: new Date().toISOString(),
      card_data: { name: 'WILDCARD' }
    });
  };

  const handleCardSelect = (card: HandCard) => {
    console.log('Card selected:', card);
  };

  const handleGenerateImage = async (card: HandCard) => {
    try {
      let result;
      if (card.card_type === 'personality') {
        result = await apiService.generatePersonalityImage(card.card_id);
      } else {
        result = await apiService.generateCardImage(
          card.card_type as any,
          card.card_id
        );
      }

      if (result.success) {
        showToast({ message: 'Image generation queued', type: 'success' });
        // Reload hand to get updated image
        await loadAllCards();
      } else {
        showToast({ message: `Failed to generate image: ${result.message}`, type: 'error' });
      }
    } catch (error) {
      showToast({ message: 'Error generating image', type: 'error' });
      console.error('Image generation error:', error);
    }
  };

  const handleCardDrop = async (position: TableSlotPosition) => {
    if (draggedCard?.card_type === 'wildcard') {
      await handleWildcardTrigger();
      return;
    }
    
    try {
      await playCard(position);
    } catch (error) {
      showToast({ message: 'Failed to play card', type: 'error' });
    }
  };

  const handleWildcardTrigger = async () => {
    if (!sessionId || isLoading) return;
    
    setDraggedCard(null);
    setIsTableVisible(false);
    setIsLoading(true);

    const assistantMessageId = crypto.randomUUID();
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, assistantMessage]);

    try {
      const stream = apiService.sendMessageStream({
        session_id: sessionId,
        message_data: {
          role: 'user',
          content: '[WILDCARD]',
        },
        trigger_wildcard: true,
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
          const { wildcard } = chunk.data;

          if (wildcard) {
            showToast({ message: `🎴 Wildcard: ${wildcard.topic_text}`, type: 'info' });
          }

          incrementSessionMessageCount();
        } else if (chunk.type === 'error') {
          throw new Error(chunk.error || 'Stream error occurred');
        }
      }
    } catch (err) {
      showToast({ message: err instanceof Error ? err.message : 'Failed to trigger wildcard', type: 'error' });
      setMessages(prev => prev.filter(msg => msg.id !== assistantMessageId));
    }

    setIsLoading(false);
  };

  const handleCardRemove = async (position: TableSlotPosition) => {
    try {
      await removeCard(position);
    } catch (error) {
      showToast({ message: 'Failed to remove card', type: 'error' });
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

          } else if (chunk.type === 'error') {
            throw new Error(chunk.error || 'Stream error occurred');
          }
        }

        break;
        } catch (err) {
          retries++;
          if (retries >= maxRetries) {
            showToast({ message: err instanceof Error ? err.message : 'Failed to send message', type: 'error' });
            setMessages(prev => prev.filter(msg => msg.id !== assistantMessageId));
          }
        }
      }

    setIsLoading(false);
  };

  const handleKeepGoing = async () => {
    if (isLoading || !sessionId) return;

    setIsLoading(true);

    const assistantMessageId = crypto.randomUUID();
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, assistantMessage]);

    try {
      const stream = apiService.sendMessageStream({
        session_id: sessionId,
        message_data: {
          role: 'user',
          content: '[CONTINUE]',
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
        } else if (chunk.type === 'error') {
          throw new Error(chunk.error || 'Stream error occurred');
        }
      }
      } catch (err) {
        showToast({ message: err instanceof Error ? err.message : 'Failed to continue', type: 'error' });
        setMessages(prev => prev.filter(msg => msg.id !== assistantMessageId));
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

  const counselorColor = counselor?.visuals.selectionCard.backgroundColor || '#F5F1E8';
  const counselorTextColor = counselor?.visuals.textColor || '#3D3426';
  const backdrop = conversationPartner?.visuals.chatBackdrop || counselor?.visuals.chatBackdrop;
  const chatTextColor = backdrop?.textColor || counselorTextColor;
  const activeVisuals = conversationPartner?.visuals || counselor?.visuals;

  // Build backdrop styles
  const getBackdropStyle = (includePattern: boolean = false): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      backgroundSize: 'cover',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center',
    };

    if (backdrop?.backgroundImage) {
      baseStyle.backgroundImage = `url('${backdrop.backgroundImage}')`;
      return baseStyle;
    }

    baseStyle.backgroundImage = backdrop?.gradient || counselorColor;

    if (includePattern && backdrop?.type === 'pattern' && backdrop.pattern) {
      baseStyle.backgroundImage = `${backdrop.gradient}, var(--pattern-${backdrop.pattern})`;
      baseStyle.backgroundBlendMode = 'overlay';
    }

    return baseStyle;
  };

  console.log('ChatScreen rendering counselor visuals:', counselor?.visuals);

  return (
    <div
      className="h-screen flex flex-col fade-in relative"
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
            {activeCounselor?.name}
          </h1>
        </button>
        <button
          onClick={toggleTableVisibility}
          className={`min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors ${isTableVisible ? 'text-blue-400' : ''}`}
          style={{ color: isTableVisible ? undefined : chatTextColor }}
          aria-label={isTableVisible ? 'Hide table' : 'Show table'}
        >
          <LayoutGrid className="w-6 h-6" />
        </button>
        <HealthStatusIcon onClick={() => setShowHealthModal(true)} />
      </header>

      {/* Conversation Mode Indicator */}
      {conversationMode !== 'advisory' && (
        <div 
          className={`px-4 py-2 text-center text-sm font-medium ${
            conversationMode === 'roleplay' 
              ? 'bg-purple-500/20 text-purple-300 border-b border-purple-500/30' 
              : 'bg-green-500/20 text-green-300 border-b border-green-500/30'
          }`}
        >
          {conversationMode === 'roleplay' && (
            <span>🎭 Roleplay Mode — Speaking as character on the table</span>
          )}
          {conversationMode === 'three_way' && (
            <span>📖 Three-Way Mode — Watching a conversation unfold</span>
          )}
        </div>
      )}

      {/* Table Overlay */}
      {isTableVisible && (
        <div className="absolute inset-0 z-30 bg-gray-900/95 backdrop-blur-sm flex flex-col pt-16">
          <button
            onClick={() => setIsTableVisible(false)}
            className="absolute top-4 right-4 z-50 p-2 rounded-full bg-gray-800 hover:bg-gray-700 text-white"
            aria-label="Close table"
          >
            <X className="w-6 h-6" />
          </button>
          <GameTable
            slots={slots}
            onCardDrop={handleCardDrop}
            onCardRemove={handleCardRemove}
            conversationMode={conversationMode}
            personalityName={activeCounselor?.name || 'Assistant'}
          />
          <CardHand
            cards={hand}
            onCardSelect={handleCardSelect}
            onCardDragStart={handleCardDragStart}
            onWildcardDragStart={handleWildcardDragStart}
            onGenerateImage={handleGenerateImage}
          />
        </div>
      )}

      {/* Chat Area - Clean themed color only, no pattern */}
      <main
        className="flex-1 flex flex-col p-4 overflow-y-auto"
        style={{
          backgroundImage: backdrop?.backgroundImage
            ? `url('${backdrop.backgroundImage}')`
            : (backdrop?.gradient || counselorColor),
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center'
        }}
      >
        {messages.length === 0 && !isLoadingHistory && (
          <div className="flex-1 flex items-center justify-center text-center">
            <p
              className="font-sans opacity-75"
              style={{ color: chatTextColor }}
            >
              Start a conversation with {activeCounselor?.name}
            </p>
          </div>
        )}

        {isLoadingHistory && messages.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <p
              className="font-sans opacity-75"
              style={{ color: chatTextColor }}
            >
              Loading conversation...
            </p>
          </div>
        )}

        <div className="space-y-3 flex-1 overflow-y-auto">
          {messages.map((message, index) => {
            const isLastMessage = index === messages.length - 1;
            const showKeepGoing = isLastMessage &&
                                   message.role === 'assistant' &&
                                   message.content &&
                                    conversationMode === 'three_way' &&
                                   !isLoading;
            
            return (
              <div key={message.id}>
                <div
                  className={`flex ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`message-bubble ${
                      message.role === 'user' ? 'user' : 'assistant'
                    }`}
                    style={
                      message.role === 'assistant' && activeVisuals
                        ? {
                            backgroundColor: activeVisuals.chatBubble.backgroundColor,
                            color: activeVisuals.chatBubble.textColor,
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
                {showKeepGoing && (
                  <div className="flex justify-start mt-2 ml-1">
                    <button
                      onClick={handleKeepGoing}
                      disabled={isLoading}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600/80 hover:bg-green-600 text-white rounded-full text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      <Play className="w-4 h-4" />
                      Keep going
                    </button>
                  </div>
                )}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <footer
        className="p-4 border-t-2 border-gba-border flex-shrink-0"
        style={{
          backgroundImage: backdrop?.backgroundImage
            ? `url('${backdrop.backgroundImage}')`
            : (backdrop?.type === 'pattern' && backdrop.pattern
              ? `${backdrop.gradient}, var(--pattern-${backdrop.pattern})`
              : (backdrop?.gradient || counselorColor)),
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          backgroundBlendMode: backdrop?.type === 'pattern' && !backdrop?.backgroundImage ? 'overlay' : undefined,
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
              backgroundColor: `${activeVisuals?.borderColor || '#5C6B4A'} !important`
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
