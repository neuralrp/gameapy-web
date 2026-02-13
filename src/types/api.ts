import type { CounselorFromDB } from './counselor';

export interface APIResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

export interface PresentingIssue {
  issue: string;
  severity: string;
  duration: string;
}

export interface LifeEvent {
  title: string;
  date: string;
  impact: string;
  resolved: boolean;
  tags: string[];
}

export interface ClientPreferences {
  communication_style?: string;
  pace?: string;
  focus_areas?: string[];
}

export interface ClientProfileCreate {
  name: string;
  personality: string;
  traits: string[];
  presenting_issues: PresentingIssue[];
  goals: string[];
  life_events: LifeEvent[];
  preferences?: ClientPreferences;
}

export interface ClientProfileResponse {
  id: number;
  entity_id: string;
  name: string;
  created_at: string;
  updated_at: string;
  profile_json: any;
}

export interface SessionCreate {
  counselor_id: number;
}

export interface SessionResponse {
  session_id: number;
  client_id: number;
  counselor_id: number;
  session_number: number;
  started_at: string;
}

export interface MessageCreate {
  role: 'user' | 'assistant' | 'system';
  content: string;
  speaker?: string;
}

export interface ChatRequest {
  session_id: number;
  message_data: MessageCreate;
}

export interface ChatResponse {
  success: boolean;
  message: string;
  data: {
    user_message_id?: number;
    ai_message_id?: number;
    ai_response: string;
    cards_loaded: number;
    counselor_switched?: boolean;
    new_counselor?: {
      name: string;
      who_you_are: string;
      your_vibe: string;
      your_worldview: string;
      session_template: string;
      session_examples: Array<{
        user_situation: string;
        your_response: string;
        approach: string;
      }>;
      tags: string[];
      visuals: {
        primaryColor: string;
        secondaryColor: string;
        borderColor: string;
        textColor: string;
        chatBubble: {
          backgroundColor: string;
          borderColor: string;
          borderWidth: string;
          borderStyle: string;
          borderRadius: string;
          textColor: string;
        };
        selectionCard: {
          backgroundColor: string;
          hoverBackgroundColor: string;
          borderColor: string;
          textColor: string;
        };
        icon?: string;
      };
      crisis_protocol: string;
      hotlines: Array<{
        name: string;
        contact: string;
        available?: string;
        info?: string;
      }>;
    };
  };
}

export interface SessionAnalyzeResponse {
  cards_updated: number;
}

export interface CardGenerateRequest {
  card_type: 'self' | 'character' | 'world';
  plain_text: string;
  context?: string;
  name?: string;
}

export interface CardGenerateResponse {
  card_type: 'self' | 'character' | 'world';
  generated_card: Record<string, any>;
  preview: boolean;
  fallback: boolean;
}

export interface CardSaveRequest {
  card_type: 'self' | 'character' | 'world';
  card_data: Record<string, any>;
}

export interface StreamChunk {
  type: 'content' | 'done' | 'error';
  content?: string;
  data?: {
    cards_loaded: number;
    counselor_switched?: boolean;
    new_counselor?: CounselorFromDB['profile']['data'];
  };
  error?: string;
}

// Farm Types
export interface PlantedCrop {
  plotIndex: number;
  cropType: string;
  plantedAtMessage: number;
  growthDuration: number;
  isHarvested: boolean;
  isWatered: boolean;
  growthStage: number;
}

export interface FarmAnimal {
  slotIndex: number;
  animalType: string;
  acquiredAtMessage: number;
  maturityDuration: number;
  isMature: boolean;
}

export interface FarmDecoration {
  type: string;
  x: number;
  y: number;
  variant: number;
}

export interface FarmStatus {
  gold: number;
  farmLevel: number;
  messageCounter: number;
  crops: PlantedCrop[];
  tilledPlots: number[];
  animals: FarmAnimal[];
  decorations: FarmDecoration[];
  maxPlots: number;
  maxBarnSlots: number;
  unlocks: string[];
}

export interface FarmShopData {
  seeds: Array<{
    id: string;
    name: string;
    cost: number;
    growthMessages: number;
  }>;
  animals: Array<{
    id: string;
    name: string;
    cost: number;
    maturityMessages: number;
  }>;
  decorations: Array<{
    id: string;
    name: string;
    cost: number;
  }>;
  playerGold: number;
  farmLevel: number;
  currentPlots: number;
  currentBarnSlots: number;
  upgradeCost: number | null;
  nextLevelUnlocks: string[];
}
