import { Volume2, Square } from 'lucide-react';
import { useSpeechSynthesis } from '../../hooks/useSpeechSynthesis';

interface SpeakButtonProps {
  text: string;
  disabled?: boolean;
  accentColor?: string;
}

export function SpeakButton({ 
  text, 
  disabled = false,
  accentColor = '#5C6B4A'
}: SpeakButtonProps) {
  const { speak, stop, isSpeaking, isSupported } = useSpeechSynthesis();

  const handleClick = () => {
    if (disabled || !isSupported || !text) return;
    
    if (isSpeaking) {
      stop();
    } else {
      speak(text);
    }
  };

  if (!isSupported) return null;

  return (
    <button
      onClick={handleClick}
      disabled={disabled || !text}
      className="p-1.5 rounded-full hover:bg-black/10 transition-colors opacity-60 hover:opacity-100 disabled:opacity-30"
      title={isSpeaking ? 'Stop speaking' : 'Read aloud'}
      aria-label={isSpeaking ? 'Stop speaking' : 'Read message aloud'}
    >
      {isSpeaking ? (
        <Square className="w-4 h-4" style={{ color: accentColor }} />
      ) : (
        <Volume2 className="w-4 h-4" style={{ color: accentColor }} />
      )}
    </button>
  );
}
