import { API_BASE_URL, API_ENDPOINTS } from '../utils/constants';
import type {
  ChatRequest,
  SessionCreate,
  APIResponse,
  SessionAnalyzeResponse,
  CardGenerateRequest,
  CardGenerateResponse,
  CardSaveRequest,
  StreamChunk,
  SessionInfo,
} from '../types/api';
import type { PersonalityFromDB, Personality } from '../types/personality';
import type { Card } from '../types/card';
import type { HealthCheck } from '../types/health';
import type { Message } from '../types/message';

function transformPersonalityFromDB(dbPersonality: PersonalityFromDB): Personality {
  const data = dbPersonality.profile.data;
  
  return {
    id: dbPersonality.id,
    name: data.name,
    description: data.your_vibe,
    specialty: data.who_you_are,
    is_custom: dbPersonality.is_custom,
    is_default: dbPersonality.is_default,
    visuals: data.visuals || {
      primaryColor: '#F8F0D8',
      secondaryColor: '#E8E0C8',
      borderColor: '#D8D0B8',
      textColor: '#483018',
      chatBubble: {
        backgroundColor: '#F8F0D8',
        borderColor: '#D8D0B8',
        borderWidth: '2px',
        borderStyle: 'solid',
        borderRadius: '8px',
        textColor: '#483018',
      },
      selectionCard: {
        backgroundColor: '#F8F0D8',
        hoverBackgroundColor: '#F8F0D8CC',
        borderColor: '#D8D0B8',
        textColor: '#483018',
      },
    },
  };
}

