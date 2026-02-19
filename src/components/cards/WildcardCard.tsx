import React from 'react';

interface WildcardCardProps {
  onDragStart: () => void;
}

export const WildcardCard: React.FC<WildcardCardProps> = ({ onDragStart }) => {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({
      card_type: 'wildcard',
      card_id: 0,
      card_data: { name: 'WILDCARD' }
    }));
    onDragStart();
    e.currentTarget.classList.add('opacity-50');
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('opacity-50');
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className="flex-shrink-0 w-24 h-36 bg-gradient-to-br from-gray-950 to-black 
                 rounded-lg border-2 border-red-600 hover:border-red-400 
                 cursor-grab active:cursor-grabbing transition-all
                 hover:scale-105 hover:shadow-lg hover:shadow-red-500/30
                 flex flex-col items-center justify-center gap-2"
    >
      <div className="text-3xl">🎴</div>
      <span className="text-red-500 font-bold text-sm tracking-wide rotate-[-5deg]">
        WILDCARD
      </span>
      <div className="text-[10px] text-red-400/60 mt-1">Drag to play</div>
    </div>
  );
};
