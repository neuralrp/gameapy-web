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
} from '../types/api';
import type { CounselorFromDB } from '../types/counselor';
import type { Card } from '../types/card';
import type { Counselor } from '../types/counselor';
import type { HealthCheck } from '../types/health';

function transformCounselorFromDB(dbCounselor: CounselorFromDB): Counselor {
  const data = dbCounselor.profile.data;
  
  return {
    id: dbCounselor.id,
    name: data.name,
    description: data.your_vibe,
    specialty: data.who_you_are,
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
    return this.request('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  }

  async register(username: string, password: string, name: string): Promise<APIResponse<{ access_token: string; user_id: number; username: string }>> {
    return this.request('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password, name }),
    });
  }

  async getMe(): Promise<APIResponse<{ user_id: number; username: string; name: string }>> {
    return this.request('/api/v1/auth/me');
  }

  async getCounselors(): Promise<Counselor[]> {
    const dbCounselors = await this.request<CounselorFromDB[]>(API_ENDPOINTS.counselors);
    return dbCounselors.map(transformCounselorFromDB);
  }

  async createCustomAdvisor(
    name: string,
    specialty: string,
    vibe: string
  ): Promise<import('../types/counselor').CreateAdvisorResponse> {
    return this.request<import('../types/counselor').CreateAdvisorResponse>(
      '/api/v1/counselors/custom/create',
      {
        method: 'POST',
        body: JSON.stringify({ name, specialty, vibe })
      }
    );
  }

  async getCustomAdvisors(): Promise<import('../types/counselor').CustomAdvisor[]> {
    return this.request<import('../types/counselor').CustomAdvisor[]>(
      '/api/v1/counselors/custom/list'
    );
  }

  async updateCustomAdvisor(
    counselorId: number,
    personaData: CounselorFromDB['profile']
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
}

export const apiService = new ApiService();
