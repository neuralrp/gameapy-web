import React from 'react';
import { TableSlot } from './TableSlot';
import type { TableSlots, ConversationMode, TableSlotPosition } from '../../types/card';

interface GameTableProps {
  slots: TableSlots;
  onCardDrop: (position: TableSlotPosition) => void;
  onCardRemove: (position: TableSlotPosition) => void;
  conversationMode: ConversationMode;
  personalityName: string;
}

function getModeDisplay(mode: ConversationMode, personalityName: string): { icon: string; text: string; className: string } {
  switch (mode) {
    case 'roleplay':
      return {
        icon: '🎭',
        text: 'Roleplay Mode',
        className: 'bg-purple-500/20 text-purple-300',
      };
    case 'three_way':
      return {
        icon: '👥',
        text: 'Three-Way Conversation',
        className: 'bg-green-500/20 text-green-300',
      };
    case 'advisory':
    default:
      return {
        icon: '💬',
        text: `Chatting with ${personalityName}`,
        className: 'bg-blue-500/20 text-blue-300',
      };
  }
}

export const GameTable: React.FC<GameTableProps> = ({
  slots,
  onCardDrop,
  onCardRemove,
  conversationMode,
  personalityName,
}) => {
  const modeDisplay = getModeDisplay(conversationMode, personalityName);

  return (
    <div className="flex flex-col h-full">
      {/* Mode Indicator */}
      <div className="text-center py-2">
        <span className={`text-xs px-3 py-1 rounded-full ${modeDisplay.className}`}>
          {modeDisplay.icon} {modeDisplay.text}
        </span>
      </div>

      {/* Table Surface */}
      <div className="flex-1 bg-gradient-to-b from-green-900/30 to-green-950/50 rounded-3xl mx-4 mb-4 p-4 border border-green-800/50 overflow-auto">
        
        {/* Far Side (AI/Partner Side) */}
        <div className="flex justify-center gap-8 mb-6">
          <TableSlot
            position="far_left"
            card={slots.far_left}
            onDrop={onCardDrop}
            onRemove={onCardRemove}
          />
          <TableSlot
            position="far_right"
            card={slots.far_right}
            onDrop={onCardDrop}
            onRemove={onCardRemove}
          />
        </div>

        {/* Divider */}
        <div className="border-t border-dashed border-green-700/50 my-4" />

        {/* Center (Topics) */}
        <div className="flex justify-center">
          <TableSlot
            position="center"
            card={slots.center}
            onDrop={onCardDrop}
            onRemove={onCardRemove}
          />
        </div>
        
        {/* Help Text */}
        <div className="text-center mt-4 text-gray-500 text-xs">
          Drag cards from your hand to play them on the table
        </div>
      </div>
    </div>
  );
};
