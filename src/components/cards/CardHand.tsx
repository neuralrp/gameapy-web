import React from 'react';
import type { HandCard, ExtendedCardType } from '../../types/card';
import { WildcardCard } from './WildcardCard';

interface CardHandProps {
  cards: HandCard[];
  onCardSelect: (card: HandCard) => void;
  onCardDragStart: (card: HandCard) => void;
  onWildcardDragStart: () => void;
  onGenerateImage?: (card: HandCard) => void;
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

function getCardName(card: HandCard): string {
  if (card.card_data?.name) return card.card_data.name;
  if (card.card_data?.title) return card.card_data.title;
  if (card.card_data?.payload?.name) return card.card_data.payload.name;
  return 'Unknown';
}

export const CardHand: React.FC<CardHandProps> = ({
  cards,
  onCardSelect,
  onCardDragStart,
  onWildcardDragStart,
  onGenerateImage
}) => {
  const handleDragStart = (e: React.DragEvent, card: HandCard) => {
    e.dataTransfer.setData('text/plain', JSON.stringify(card));
    onCardDragStart(card);
    e.currentTarget.classList.add('opacity-50');
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('opacity-50');
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm p-4 border-t border-gray-700 z-40">
      <div className="flex gap-3 overflow-x-auto pb-2 px-2">
        <WildcardCard onDragStart={onWildcardDragStart} />
        
        {cards.length === 0 ? (
          <div className="text-gray-500 text-sm py-8 text-center flex-1">
            Loading cards...
          </div>
        ) : (
          cards.map((card) => (
            <div
              key={`hand-${card.card_type}-${card.card_id}`}
              draggable
              onDragStart={(e) => handleDragStart(e, card)}
              onDragEnd={handleDragEnd}
              onClick={() => onCardSelect(card)}
              className="flex-shrink-0 w-24 h-36 bg-gradient-to-br from-gray-800 to-gray-900 
                         rounded-lg border-2 border-gray-600 hover:border-blue-400 
                         cursor-grab active:cursor-grabbing transition-all
                         hover:scale-105 hover:shadow-lg hover:shadow-blue-500/20"
            >
              <div className="h-20 bg-gray-700 rounded-t-lg flex items-center justify-center overflow-hidden relative">
                {card.card_data?.image_url ? (
                  <img
                    src={card.card_data.image_url}
                    alt={getCardName(card)}
                    className="h-full w-full object-cover rounded-t-lg"
                  />
                ) : (
                  <div className="text-2xl flex flex-col items-center gap-1">
                    {getCardIcon(card.card_type as ExtendedCardType)}
                    {onGenerateImage && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onGenerateImage(card);
                        }}
                        className="w-6 h-6 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center text-white text-xs shadow-lg"
                        title="Generate Image"
                      >
                        🎨
                      </button>
                    )}
                  </div>
                )}
              </div>
              
              <div className="p-2 text-center">
                <p className="text-xs font-medium text-white truncate">
                  {getCardName(card)}
                </p>
                <p className="text-[10px] text-gray-400 capitalize">{card.card_type}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
