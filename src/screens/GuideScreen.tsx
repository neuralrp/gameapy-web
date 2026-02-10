import { useState, useEffect, useRef } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useApp } from '../contexts/AppContext';
import { apiService } from '../services/api';

interface GuideMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  suggestedCard?: {
    card_type: 'self' | 'character' | 'world';
    topic: string;
    confidence: number;
  };
}

export function GuideScreen() {
  const { endGuide, guideSessionId } = useApp();
  const [messages, setMessages] = useState<GuideMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasInitialized = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (guideSessionId && !hasInitialized.current) {
      hasInitialized.current = true;
      loadInitialMessage();
    }
  }, [guideSessionId]);

  const loadInitialMessage = async () => {
    if (!guideSessionId) return;

    try {
      setIsLoading(true);
      const response = await apiService.sendGuideInput(guideSessionId, '');

      if (response.success && response.data) {
        const initialMessage: GuideMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: response.data.guide_message,
          timestamp: new Date().toISOString(),
        };
        setMessages([initialMessage]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load conversation');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    endGuide();
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading || !guideSessionId) return;

    const userMessage: GuideMessage = {
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
      const response = await apiService.sendGuideInput(guideSessionId, userMessage.content);

      if (response.success && response.data) {
        const aiMessage: GuideMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: response.data.guide_message,
          timestamp: new Date().toISOString(),
          suggestedCard: response.data.suggested_card,
        };

        setMessages(prev => [...prev, aiMessage]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmCard = async (card: GuideMessage['suggestedCard']) => {
    if (!card || !guideSessionId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiService.confirmGuideCard(guideSessionId, card.card_type, card.topic);

      if (response.success && response.data) {
        const confirmMessage: GuideMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: response.data.guide_message,
          timestamp: new Date().toISOString(),
        };

        setMessages(prev => [...prev, confirmMessage]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create card');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeclineCard = () => {
    setError(null);
  };

  return (
    <div className="min-h-screen flex flex-col fade-in">
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
          Create Cards
        </h1>
        <div className="w-16" />
      </header>

      <main className="flex-1 flex flex-col p-4 overflow-y-auto">
        {messages.length === 0 && !isLoading && (
          <div className="flex-1 flex items-center justify-center text-center">
            <p className="font-sans text-gba-text opacity-75">
              Tell me about yourself, someone in your life, or an important event
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
              <div className="max-w-[85%] sm:max-w-[80%]">
                <div
                  className={`p-3 border-2 rounded-lg break-words ${
                    message.role === 'user'
                      ? 'bg-gba-highlight text-gba-border'
                      : 'bg-gba-ui border-gba-border text-gba-text'
                  }`}
                >
                  <p className="font-sans text-base sm:text-sm whitespace-pre-wrap">
                    {message.content}
                  </p>
                </div>

                {message.suggestedCard && (
                  <div className="mt-3 p-3 bg-gba-highlight border-2 border-gba-border rounded-lg">
                    <p className="font-sans text-sm text-gba-text mb-3">
                      <strong>Suggested Card:</strong> {message.suggestedCard.topic}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleConfirmCard(message.suggestedCard)}
                        size="sm"
                        disabled={isLoading}
                      >
                        Create Card
                      </Button>
                      <Button
                        onClick={handleDeclineCard}
                        variant="secondary"
                        size="sm"
                        disabled={isLoading}
                      >
                        Not Now
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </main>

      <footer className="p-4 border-t-2 border-gba-border bg-gba-ui flex-shrink-0">
        {error && (
          <div className="mb-2 p-3 bg-red-100 border-2 border-red-500 text-red-700 rounded font-sans text-sm">
            <p>{error}</p>
          </div>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Tell me about yourself, someone, or an event..."
            className="flex-1 px-4 py-2 border-2 border-gba-border rounded-lg font-sans text-gba-text bg-white min-h-[44px]"
            disabled={isLoading || !guideSessionId}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading || !guideSessionId}
            size="md"
          >
            {isLoading ? '...' : 'Send'}
          </Button>
        </div>
        {!guideSessionId && (
          <p className="mt-2 text-xs font-sans text-gba-text opacity-50">
            Connecting to guide...
          </p>
        )}
      </footer>
    </div>
  );
}
