import { useRef } from 'react';
import { Mic, Loader2, Volume2 } from 'lucide-react';

export type VoiceButtonState = 'idle' | 'listening' | 'sending' | 'speaking';

interface HoldToTalkButtonProps {
  state: VoiceButtonState;
  transcript: string;
  onHoldStart: () => void;
  onHoldEnd: () => void;
  disabled?: boolean;
}

export function HoldToTalkButton({
  state,
  transcript,
  onHoldStart,
  onHoldEnd,
  disabled = false,
}: HoldToTalkButtonProps) {
  const isHoldingRef = useRef(false);
  const isInteractive = state === 'idle' && !disabled;
  
  const pointerIdRef = useRef<number | null>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    if (isInteractive) {
      isHoldingRef.current = true;
      pointerIdRef.current = e.pointerId;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      onHoldStart();
    }
  };
  
  const handlePointerUp = (e: React.PointerEvent) => {
    e.preventDefault();
    if (isHoldingRef.current) {
      isHoldingRef.current = false;
      if (pointerIdRef.current !== null) {
        (e.target as HTMLElement).releasePointerCapture(pointerIdRef.current);
        pointerIdRef.current = null;
      }
      onHoldEnd();
    }
  };
  
  const handlePointerCancel = (e: React.PointerEvent) => {
    if (isHoldingRef.current) {
      isHoldingRef.current = false;
      if (pointerIdRef.current !== null) {
        try {
          (e.target as HTMLElement).releasePointerCapture(pointerIdRef.current);
        } catch {}
        pointerIdRef.current = null;
      }
      onHoldEnd();
    }
  };

  const getButtonContent = () => {
    switch (state) {
      case 'listening':
        return (
          <>
            <Mic className="w-12 h-12 text-white animate-pulse" />
            <span className="text-white font-medium mt-2">LISTENING...</span>
          </>
        );
      case 'sending':
        return (
          <>
            <Loader2 className="w-12 h-12 text-white animate-spin" />
            <span className="text-white font-medium mt-2">
              {disabled ? 'REQUESTING...' : 'SENDING...'}
            </span>
          </>
        );
      case 'speaking':
        return (
          <>
            <Volume2 className="w-12 h-12 text-white animate-pulse" />
            <span className="text-white font-medium mt-2">SPEAKING...</span>
          </>
        );
      default:
        return (
          <>
            <Mic className="w-12 h-12 text-white" />
            <span className="text-white font-medium mt-2">HOLD TO TALK</span>
          </>
        );
    }
  };

  const getButtonClass = () => {
    const base = 'select-none touch-none flex flex-col items-center justify-center rounded-full transition-all duration-200';
    
    if (disabled) {
      return `${base} bg-gray-400 cursor-not-allowed opacity-50`;
    }
    
    switch (state) {
      case 'listening':
        return `${base} bg-red-500 scale-110 shadow-lg shadow-red-500/50`;
      case 'sending':
        return `${base} bg-blue-500 shadow-lg shadow-blue-500/50`;
      case 'speaking':
        return `${base} bg-green-500 shadow-lg shadow-green-500/50`;
      default:
        return `${base} bg-red-500 hover:bg-red-600 active:scale-105`;
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full touch-none">
      <button
        type="button"
        className={getButtonClass()}
        style={{
          width: '140px',
          height: '140px',
          minHeight: '140px',
        }}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onContextMenu={(e) => e.preventDefault()}
        disabled={disabled || state === 'sending' || state === 'speaking'}
        aria-label={state === 'idle' ? 'Hold to talk' : state}
      >
        {getButtonContent()}
      </button>
      
      {state === 'listening' && transcript && (
        <div className="bg-black/20 rounded-lg px-4 py-2 max-w-[80%]">
          <p className="text-white/90 text-sm text-center whitespace-pre-wrap">
            {transcript}
            <span className="animate-pulse">|</span>
          </p>
        </div>
      )}
      
      {state === 'idle' && !disabled && (
        <p className="text-white/60 text-sm">Tap and hold to speak</p>
      )}
    </div>
  );
}
