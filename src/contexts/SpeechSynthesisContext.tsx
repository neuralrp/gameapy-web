import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react';

type SpeechRecognitionEvent = Event & {
  results: SpeechRecognitionResultList;
  resultIndex: number;
};

type SpeechRecognitionErrorEvent = Event & {
  error: string;
  message: string;
};

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

export interface SpeechSynthesisContextValue {
  speak: (text: string) => void;
  stop: () => void;
  isSpeaking: boolean;
  isSupported: boolean;
  speakingText: string | null;
  unlock: () => void;
}

const SpeechSynthesisContext = createContext<SpeechSynthesisContextValue | null>(null);

export function SpeechSynthesisProvider({ children }: { children: ReactNode }) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingText, setSpeakingText] = useState<string | null>(null);
  const [, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isUnlockedRef = useRef(false);

  const isSupported = typeof window !== 'undefined' && 
    typeof window.speechSynthesis !== 'undefined';

  useEffect(() => {
    if (!isSupported) return;

    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
      
      if (!selectedVoice && availableVoices.length > 0) {
        const englishVoice = availableVoices.find(
          v => v.lang.startsWith('en-') && !v.name.includes('Google')
        ) || availableVoices.find(
          v => v.lang.startsWith('en-')
        ) || availableVoices[0];
        
        setSelectedVoice(englishVoice);
      }
    };

    loadVoices();
    
    const handleVoicesChanged = () => loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);

    return () => {
      window.speechSynthesis.cancel();
      window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
    };
  }, [isSupported]);

  const speak = useCallback((text: string) => {
    if (!isSupported || !text) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onstart = () => {
      setIsSpeaking(true);
      setSpeakingText(text);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setSpeakingText(null);
    };

    utterance.onerror = (event) => {
      if (event.error !== 'canceled') {
        console.error('Speech synthesis error:', event.error);
      }
      setIsSpeaking(false);
      setSpeakingText(null);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [isSupported, selectedVoice]);

  const stop = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setSpeakingText(null);
  }, [isSupported]);

  const unlock = useCallback(() => {
    if (!isSupported || isUnlockedRef.current) return;
    
    const utterance = new SpeechSynthesisUtterance('');
    utterance.volume = 0;
    utterance.onend = () => {
      isUnlockedRef.current = true;
    };
    utterance.onerror = () => {
      isUnlockedRef.current = true;
    };
    window.speechSynthesis.speak(utterance);
  }, [isSupported]);
  
  return (
    <SpeechSynthesisContext.Provider value={{
      speak,
      stop,
      isSpeaking,
      isSupported,
      speakingText,
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
