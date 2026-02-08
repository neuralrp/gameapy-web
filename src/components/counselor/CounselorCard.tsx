import type { Counselor } from '../../types/counselor';

interface CounselorCardProps {
  counselor: Counselor;
  isSelected: boolean;
  onSelect: (counselor: Counselor) => void;
}

export function CounselorCard({ counselor, isSelected, onSelect }: CounselorCardProps) {
  const visuals = counselor.visuals;

  return (
    <button
      onClick={() => onSelect(counselor)}
      className={`
        relative w-full p-6 border-2 rounded-lg transition-all
        hover:scale-105 active:scale-95
        ${isSelected ? 'ring-4 scale-105' : ''}
      `}
      style={{
        backgroundColor: visuals.selectionCard.backgroundColor,
        borderColor: visuals.selectionCard.borderColor,
        color: visuals.selectionCard.textColor,
      }}
      onMouseEnter={(e) => {
        (e.target as HTMLElement).style.backgroundColor = visuals.selectionCard.hoverBackgroundColor;
      }}
      onMouseLeave={(e) => {
        (e.target as HTMLElement).style.backgroundColor = visuals.selectionCard.backgroundColor;
      }}
    >
      <div className="text-center">
        {visuals.icon && (
          <div className="mb-3 text-4xl" style={{ color: visuals.selectionCard.textColor }}>
            {visuals.icon === 'lucide:baseball' && '⚾'}
            {visuals.icon === 'lucide:zap' && '⚡'}
            {visuals.icon === 'lucide:brain' && '🧠'}
            {visuals.icon === 'lucide:droplets' && '💧'}
          </div>
        )}
        <div className="font-retro text-2xl mb-2" style={{ color: visuals.selectionCard.textColor }}>
          {counselor.name}
        </div>
        <div className="font-sans text-sm" style={{ color: visuals.selectionCard.textColor }}>
          {counselor.specialty}
        </div>
        <div className="font-sans text-xs mt-2 opacity-75" style={{ color: visuals.selectionCard.textColor }}>
          {counselor.description}
        </div>
      </div>
    </button>
  );
}
