export type CardType = 'self' | 'character' | 'world';

export interface BaseCard {
  id: number;
  card_type: CardType;
  payload: Record<string, any>;
  auto_update_enabled: boolean;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface SelfCard extends BaseCard {
  card_type: 'self';
  payload: {
    name?: string;
    personality?: string;
    background?: string;
    [key: string]: any;
  };
}

export interface CharacterCard extends BaseCard {
  card_type: 'character';
  payload: {
    name: string;
    relationship_type: string;
    relationship_label?: string;
    personality: string;
    [key: string]: any;
  };
}

export interface WorldCard extends BaseCard {
  card_type: 'world';
  payload: {
    title: string;
    description: string;
    event_type?: string;
    key_array: string[];
    is_canon_law?: boolean;
    resolved?: boolean;
    [key: string]: any;
  };
}

export type Card = SelfCard | CharacterCard | WorldCard;

export type UnifiedCard = Card;
