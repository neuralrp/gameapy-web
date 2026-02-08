export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const API_ENDPOINTS = {
  clients: `${API_BASE_URL}/api/v1/clients`,
  counselors: `${API_BASE_URL}/api/v1/counselors`,
  sessions: `${API_BASE_URL}/api/v1/sessions`,
  chat: `${API_BASE_URL}/api/v1/chat`,
  cards: `${API_BASE_URL}/api/v1/cards`,
  generateCard: `${API_BASE_URL}/api/v1/cards/generate-from-text`,
  saveCard: `${API_BASE_URL}/api/v1/cards/save`,
  updateCard: (type: string, id: number) => `${API_BASE_URL}/api/v1/cards/${type}/${id}`,
  toggleAutoUpdate: (type: string, id: number) => `${API_BASE_URL}/api/v1/cards/${type}/${id}/toggle-auto-update`,
  pinCard: (type: string, id: number) => `${API_BASE_URL}/api/v1/cards/${type}/${id}/pin`,
  unpinCard: (type: string, id: number) => `${API_BASE_URL}/api/v1/cards/${type}/${id}/unpin`,
  clientCards: (clientId: number) => `${API_BASE_URL}/api/v1/clients/${clientId}/cards`,
} as const;
