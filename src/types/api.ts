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
