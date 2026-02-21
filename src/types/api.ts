import type { CounselorFromDB } from './counselor';
import type { ConversationMode } from './card';

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

export interface SessionInfo {
  id: number;
  client_id: number;
  counselor_id: number;
  session_number: number;
  started_at: string;
  ended_at: string | null;
  summary: string | null;
  summary_generated_at: string | null;
  counselor_name: string;
}

export interface MessageCreate {
  role: 'user' | 'assistant' | 'system';
  content: string;
  speaker?: string;
}

export interface ChatRequest {
  session_id: number;
  message_data: MessageCreate;
  trigger_wildcard?: boolean;
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
    wildcard?: {
      topic_text: string;
    };
    conversation_mode?: ConversationMode;
    mentions_detected?: Array<{ card_name: string; card_type: string }>;
  };
  error?: string;
}

export interface GroupSession {
  id: number;
  session_id: number;
  host_id: number;
  guest_id: number | null;
  counselor_id: number;
  invite_code: string;
  status: 'waiting' | 'active' | 'ended';
  created_at: string;
  updated_at: string;
}

export interface GroupParticipant {
  id: number;
  name: string;
  username: string;
  role: 'host' | 'guest';
}

export interface CreateGroupRequest {
  friend_id: number;
  counselor_id: number;
}

export interface GroupInfoResponse {
  group_session: GroupSession;
  host: { id: number; name: string; username: string } | null;
  guest: { id: number; name: string; username: string } | null;
  counselor: { id: number; name: string } | null;
}

export interface ActiveGroupResponse extends GroupInfoResponse {
  is_host: boolean;
}

export interface GroupInviteInfo {
  group_session_id: number;
  host: { name: string } | null;
  counselor: { name: string } | null;
}

export interface WebSocketMessageIn {
  type: 'connected' | 'user_joined' | 'user_left' | 'new_message' | 
        'typing' | 'card_played' | 'card_removed' | 'table_cleared' | 
        'ai_response' | 'error' | 'auth_required';
  connected_users?: number[];
  user_id?: number;
  user_name?: string;
  is_typing?: boolean;
  content?: string;
  id?: number;
  sender_id?: number;
  sender_name?: string;
  role?: string;
  created_at?: string;
  slot?: string;
  card_type?: string;
  card_id?: number;
  played_by?: number;
  played_by_name?: string;
  removed_by?: number;
  cleared_by?: number;
  error?: string;
}

export interface WebSocketMessageOut {
  type: 'auth' | 'chat_message' | 'typing' | 'play_card' | 'remove_card' | 'clear_table';
  token?: string;
  content?: string;
  is_typing?: boolean;
  slot?: string;
  card_type?: string;
  card_id?: number;
}

export type WebSocketMessage = WebSocketMessageIn;
