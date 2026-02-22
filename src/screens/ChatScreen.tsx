import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ArrowUp, LayoutGrid, Play, X, Headphones, HeadphoneOff, Volume2, Square } from 'lucide-react';
import { CounselorInfoModal } from '../components/counselor/CounselorInfoModal';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import { HealthStatusIcon } from '../components/shared/HealthStatusIcon';
import { HealthStatusModal } from '../components/shared/HealthStatusModal';
import { GameTable } from '../components/table/GameTable';
import { CardHand } from '../components/cards/CardHand';
import { GroupParticipants } from '../components/groups';
import { VoiceInputButton } from '../components/chat/VoiceInputButton';
import { VoiceTranscript } from '../components/chat/VoiceTranscript';
import { SpeakButton } from '../components/chat/SpeakButton';
import { HoldToTalkButton } from '../components/chat/HoldToTalkButton';
import type { VoiceButtonState } from '../components/chat/HoldToTalkButton';
import { useWhisperInput } from '../hooks/useWhisperInput';
import { useGroupWebSocket } from '../hooks/useGroupWebSocket';
import { useSpeechSynthesisContext } from '../contexts/SpeechSynthesisContext';
import { useHaptics } from '../hooks/useHaptics';
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
  const { counselor, setCounselor, clientLoading, sessionId, sessionMessageCount, incrementSessionMessageCount, resetSessionMessageCount, showToast, startHealthChecks, stopHealthChecks, setShowHealthModal, loadSessions, groupSessionState, leaveGroupSession, clientId } = useApp();
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
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [talkMode, setTalkMode] = useState(false);
  const [voiceButtonState, setVoiceButtonState] = useState<VoiceButtonState>('idle');
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [typingUserId, setTypingUserId] = useState<number | null>(null);
  const [typingUserName, setTypingUserName] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastAssistantMessageRef = useRef<string>('');
  
  const isGroupMode = !!groupSessionState.groupSession;
  const groupId = groupSessionState.groupSession?.id ?? null;
  
  const handleWebSocketMessage = (message: any) => {
    if (message.type === 'new_message' && message.sender_id !== clientId) {
      const newMessage: Message = {
        id: message.id?.toString() || crypto.randomUUID(),
        role: message.role,
        content: message.content,
        timestamp: message.created_at || new Date().toISOString(),
        senderId: message.sender_id,
        senderName: message.sender_name,
      };
      setMessages(prev => [...prev, newMessage]);
    } else if (message.type === 'typing') {
      if (message.is_typing) {
        setTypingUserId(message.user_id);
        setTypingUserName(message.user_name || null);
      } else {
        setTypingUserId(null);
        setTypingUserName(null);
      }
    } else if (message.type === 'card_played' && message.played_by !== clientId) {
      loadTableState(sessionId!);
      const playerName = message.played_by_name || groupSessionState.guest?.name || groupSessionState.host?.name;
      showToast({ message: `${playerName} played a card`, type: 'info' });
    } else if (message.type === 'card_removed' && message.removed_by !== clientId) {
      loadTableState(sessionId!);
    } else if (message.type === 'table_cleared' && message.cleared_by !== clientId) {
      loadTableState(sessionId!);
    } else if (message.type === 'user_joined' && message.user_id !== clientId) {
      showToast({ message: 'Friend joined the group!', type: 'success' });
    } else if (message.type === 'user_left' && message.user_id !== clientId) {
      showToast({ message: 'Friend left the group', type: 'info' });
    } else if (message.type === 'ai_response') {
      const aiMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: message.content,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, aiMessage]);
    }
  };
  
  const {
    isConnected: wsConnected,
    sendTyping,
  } = useGroupWebSocket({
    groupId,
    onMessage: handleWebSocketMessage,
    onAuthRequired: () => {
      showToast({ message: 'Session expired. Please log in again.', type: 'error' });
    },
    onMaxReconnectAttemptsReached: () => {
      showToast({ 
        message: 'Connection lost. Please refresh the page to reconnect.', 
        type: 'error' 
      });
    },
  });
  
  const { isListening, isTranscribing, hasPermission, requestPermission, transcript, startListening, stopListening, stopListeningAndGetResult, resetTranscript } = useWhisperInput();
  const { speak, stop: stopSpeaking, isSpeaking, isSupported: ttsSupported, unlock: unlockSpeech, pendingSpeak, clearPendingSpeak, retrySpeak } = useSpeechSynthesisContext();
  const haptics = useHaptics();

  const talkModeRef = useRef(talkMode);
  const ttsSupportedRef = useRef(ttsSupported);

  useEffect(() => { talkModeRef.current = talkMode; }, [talkMode]);
  useEffect(() => { ttsSupportedRef.current = ttsSupported; }, [ttsSupported]);

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
  }, [sessionId, groupId, loadTableState]);

  const loadSessionHistory = async (sid: number) => {
    setIsLoadingHistory(true);
    try {
      if (isGroupMode && groupId) {
        const response = await apiService.getGroupMessages(groupId, 100);
        if (response.success && response.data && response.data.length > 0) {
          const formattedMessages: Message[] = response.data.map((msg: any) => ({
            id: msg.id?.toString() || crypto.randomUUID(),
            role: msg.role,
            content: msg.content,
            timestamp: msg.created_at || new Date().toISOString(),
            senderId: msg.sender_id,
            senderName: msg.sender_name,
          }));
          setMessages(formattedMessages);
          resetSessionMessageCount();
        }
      } else {
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

  useEffect(() => {
    if (transcript) {
      setVoiceTranscript(transcript);
      setInput(transcript);
    }
  }, [transcript]);

  useEffect(() => {
    if (isTranscribing) {
      setVoiceButtonState('sending');
    }
  }, [isTranscribing]);

  useEffect(() => {
    if (isListening) {
      setVoiceButtonState('listening');
    }
  }, [isListening]);

  useEffect(() => {
    if (!isSpeaking && voiceButtonState === 'speaking') {
      setVoiceButtonState('idle');
      haptics.light();
    }
  }, [isSpeaking, voiceButtonState, haptics]);

  useEffect(() => {
    if (!talkMode) {
      stopSpeaking();
    }
  }, [talkMode, stopSpeaking]);

  useEffect(() => {
    if (talkMode && hasPermission === null) {
      setIsRequestingPermission(true);
      requestPermission().then((granted) => {
        setIsRequestingPermission(false);
        if (!granted) {
          showToast({ message: 'Microphone permission denied. Please enable it in browser settings.', type: 'error' });
          setTalkMode(false);
        }
      });
    }
  }, [talkMode, hasPermission, requestPermission]);

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
    if (isGroupMode) {
      await leaveGroupSession();
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

  const handleSend = async (messageOverride?: string, autoSpeak: boolean = false) => {
    const messageText = (messageOverride ?? input).trim();
    if (!messageText || isLoading || !sessionId) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: messageText,
      timestamp: new Date().toISOString(),
      senderId: clientId ?? undefined,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setVoiceTranscript('');
    resetTranscript();
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
    let fullContent = '';

    while (retries < maxRetries) {
      try {
        let stream: AsyncGenerator<any>;
        
        if (isGroupMode && groupSessionState.groupSession) {
          const senderName = groupSessionState.isHost 
            ? (groupSessionState.host?.name || 'Host')
            : (groupSessionState.guest?.name || 'Guest');
          
          stream = apiService.sendGroupChatStream({
            group_session_id: groupSessionState.groupSession.id,
            content: userMessage.content,
            sender_name: senderName,
          });
        } else {
          stream = apiService.sendMessageStream({
            session_id: sessionId!,
            message_data: {
              role: 'user',
              content: userMessage.content,
            },
          });
        }

        fullContent = '';

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

            const mentionsDetected = chunk.data.mentions_detected;
            if (mentionsDetected && mentionsDetected.length > 0) {
              const names = mentionsDetected.map((m: { card_name: string }) => m.card_name).join(', ');
              const cardWord = mentionsDetected.length === 1 ? 'card' : 'cards';
              showToast({
                message: `${mentionsDetected.length} ${cardWord} added: ${names}`,
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
    if (fullContent) {
      haptics.success();
    }
    
    if (autoSpeak && fullContent && ttsSupportedRef.current) {
      lastAssistantMessageRef.current = fullContent;
      setVoiceButtonState('speaking');
      haptics.light();
      const success = await speak(fullContent, activeCounselor?.name);
      if (!success) {
        setVoiceButtonState('idle');
      }
    } else {
      setVoiceButtonState('idle');
    }
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

    let fullContent = '';

    try {
      const stream = apiService.sendMessageStream({
        session_id: sessionId,
        message_data: {
          role: 'user',
          content: '[CONTINUE]',
        },
      });

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
    if (fullContent) {
      haptics.success();
    }
    
    if (talkModeRef.current && fullContent && ttsSupportedRef.current) {
      lastAssistantMessageRef.current = fullContent;
      setVoiceButtonState('speaking');
      setTimeout(async () => {
        const success = await speak(fullContent, activeCounselor?.name);
        if (!success) {
          setVoiceButtonState('idle');
        }
      }, 50);
    } else {
      setVoiceButtonState('idle');
    }
  };

  const handleVoiceTranscriptReady = (text: string) => {
    setVoiceTranscript('');
    unlockSpeech();
    handleSend(text, true);
  };

  const handleVoiceCancel = () => {
    setVoiceTranscript('');
    setInput('');
    resetTranscript();
  };

  const handleHoldStart = async () => {
    haptics.medium();
    unlockSpeech();
    setVoiceTranscript('');
    setInput('');
    resetTranscript();
    await startListening();
  };

  const handleHoldEnd = () => {
    haptics.light();
    stopListeningAndGetResult((finalTranscript: string) => {
      const text = finalTranscript.trim();
      if (text) {
        setVoiceButtonState('sending');
        resetTranscript();
        handleSend(text, talkModeRef.current);
      } else {
        setVoiceButtonState('idle');
      }
    });
  };

  const toggleTalkMode = () => {
    if (talkMode) {
      stopSpeaking();
    }
    setTalkMode(!talkMode);
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
          {groupSessionState.groupSession && (
            <div className="mt-1 flex justify-center">
              <GroupParticipants />
            </div>
          )}
        </button>
        <button
          onClick={toggleTableVisibility}
          className={`min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors ${isTableVisible ? 'text-blue-400' : ''}`}
          style={{ color: isTableVisible ? undefined : chatTextColor }}
          aria-label={isTableVisible ? 'Hide table' : 'Show table'}
        >
          <LayoutGrid className="w-6 h-6" />
        </button>
        {ttsSupported && (
          <button
            onClick={toggleTalkMode}
            className={`min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors ${talkMode ? 'text-green-400' : ''}`}
            style={{ color: talkMode ? undefined : chatTextColor }}
            aria-label={talkMode ? 'Turn off Talk Mode' : 'Turn on Talk Mode'}
            title={talkMode ? 'Turn off Talk Mode' : 'Turn on Talk Mode'}
          >
            {talkMode ? <Headphones className="w-6 h-6" /> : <HeadphoneOff className="w-6 h-6" />}
          </button>
        )}
        <HealthStatusIcon onClick={() => setShowHealthModal(true)} />
      </header>

      {/* Talk Mode Playback Button */}
      {talkMode && (
        <div className="flex justify-center py-3 px-4 bg-black/20">
          <button
            onClick={async () => {
              if (isSpeaking) {
                stopSpeaking();
              } else if (pendingSpeak) {
                await retrySpeak();
                setVoiceButtonState('speaking');
              } else if (lastAssistantMessageRef.current) {
                setVoiceButtonState('speaking');
                const success = await speak(lastAssistantMessageRef.current, activeCounselor?.name);
                if (!success) {
                  setVoiceButtonState('idle');
                }
              }
            }}
            disabled={!isSpeaking && !pendingSpeak && !lastAssistantMessageRef.current}
            className={`
              flex items-center justify-center gap-2 px-6 py-3 rounded-full font-medium text-white
              transition-all duration-200 min-h-[52px]
              ${isSpeaking 
                ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/50' 
                : 'bg-blue-500 hover:bg-blue-600 shadow-lg shadow-blue-500/50 active:scale-95'
              }
              ${!isSpeaking && !pendingSpeak && !lastAssistantMessageRef.current ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            aria-label={isSpeaking ? 'Stop speaking' : 'Play last response'}
          >
            {isSpeaking ? (
              <>
                <Square className="w-5 h-5" />
                <span>STOP</span>
              </>
            ) : (
              <>
                <Volume2 className="w-5 h-5" />
                <span>{pendingSpeak ? 'TAP TO HEAR' : 'PLAY RESPONSE'}</span>
              </>
            )}
          </button>
        </div>
      )}

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
                {isGroupMode && message.role === 'user' && message.senderId && (
                  <div className={`text-xs mb-1 ${message.senderId === clientId ? 'text-right' : 'text-left'} opacity-60`} style={{ color: chatTextColor }}>
                    {message.senderId === clientId 
                      ? 'You' 
                      : (message.senderName || 
                        (groupSessionState.host?.id === message.senderId 
                          ? groupSessionState.host.name 
                        : groupSessionState.guest?.name || 'Unknown'))}
                  </div>
                )}
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
                    {message.role === 'assistant' && message.content && (
                      <div className="flex justify-end mt-1">
                        <SpeakButton 
                          text={message.content}
                          personality={activeCounselor?.name}
                          accentColor={activeVisuals?.chatBubble.textColor || '#3D3426'}
                        />
                      </div>
                    )}
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
          
          {typingUserId && isGroupMode && (
            <div className="flex justify-start">
              <div 
                className="message-bubble assistant px-4 py-2 text-sm italic opacity-70"
                style={{
                  backgroundColor: activeVisuals?.chatBubble.backgroundColor,
                  color: activeVisuals?.chatBubble.textColor,
                }}
              >
                {typingUserName || (
                  groupSessionState.host?.id === typingUserId 
                    ? groupSessionState.host.name 
                    : groupSessionState.guest?.name || 'Someone'
                )} is typing...
              </div>
            </div>
          )}
          
          {isGroupMode && !wsConnected && (
            <div className="text-center text-xs opacity-50 py-2" style={{ color: chatTextColor }}>
              Reconnecting...
            </div>
          )}
          
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
        {talkMode ? (
          <div className="flex flex-col items-center justify-center py-4">
            <HoldToTalkButton
              state={isRequestingPermission ? 'sending' : voiceButtonState}
              transcript={voiceTranscript}
              onHoldStart={handleHoldStart}
              onHoldEnd={handleHoldEnd}
              disabled={!sessionId || isRequestingPermission}
            />
            {isRequestingPermission && (
              <p className="text-white/60 text-sm mt-2">Requesting microphone access...</p>
            )}
          </div>
        ) : (
          <>
            {voiceTranscript && (
              <VoiceTranscript
                transcript={voiceTranscript}
                interimTranscript=""
                onCancel={handleVoiceCancel}
                textColor={chatTextColor}
              />
            )}
            <div className="flex gap-3 items-end">
              <VoiceInputButton
                isListening={isListening || isTranscribing}
                isSupported={typeof navigator !== 'undefined' && navigator.mediaDevices !== undefined}
                transcript={transcript}
                error={null}
                onStartListening={startListening}
                onStopListening={stopListening}
                onTranscriptReady={handleVoiceTranscriptReady}
                onResetTranscript={resetTranscript}
                onUnlockSpeech={unlockSpeech}
                accentColor={activeVisuals?.borderColor || '#5C6B4A'}
                disabled={isLoading || !sessionId}
              />
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  adjustTextareaHeight();
                  if (isGroupMode) {
                    sendTyping(true);
                  }
                }}
                onBlur={() => {
                  if (isGroupMode) {
                    sendTyping(false);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (isGroupMode) {
                      sendTyping(false);
                    }
                    handleSend();
                    if (textareaRef.current) {
                      textareaRef.current.style.height = 'auto';
                    }
                  }
                }}
                placeholder={isTranscribing ? "Transcribing..." : isListening ? "Listening..." : "Type your message..."}
                className="input-bubble flex-1 px-4 py-3 font-sans bg-white min-h-[44px] resize-none overflow-hidden"
                style={{ color: '#000000' }}
                disabled={isLoading || !sessionId}
                rows={1}
              />
              <button
                onClick={() => handleSend()}
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
          </>
        )}
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
