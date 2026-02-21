export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const WHISPER_SERVER_URL = import.meta.env.VITE_WHISPER_SERVER_URL || 'http://localhost:8765';

export const TTS_SERVER_URL = import.meta.env.VITE_TTS_SERVER_URL || 'http://localhost:8766';

export const API_ENDPOINTS = {
  personalities: '/api/v1/personalities/',
  defaultPersonality: '/api/v1/personalities/default',
  counselors: '/api/v1/personalities/',
  sessions: '/api/v1/sessions',
  chat: '/api/v1/chat/chat',
  cards: '/api/v1/cards',
  generateCard: '/api/v1/cards/generate-from-text',
  saveCard: '/api/v1/cards/save',
  updateCard: (id: number) => `/api/v1/cards/${id}`,
  toggleAutoUpdate: (id: number) => `/api/v1/cards/${id}/toggle-auto-update`,
  pinCard: (type: string, id: number) => `/api/v1/cards/${type}/${id}/pin`,
  unpinCard: (type: string, id: number) => `/api/v1/cards/${type}/${id}/unpin`,
  clientCards: '/api/v1/cards',
  analyzeSession: (sessionId: number) => `/api/v1/sessions/${sessionId}/analyze`,
  health: '/health',
  groups: {
    create: '/api/v1/groups/create',
    join: (code: string) => `/api/v1/groups/join/${code}`,
    inviteInfo: (code: string) => `/api/v1/groups/invite/${code}/info`,
    active: '/api/v1/groups/active',
    details: (id: number) => `/api/v1/groups/${id}`,
    leave: (id: number) => `/api/v1/groups/${id}/leave`,
    participants: (id: number) => `/api/v1/groups/${id}/participants`,
    messages: (id: number) => `/api/v1/groups/${id}/messages`,
    chat: '/api/v1/groups/chat',
  },
} as const;