export class ApiService {
  private baseUrl: string;
  private authToken: string | null = null;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
    this.authToken = localStorage.getItem('gameapy_auth_token');
  }

  setAuthToken(token: string | null) {
    this.authToken = token;
    if (token) {
      localStorage.setItem('gameapy_auth_token', token);
    } else {
      localStorage.removeItem('gameapy_auth_token');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const timestamp = new Date().toISOString();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>,
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    try {
      console.log(`[${timestamp}] API Request: ${options.method || 'GET'} ${url}`);

      const response = await fetch(url, {
        headers,
        ...options,
        signal: AbortSignal.timeout(60000),
      });

      if (response.status === 401) {
        this.setAuthToken(null);
        localStorage.removeItem('gameapy_client_id_int');
        window.location.href = '/login';
        throw new Error('Session expired. Please login again.');
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          message: `HTTP ${response.status}: ${response.statusText}`,
        }));

        console.error(`[${timestamp}] API Error:`, {
          url,
          status: response.status,
          statusText: response.statusText,
          error,
        });

        throw new Error(error.detail || error.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log(`[${timestamp}] API Success:`, { url, status: response.status });
      return data;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error(`[${timestamp}] Network Error:`, { url, error: error.message });
        throw new Error("Couldn't reach the server. Is it running?");
      }

      console.error(`[${timestamp}] Request Failed:`, {
        url,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });

      throw error;
    }
  }

  async login(username: string, password: string): Promise<APIResponse<{ access_token: string; user_id: number; username: string }>> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  }

  async register(username: string, password: string, name: string): Promise<APIResponse<{ access_token: string; user_id: number; username: string }>> {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password, name }),
    });
  }

  async getMe(): Promise<APIResponse<{ user_id: number; username: string; name: string }>> {
    return this.request('/auth/me');
  }

  async getPersonalities(): Promise<Personality[]> {
    const response = await this.request<APIResponse<PersonalityFromDB[]>>(API_ENDPOINTS.personalities);
    if (response.success && response.data) {
      return response.data.map(transformPersonalityFromDB);
    }
    return [];
  }

  async getDefaultPersonality(): Promise<Personality | null> {
    const response = await this.request<APIResponse<PersonalityFromDB>>(API_ENDPOINTS.defaultPersonality);
    if (response.success && response.data) {
      return transformPersonalityFromDB(response.data);
    }
    return null;
  }

  async getPersonality(personalityId: number): Promise<Personality | null> {
    const response = await this.request<APIResponse<PersonalityFromDB>>(`${API_ENDPOINTS.personalities}${personalityId}`);
    if (response.success && response.data) {
      return transformPersonalityFromDB(response.data);
    }
    return null;
  }

  async getCounselors(): Promise<Personality[]> {
    return this.getPersonalities();
  }

  async createCustomAdvisor(
    name: string,
    specialty: string,
    vibe: string
  ): Promise<import('../types/personality').CreateAdvisorResponse> {
    return this.request<import('../types/personality').CreateAdvisorResponse>(
      '/api/v1/counselors/custom/create',
      {
        method: 'POST',
        body: JSON.stringify({ name, specialty, vibe })
      }
    );
  }

  async getCustomAdvisors(): Promise<import('../types/personality').CustomAdvisor[]> {
    return this.request<import('../types/personality').CustomAdvisor[]>(
      '/api/v1/counselors/custom/list'
    );
  }

  async updateCustomAdvisor(
    counselorId: number,
    personaData: PersonalityFromDB['profile']
  ): Promise<APIResponse<void>> {
    return this.request<APIResponse<void>>(
      '/api/v1/counselors/custom/update',
      {
        method: 'PUT',
        body: JSON.stringify({
          counselor_id: counselorId,
          persona_data: personaData
        })
      }
    );
  }

  async deleteCustomAdvisor(counselorId: number): Promise<APIResponse<void>> {
    return this.request<APIResponse<void>>(
      `/api/v1/counselors/custom/${counselorId}`,
      { method: 'DELETE' }
    );
  }

  async createSession(data: SessionCreate) {
    return this.request(API_ENDPOINTS.sessions, {
      method: 'POST',
      body: JSON.stringify({ counselor_id: data.counselor_id }),
    });
  }

  async getAllSessions(limit: number = 50): Promise<APIResponse<{ sessions: SessionInfo[] }>> {
    return this.request(`/api/v1/sessions?limit=${limit}`);
  }

  async getSession(sessionId: number): Promise<APIResponse<{ session: SessionInfo }>> {
    return this.request(`/api/v1/sessions/${sessionId}`);
  }

  async getSessionMessages(sessionId: number, limit: number = 50): Promise<Message[]> {
    return this.request(`/api/v1/sessions/${sessionId}/messages?limit=${limit}`);
  }

  async summarizeSession(sessionId: number): Promise<APIResponse<{ summary: string; cached: boolean }>> {
    return this.request(`/api/v1/sessions/${sessionId}/summarize`, { method: 'POST' });
  }

  async endSession(sessionId: number): Promise<APIResponse<{ message: string }>> {
    return this.request(`/api/v1/sessions/${sessionId}/end`, { method: 'POST' });
  }

  async sendMessage(data: ChatRequest): Promise<Response> {
    const url = `${this.baseUrl}${API_ENDPOINTS.chat}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    return fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
  }

  async *sendMessageStream(data: ChatRequest): AsyncGenerator<StreamChunk, void> {
    const url = `${this.baseUrl}${API_ENDPOINTS.chat}`;
    const timestamp = new Date().toISOString();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    try {
      console.log(`[${timestamp}] API Stream Request: POST ${url}`);

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });

      if (response.status === 401) {
        this.setAuthToken(null);
        localStorage.removeItem('gameapy_client_id_int');
        window.location.href = '/login';
        throw new Error('Session expired. Please login again.');
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          message: `HTTP ${response.status}: ${response.statusText}`,
        }));

        console.error(`[${timestamp}] API Stream Error:`, {
          url,
          status: response.status,
          statusText: response.statusText,
          error,
        });

        throw new Error(error.message || `HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('Response body is not readable');
      }

      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (trimmedLine.startsWith('data: ')) {
            try {
              const jsonStr = trimmedLine.slice(6);
              const chunk: StreamChunk = JSON.parse(jsonStr);
              yield chunk;
            } catch (e) {
              console.error(`[${timestamp}] Failed to parse SSE chunk:`, {
                rawLine: trimmedLine,
                error: e instanceof Error ? e.message : e,
              });
            }
          }
        }
      }

      console.log(`[${timestamp}] API Stream Success:`, { url, status: response.status });
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error(`[${timestamp}] Network Error:`, { url, error: error.message });
        throw new Error("Couldn't reach the server. Is it running?");
      }

      console.error(`[${timestamp}] Stream Request Failed:`, {
        url,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });

      throw error;
    }
  }

  async getCards(): Promise<APIResponse<{ items: Card[] }>> {
    return this.request(API_ENDPOINTS.clientCards);
  }

  async updateCard(type: string, id: number, data: Record<string, any>): Promise<any> {
    return this.request(API_ENDPOINTS.updateCard(id), {
      method: 'PUT',
      body: JSON.stringify({ ...data, card_type: type }),
    });
  }

  async toggleAutoUpdate(type: string, id: number): Promise<any> {
    return this.request(`${API_ENDPOINTS.toggleAutoUpdate(id)}?card_type=${type}`, {
      method: 'PUT',
    });
  }

  async pinCard(type: string, id: number): Promise<any> {
    return this.request(API_ENDPOINTS.pinCard(type, id), {
      method: 'PUT',
    });
  }

  async unpinCard(type: string, id: number): Promise<any> {
    return this.request(API_ENDPOINTS.unpinCard(type, id), {
      method: 'PUT',
    });
  }

  async analyzeSession(sessionId: number): Promise<APIResponse<SessionAnalyzeResponse>> {
    return this.request(API_ENDPOINTS.analyzeSession(sessionId), {
      method: 'POST',
    });
  }

  async generateCardFromText(
    cardType: 'self' | 'character' | 'world',
    plainText: string,
    name?: string
  ): Promise<APIResponse<CardGenerateResponse>> {
    const payload: CardGenerateRequest = {
      card_type: cardType,
      plain_text: plainText,
      name,
    };
    return this.request(API_ENDPOINTS.generateCard, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async saveCard(
    cardType: 'self' | 'character' | 'world',
    cardData: Record<string, any>
  ): Promise<APIResponse<{ card_id: number }>> {
    const payload: CardSaveRequest = {
      card_type: cardType,
      card_data: cardData,
    };
    return this.request(API_ENDPOINTS.saveCard, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async checkHealth(): Promise<HealthCheck> {
    return this.request<HealthCheck>(API_ENDPOINTS.health);
  }

  // Friendship Level Methods
  async getFriendshipLevel(counselorId: number): Promise<APIResponse<{
    counselor_id: number;
    level: number;
    points: number;
    counselor_name: string | null;
    last_interaction: string | null;
    exists: boolean;
  }>> {
    return this.request(`/api/v1/friendship/${counselorId}`);
  }

  async getAllFriendshipLevels(): Promise<APIResponse<{
    friendships: Array<{
      id: number;
      client_id: number;
      counselor_id: number;
      level: number;
      points: number;
      counselor_name: string;
      last_interaction: string | null;
    }>;
  }>> {
    return this.request('/api/v1/friendship/');
  }

  async analyzeSessionFriendship(sessionId: number): Promise<APIResponse<{
    points_delta: number;
    new_level: number;
    new_points: number;
    reasoning?: string;
    signals_detected?: string[];
    friendship_tier?: string;
    already_analyzed?: boolean;
  }>> {
    return this.request('/api/v1/friendship/analyze-session', {
      method: 'POST',
      body: JSON.stringify({ session_id: sessionId }),
    });
  }

  // ============================================================
  // Table & Hand API
  // ============================================================

  async playCardToTable(
    sessionId: number,
    slotPosition: string,
    cardType: string,
    cardId: number
  ): Promise<APIResponse<any>> {
    return this.request('/api/v1/table/play', {
      method: 'POST',
      body: JSON.stringify({
        session_id: sessionId,
        slot_position: slotPosition,
        card_type: cardType,
        card_id: cardId,
      }),
    });
  }

  async removeCardFromTable(
    sessionId: number,
    slotPosition: string
  ): Promise<APIResponse<any>> {
    return this.request('/api/v1/table/remove', {
      method: 'POST',
      body: JSON.stringify({
        session_id: sessionId,
        slot_position: slotPosition,
      }),
    });
  }

  async clearTable(sessionId: number): Promise<APIResponse<any>> {
    return this.request(`/api/v1/table/clear?session_id=${sessionId}`, {
      method: 'POST',
    });
  }

  async getTableState(sessionId: number): Promise<APIResponse<{
    slots: any[];
    conversation_mode: string;
  }>> {
    return this.request(`/api/v1/table/state/${sessionId}`);
  }

  async getHand(): Promise<APIResponse<{ cards: any[] }>> {
    return this.request('/api/v1/table/hand');
  }

  async addCardToHand(
    cardType: string,
    cardId: number,
    position: number = 0
  ): Promise<APIResponse<any>> {
    return this.request(
      `/api/v1/table/hand/add?card_type=${cardType}&card_id=${cardId}&position=${position}`,
      { method: 'POST' }
    );
  }

  async removeCardFromHand(
    cardType: string,
    cardId: number
  ): Promise<APIResponse<any>> {
    return this.request(
      `/api/v1/table/hand/remove?card_type=${cardType}&card_id=${cardId}`,
      { method: 'POST' }
    );
  }

  async clearHand(): Promise<APIResponse<any>> {
    return this.request('/api/v1/table/hand/clear', { method: 'POST' });
  }

  // ============================================================
  // Universal Cards API
  // ============================================================

  async getUniversalCards(category?: string): Promise<APIResponse<any[]>> {
    const url = category
      ? `/api/v1/universal-cards?category=${category}`
      : '/api/v1/universal-cards';
    return this.request(url);
  }

  async getUniversalCard(cardId: number): Promise<APIResponse<any>> {
    return this.request(`/api/v1/universal-cards/${cardId}`);
  }

  async getUniversalCardCategories(): Promise<APIResponse<string[]>> {
    return this.request('/api/v1/universal-cards/categories');
  }

  async createUniversalCard(data: {
    title: string;
    description?: string;
    category?: string;
    card_json?: any;
    image_url?: string;
  }): Promise<APIResponse<any>> {
    return this.request('/api/v1/universal-cards', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ============================================================
  // Friends API
  // ============================================================

  async getFriends(): Promise<APIResponse<any[]>> {
    return this.request('/api/v1/friends/');
  }

  async sendFriendRequest(username: string): Promise<APIResponse<any>> {
    return this.request(`/api/v1/friends/request/${encodeURIComponent(username)}`, {
      method: 'POST',
    });
  }

  async acceptFriendRequest(requesterId: number): Promise<APIResponse<any>> {
    return this.request(`/api/v1/friends/accept/${requesterId}`, {
      method: 'POST',
    });
  }

  async declineFriendRequest(requesterId: number): Promise<APIResponse<any>> {
    return this.request(`/api/v1/friends/decline/${requesterId}`, {
      method: 'POST',
    });
  }

  async removeFriend(friendId: number): Promise<APIResponse<any>> {
    return this.request(`/api/v1/friends/${friendId}`, {
      method: 'DELETE',
    });
  }

  async getPendingFriendRequests(): Promise<APIResponse<any[]>> {
    return this.request('/api/v1/friends/pending');
  }

  async getSentFriendRequests(): Promise<APIResponse<any[]>> {
    return this.request('/api/v1/friends/sent');
  }

  async getFriendshipStatus(username: string): Promise<APIResponse<any>> {
    return this.request(`/api/v1/friends/status/${encodeURIComponent(username)}`);
  }

  // ============================================================
  // Trading API
  // ============================================================

  async sendTradeRequest(data: {
    receiver_username: string;
    card_type: string;
    card_id: number;
    message?: string;
  }): Promise<APIResponse<any>> {
    return this.request('/api/v1/trading/send', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async acceptTradeRequest(tradeId: number): Promise<APIResponse<any>> {
    return this.request(`/api/v1/trading/accept/${tradeId}`, {
      method: 'POST',
    });
  }

  async declineTradeRequest(tradeId: number): Promise<APIResponse<any>> {
    return this.request(`/api/v1/trading/decline/${tradeId}`, {
      method: 'POST',
    });
  }

  async cancelTradeRequest(tradeId: number): Promise<APIResponse<any>> {
    return this.request(`/api/v1/trading/cancel/${tradeId}`, {
      method: 'POST',
    });
  }

  async getIncomingTrades(): Promise<APIResponse<any[]>> {
    return this.request('/api/v1/trading/incoming');
  }

  async getOutgoingTrades(): Promise<APIResponse<any[]>> {
    return this.request('/api/v1/trading/outgoing');
  }

  async syncTradedCard(tradeId: number): Promise<APIResponse<any>> {
    return this.request(`/api/v1/trading/sync/${tradeId}`, {
      method: 'POST',
    });
  }

  async getSharedCards(): Promise<APIResponse<any[]>> {
    return this.request('/api/v1/trading/shared-with-me');
  }

  async getTradeDetails(tradeId: number): Promise<APIResponse<any>> {
    return this.request(`/api/v1/trading/${tradeId}`);
  }

  // ============================================================
  // Notifications API
  // ============================================================

  async getNotifications(unreadOnly: boolean = false): Promise<APIResponse<any[]>> {
    const url = unreadOnly ? '/api/v1/notifications/?unread_only=true' : '/api/v1/notifications/';
    return this.request(url);
  }

  async getUnreadNotificationCount(): Promise<APIResponse<{ count: number }>> {
    return this.request('/api/v1/notifications/unread-count');
  }

  async markNotificationRead(notificationId: number): Promise<APIResponse<any>> {
    return this.request(`/api/v1/notifications/${notificationId}/read`, {
      method: 'POST',
    });
  }

  async markAllNotificationsRead(): Promise<APIResponse<any>> {
    return this.request('/api/v1/notifications/read-all', {
      method: 'POST',
    });
  }

  async deleteNotification(notificationId: number): Promise<APIResponse<any>> {
    return this.request(`/api/v1/notifications/${notificationId}`, {
      method: 'DELETE',
    });
  }

  // ============================================================
  // Image Generation API
  // ============================================================

  async generatePersonalityImage(personalityId: number): Promise<APIResponse<{
    success: boolean;
    message: string;
    remaining: number;
  }>> {
    return this.request(`/api/v1/images/personality/${personalityId}`, {
      method: 'POST',
    });
  }

  async generateCardImage(
    cardType: 'self' | 'character' | 'world' | 'universal',
    cardId: number
  ): Promise<APIResponse<{
    success: boolean;
    message: string;
    remaining: number;
  }>> {
    return this.request(`/api/v1/images/card/${cardType}/${cardId}`, {
      method: 'POST',
    });
  }

  async getImageGenerationRemaining(): Promise<APIResponse<{
    remaining: number;
    daily_limit: number;
    can_generate: boolean;
  }>> {
    return this.request('/api/v1/images/remaining');
  }
}

export const apiService = new ApiService();
