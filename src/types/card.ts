export type CardType = 'self' | 'character' | 'world';

export interface SimplifiedCardPayload {
  name: string;
  ai_notes: string;
  user_notes: string;
}

export interface BaseCard {
  id: number;
  card_type: CardType;
  payload: SimplifiedCardPayload & Record<string, any>;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface SelfCard extends BaseCard {
  card_type: 'self';
  payload: SimplifiedCardPayload;
}

export interface CharacterCard extends BaseCard {
  card_type: 'character';
  payload: SimplifiedCardPayload;
}

export interface WorldCard extends BaseCard {
  card_type: 'world';
  payload: SimplifiedCardPayload & {
    title?: string;
    description?: string;
    key_array?: string[];
    resolved?: boolean;
  };
}

export type Card = SelfCard | CharacterCard | WorldCard;

export type UnifiedCard = Card;

// ============================================================
// Phase 2: Table and Hand Types
// ============================================================

export type TableSlotPosition = 'center' | 'far_left' | 'far_right';
export type ConversationMode = 'advisory' | 'roleplay' | 'three_way';
export type ExtendedCardType = CardType | 'universal' | 'personality' | 'wildcard';

export interface UniversalCard {
  id: number;
  entity_id: string;
  title: string;
  description?: string;
  category: string;
  card_json?: Record<string, any>;
  is_official: boolean;
  created_by_client_id?: number;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface TableSlotCard {
  id: number;
  session_id: number;
  slot_position: TableSlotPosition;
  card_type: ExtendedCardType;
  card_id: number;
  played_at: string;
  card_data?: Record<string, any>;
}

export interface TableState {
  slots: TableSlotCard[];
  conversation_mode: ConversationMode;
}

export interface HandCard {
  id: number;
  client_id: number;
  card_type: ExtendedCardType;
  card_id: number;
  position: number;
  added_at: string;
  card_data?: Record<string, any>;
}

export interface TableSlots {
  center: TableSlotCard | null;
  far_left: TableSlotCard | null;
  far_right: TableSlotCard | null;
}

export const EMPTY_TABLE_SLOTS: TableSlots = {
  center: null,
  far_left: null,
  far_right: null,
};

export const SLOT_LABELS: Record<TableSlotPosition, string> = {
  center: 'Topic',
  far_left: 'Conversation Partner',
  far_right: 'Second Partner',
};
