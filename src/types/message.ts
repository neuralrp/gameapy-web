export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  cards_loaded?: number;
  senderId?: number;
  senderName?: string;
}
