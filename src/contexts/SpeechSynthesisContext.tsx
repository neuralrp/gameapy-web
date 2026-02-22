import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from 'react';
import { TTS_SERVER_URL } from '../utils/constants';

export interface PendingSpeak {
  text: string;
  personality?: string;
}

export interface SpeechSynthesisContextValue {
  speak: (text: string, personality?: string) => Promise<boolean>;
  stop: () => void;
  isSpeaking: boolean;
  isSupported: boolean;
  speakingText: string | null;
  pendingSpeak: PendingSpeak | null;
  clearPendingSpeak: () => void;
  retrySpeak: () => Promise<void>;
  unlock: () => void;
}

const SpeechSynthesisContext = createContext<SpeechSynthesisContextValue | null>(null);

export function SpeechSynthesisProvider({ children }: { children: ReactNode }) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingText, setSpeakingText] = useState<string | null>(null);
  const [pendingSpeak, setPendingSpeak] = useState<PendingSpeak | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isUnlockedRef = useRef(false);
  const pendingSpeakRef = useRef<PendingSpeak | null>(null);

  const isSupported = typeof window !== 'undefined' && typeof Audio !== 'undefined';

  const speak = useCallback(async (text: string, personality?: string): Promise<boolean> => {
    if (!text || !text.trim()) return false;

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    try {
      const response = await fetch(`${TTS_SERVER_URL}/speak`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          text: text.trim(),
          personality: personality || null,
        }),
      });

      if (!response.ok) {
        throw new Error(`TTS server error: ${response.status}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onplay = () => {
        setIsSpeaking(true);
        setSpeakingText(text);
        setPendingSpeak(null);
        pendingSpeakRef.current = null;
      };

      audio.onended = () => {
        setIsSpeaking(false);
        setSpeakingText(null);
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
      };

      audio.onerror = () => {
        setIsSpeaking(false);
        setSpeakingText(null);
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
      };

      await audio.play();
      return true;
      
    } catch (error) {
      console.error('TTS error:', error);
      setIsSpeaking(false);
      setSpeakingText(null);
      setPendingSpeak({ text, personality });
      pendingSpeakRef.current = { text, personality };
      return false;
    }
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsSpeaking(false);
    setSpeakingText(null);
  }, []);

  const clearPendingSpeak = useCallback(() => {
    setPendingSpeak(null);
    pendingSpeakRef.current = null;
  }, []);

  const retrySpeak = useCallback(async () => {
    const pending = pendingSpeakRef.current;
    if (!pending) return;
    clearPendingSpeak();
    await speak(pending.text, pending.personality);
  }, [speak, clearPendingSpeak]);

  const unlock = useCallback(() => {
    if (!isSupported || isUnlockedRef.current) return;
    
    const audio = new Audio();
    audio.src = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAAYYBAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAAYYBAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=';
    audio.volume = 0;
    audio.play().then(() => {
      isUnlockedRef.current = true;
    }).catch(() => {
    });
  }, [isSupported]);
  
  return (
    <SpeechSynthesisContext.Provider value={{
      speak,
      stop,
      isSpeaking,
      isSupported,
      speakingText,
      pendingSpeak,
      clearPendingSpeak,
      retrySpeak,
      unlock,
    }}>
      {children}
    </SpeechSynthesisContext.Provider>
  );
}

export function useSpeechSynthesisContext(): SpeechSynthesisContextValue {
  const context = useContext(SpeechSynthesisContext);
  if (!context) {
    throw new Error('useSpeechSynthesisContext must be used within SpeechSynthesisProvider');
  }
  return context;
}
