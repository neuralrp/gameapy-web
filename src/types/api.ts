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
  client_id: number;
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
  };
}

export interface GuideStartRequest {
  client_id: number;
}

export interface GuideStartResponse {
  guide_message: string;
  session_id: number;
  client_id: number;
}

export interface GuideInputRequest {
  session_id: number;
  user_input: string;
}

export interface GuideInputResponse {
  guide_message: string;
  suggested_card?: {
    card_type: 'self' | 'character' | 'world';
    topic: string;
    confidence: number;
  };
  conversation_complete: boolean;
}

export interface GuideConfirmCardRequest {
  session_id: number;
  card_type: string;
  topic: string;
}

export interface GuideConfirmCardResponse {
  card_id: number;
  card_data: any;
  guide_message: string;
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
  client_id: number;
  card_type: 'self' | 'character' | 'world';
  card_data: Record<string, any>;
}
