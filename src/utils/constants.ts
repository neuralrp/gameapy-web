export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const API_ENDPOINTS = {
  clients: '/api/v1/clients',
  counselors: '/api/v1/counselors',
  sessions: '/api/v1/sessions',
  chat: '/api/v1/chat/chat',
  cards: '/api/v1/cards',
  generateCard: '/api/v1/cards/generate-from-text',
  saveCard: '/api/v1/cards/save',
  updateCard: (type: string, id: number) => `/api/v1/cards/${type}/${id}`,
  toggleAutoUpdate: (type: string, id: number) => `/api/v1/cards/${type}/${id}/toggle-auto-update`,
  pinCard: (type: string, id: number) => `/api/v1/cards/${type}/${id}/pin`,
  unpinCard: (type: string, id: number) => `/api/v1/cards/${type}/${id}/unpin`,
  clientCards: (clientId: number) => `/api/v1/clients/${clientId}/cards`,
  guide: {
    start: '/api/v1/guide/conversation/start',
    input: '/api/v1/guide/conversation/input',
    confirmCard: '/api/v1/guide/conversation/confirm-card',
  },
  analyzeSession: (sessionId: number) => `/api/v1/sessions/${sessionId}/analyze`,
} as const;
