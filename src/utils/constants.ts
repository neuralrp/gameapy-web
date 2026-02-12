export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const API_ENDPOINTS = {
  clients: '/api/v1/clients',
  counselors: '/api/v1/counselors',
  sessions: '/api/v1/sessions',
  chat: '/api/v1/chat/chat',
  cards: '/api/v1/cards',
  generateCard: '/api/v1/cards/generate-from-text',
  saveCard: '/api/v1/cards/save',
  updateCard: (id: number) => `/api/v1/cards/${id}`,
  toggleAutoUpdate: (id: number) => `/api/v1/cards/${id}/toggle-auto-update`,
  pinCard: (type: string, id: number) => `/api/v1/cards/${type}/${id}/pin`,
  unpinCard: (type: string, id: number) => `/api/v1/cards/${type}/${id}/unpin`,
  clientCards: (clientId: number) => `/api/v1/clients/${clientId}/cards`,
  analyzeSession: (sessionId: number) => `/api/v1/sessions/${sessionId}/analyze`,
  health: '/health',
  generateRecoveryCode: (clientId: number) => `/api/v1/recovery/generate?client_id=${clientId}`,
  validateRecoveryCode: '/api/v1/recovery/validate',
  recoveryStatus: (clientId: number) => `/api/v1/recovery/status/${clientId}`,
} as const;
