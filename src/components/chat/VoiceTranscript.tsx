import { X } from 'lucide-react';

interface VoiceTranscriptProps {
  transcript: string;
  interimTranscript: string;
  onCancel: () => void;
  textColor?: string;
}

export function VoiceTranscript({ 
  transcript, 
  interimTranscript, 
  onCancel,
  textColor = '#3D3426'
}: VoiceTranscriptProps) {
  const hasContent = transcript || interimTranscript;
  
  if (!hasContent) return null;

  return (
    <div className="relative bg-black/10 rounded-lg px-3 py-2 mb-2 flex items-start gap-2">
      <div className="flex-1 min-w-0">
        <p 
          className="text-sm whitespace-pre-wrap break-words"
          style={{ color: textColor }}
        >
          {transcript}
          <span className="opacity-60">{interimTranscript}</span>
          <span className="animate-pulse">|</span>
        </p>
      </div>
      <button
        onClick={onCancel}
        className="p-1 rounded-full hover:bg-black/10 flex-shrink-0 min-h-[32px] min-w-[32px] flex items-center justify-center"
        aria-label="Cancel voice input"
      >
        <X className="w-4 h-4" style={{ color: textColor }} />
      </button>
    </div>
  );
}
