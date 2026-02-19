import React from 'react';
import type { TableSlotPosition, TableSlotCard, ExtendedCardType } from '../../types/card';
import { SLOT_LABELS } from '../../types/card';

interface TableSlotProps {
  position: TableSlotPosition;
  card: TableSlotCard | null;
  onDrop: (position: TableSlotPosition) => void;
  onRemove: (position: TableSlotPosition) => void;
}

function getCardIcon(cardType: ExtendedCardType): string {
  switch (cardType) {
    case 'self': return '👤';
    case 'character': return '👥';
    case 'world': return '🌍';
    case 'universal': return '⭐';
    case 'personality': return '🎭';
    default: return '🃏';
  }
}

function getCardName(card: TableSlotCard): string {
  if (card.card_data?.name) return card.card_data.name;
  if (card.card_data?.title) return card.card_data.title;
  if (card.card_data?.payload?.name) return card.card_data.payload.name;
  return 'Unknown';
}

export const TableSlot: React.FC<TableSlotProps> = ({ 
  position, 
  card, 
  onDrop, 
  onRemove 
}) => {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add('ring-2', 'ring-blue-400', 'bg-blue-500/10');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('ring-2', 'ring-blue-400', 'bg-blue-500/10');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove('ring-2', 'ring-blue-400', 'bg-blue-500/10');
    onDrop(position);
  };

  const isFarSlot = position.includes('far');

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative w-28 h-40 rounded-xl border-2 transition-all
        ${card 
          ? 'border-solid border-gray-600 bg-gray-800' 
          : 'border-dashed border-gray-600 bg-gray-800/50'
        }
        ${isFarSlot ? 'opacity-90' : ''}
      `}
    >
      {card ? (
        <div className="h-full flex flex-col animate-cardPlay">
          <div className="flex-1 bg-gray-700 rounded-t-xl flex items-center justify-center overflow-hidden">
            {card.card_data?.image_url ? (
              <img 
                src={card.card_data.image_url} 
                alt={getCardName(card)} 
                className="w-full h-full object-cover" 
              />
            ) : (
              <span className="text-3xl">
                {getCardIcon(card.card_type as ExtendedCardType)}
              </span>
            )}
          </div>
          
          <div className="p-2 text-center">
            <p className="text-xs font-medium text-white truncate">
              {getCardName(card)}
            </p>
          </div>
          
          <button
            onClick={() => onRemove(position)}
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full 
                       text-white text-xs hover:bg-red-600 transition-colors
                       flex items-center justify-center shadow-lg"
          >
            ×
          </button>
        </div>
      ) : (
        <div className="h-full flex flex-col items-center justify-center text-gray-500 p-2">
          <span className="text-xs text-center">{SLOT_LABELS[position]}</span>
          <span className="text-[10px] mt-1 opacity-50">Drop card here</span>
        </div>
      )}
    </div>
  );
};
