import { X, Layers, Plus } from 'lucide-react';

interface HelpModalProps {
  onClose: () => void;
}

const advisors = [
  {
    name: 'Coach San Mateo',
    description: 'No-nonsense accountability coach who believes in extreme ownership and turning excuses into action.'
  },
  {
    name: 'Health & Wellness Coach',
    description: 'Holistic specialist who integrates physical, mental, and emotional health through functional medicine.'
  },
  {
    name: 'Father Red Oak',
    description: 'A wise, patient tree-elder who offers long-term perspective and grounded guidance.'
  },
  {
    name: 'Marina',
    description: 'A gentle, nature-connected guide who blends practical grounding with optional spirituality.'
  }
];

export function HelpModal({ onClose }: HelpModalProps) {
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
          <h2 className="font-bold text-xl text-gba-text">Help</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gba-highlight rounded transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6 text-gba-text" />
          </button>
        </div>

        <div className="space-y-5">
          <div>
            <h3 className="font-semibold text-gba-text mb-2">Meet Your Advisors</h3>
            <ul className="space-y-2">
              {advisors.map((advisor) => (
                <li key={advisor.name} className="text-sm text-gba-text/90">
                  <span className="font-medium">{advisor.name}:</span> {advisor.description}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gba-text mb-2">
              <span className="inline-flex items-center mr-1"><Layers className="w-4 h-4" /></span>
              Card System
            </h3>
            <p className="text-sm text-gba-text/90">
              Cards store your personal context—details about yourself, people in your life, and important events. This helps your advisor remember who you are and provide more personalized support.
            </p>
            <p className="text-sm text-gba-text/90 mt-2">
              Click the <span className="inline-flex items-center mx-1"><Layers className="w-4 h-4" /></span> button to view, create, or edit your cards.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gba-text mb-2">
              <span className="inline-flex items-center mr-1"><Plus className="w-4 h-4" /></span>
              Custom Advisors
            </h3>
            <p className="text-sm text-gba-text/90">
              Create your own AI advisor! Click the <span className="inline-flex items-center mx-1"><Plus className="w-4 h-4" /></span> button in the top left to design a counselor tailored to your needs.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
