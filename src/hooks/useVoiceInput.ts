import { useState, useRef, useCallback, useEffect } from 'react';

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

export interface UseVoiceInputReturn {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  hasPermission: boolean | null;
  startListening: () => Promise<void>;
  stopListening: () => void;
  stopListeningAndGetResult: (callback: (finalTranscript: string) => void) => void;
  resetTranscript: () => void;
}

export function useVoiceInput(): UseVoiceInputReturn {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const pendingResultCallbackRef = useRef<((transcript: string) => void) | null>(null);
  const transcriptRef = useRef('');
  const interimTranscriptRef = useRef('');

  const isSupported = typeof window !== 'undefined' && 
    (typeof window.SpeechRecognition !== 'undefined' || 
     typeof window.webkitSpeechRecognition !== 'undefined');

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setHasPermission(true);
      return true;
    } catch (err) {
      setHasPermission(false);
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          setError('Microphone permission denied. Please allow microphone access in your browser settings.');
        } else if (err.name === 'NotFoundError') {
          setError('No microphone found. Please connect a microphone and try again.');
        } else {
          setError(`Microphone error: ${err.message}`);
        }
      }
      return false;
    }
  }, []);

  const startListening = useCallback(async () => {
    if (!isSupported) {
      setError('Speech recognition is not supported in this browser.');
      return;
    }

    if (hasPermission === false) {
      return;
    }

    if (hasPermission === null) {
      const granted = await requestPermission();
      if (!granted) return;
    }

    setError(null);
    setTranscript('');
    setInterimTranscript('');
    transcriptRef.current = '';
    interimTranscriptRef.current = '';
    pendingResultCallbackRef.current = null;

    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionClass();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interim = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptPart = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcriptPart;
        } else {
          interim += transcriptPart;
        }
      }

      if (finalTranscript) {
        setTranscript(prev => {
          const updated = prev + finalTranscript;
          transcriptRef.current = updated;
          return updated;
        });
      }
      interimTranscriptRef.current = interim;
      setInterimTranscript(interim);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'no-speech') {
        return;
      }
      if (event.error === 'aborted') {
        return;
      }
      setError(`Speech recognition error: ${event.error}`);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript('');
      
      const finalResult = (transcriptRef.current + ' ' + interimTranscriptRef.current).trim();
      if (pendingResultCallbackRef.current) {
        pendingResultCallbackRef.current(finalResult);
        pendingResultCallbackRef.current = null;
      }
      interimTranscriptRef.current = '';
    };

    recognitionRef.current = recognition;
    
    try {
      recognition.start();
    } catch (err) {
      if (err instanceof Error) {
        setError(`Failed to start speech recognition: ${err.message}`);
      }
      setIsListening(false);
    }
  }, [isSupported, hasPermission, requestPermission]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
    setInterimTranscript('');
    interimTranscriptRef.current = '';
    pendingResultCallbackRef.current = null;
  }, []);

  const stopListeningAndGetResult = useCallback((callback: (finalTranscript: string) => void) => {
    pendingResultCallbackRef.current = callback;
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    transcriptRef.current = '';
    interimTranscriptRef.current = '';
    setError(null);
  }, []);

  return {
    isListening,
    isSupported,
    transcript,
    interimTranscript,
    error,
    hasPermission,
    startListening,
    stopListening,
    stopListeningAndGetResult,
    resetTranscript,
  };
}
