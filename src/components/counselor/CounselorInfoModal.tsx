import { X } from 'lucide-react';
import type { Counselor } from '../../types/counselor';

interface CounselorInfoModalProps {
  counselor: Counselor;
  onClose: () => void;
}

export function CounselorInfoModal({ counselor, onClose }: CounselorInfoModalProps) {
  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 modal-enter"
      onClick={onClose}
    >
      <div 
        className="bg-gba-ui border-2 border-gba-border rounded-lg max-w-md w-full p-6 max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <h2 className="font-retro text-2xl text-gba-text">{counselor.name}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gba-highlight rounded transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6 text-gba-text" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="font-sans font-semibold text-gba-text mb-1">About</h3>
            <p className="font-sans text-gba-text text-sm opacity-90">
              {counselor.specialty}
            </p>
          </div>

          <div>
            <h3 className="font-sans font-semibold text-gba-text mb-1">Style</h3>
            <p className="font-sans text-gba-text text-sm opacity-90">
              {counselor.description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
