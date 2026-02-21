import { Mic, MicOff, Square } from 'lucide-react';

interface VoiceInputButtonProps {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  error: string | null;
  onStartListening: () => void;
  onStopListening: () => void;
  onTranscriptReady: (transcript: string) => void;
  onResetTranscript: () => void;
  onUnlockSpeech?: () => void;
  disabled?: boolean;
  accentColor?: string;
}

export function VoiceInputButton({ 
  isListening,
  isSupported,
  transcript,
  error,
  onStartListening,
  onStopListening,
  onTranscriptReady,
  onResetTranscript,
  onUnlockSpeech,
  disabled = false,
  accentColor = '#5C6B4A'
}: VoiceInputButtonProps) {
  const handleClick = async () => {
    if (disabled) return;

    if (isListening) {
      onStopListening();
      if (transcript.trim()) {
        onTranscriptReady(transcript.trim());
        onResetTranscript();
      }
    } else {
      onResetTranscript();
      onUnlockSpeech?.();
      await onStartListening();
    }
  };

  const getIcon = () => {
    if (!isSupported) return <MicOff className="w-5 h-5" />;
    if (isListening) return <Square className="w-5 h-5" />;
    return <Mic className="w-5 h-5" />;
  };

  const getStateClass = () => {
    if (!isSupported) return 'opacity-50 cursor-not-allowed';
    if (isListening) return 'animate-pulse bg-red-500 hover:bg-red-600';
    return 'hover:opacity-80';
  };

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        disabled={disabled || !isSupported}
        className={`min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center transition-all duration-200 ${getStateClass()}`}
        style={{
          backgroundColor: isListening ? undefined : accentColor,
        }}
        title={!isSupported 
          ? 'Voice input not supported in this browser' 
          : isListening 
            ? 'Tap to stop and send' 
            : 'Tap to speak'
        }
        aria-label={isListening ? 'Stop listening' : 'Start voice input'}
      >
        {getIcon()}
      </button>
      
      {error && (
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-red-500/90 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap z-10">
          {error}
        </div>
      )}
    </div>
  );
}
