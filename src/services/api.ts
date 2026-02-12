import { API_BASE_URL, API_ENDPOINTS } from '../utils/constants';
import type {
  ChatRequest,
  ChatResponse,
  ClientProfileCreate,
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

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const timestamp = new Date().toISOString();

    try {
      console.log(`[${timestamp}] API Request: ${options.method || 'GET'} ${url}`);

      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

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

        throw new Error(error.message || `HTTP ${response.status}`);
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

  async createClient(data: ClientProfileCreate) {
    return this.request(API_ENDPOINTS.clients, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getCounselors(): Promise<Counselor[]> {
    const dbCounselors = await this.request<CounselorFromDB[]>(API_ENDPOINTS.counselors);
    return dbCounselors.map(transformCounselorFromDB);
  }

  async createSession(data: SessionCreate) {
    return this.request(API_ENDPOINTS.sessions, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async sendMessage(data: ChatRequest): Promise<ChatResponse> {
    return this.request(API_ENDPOINTS.chat, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async *sendMessageStream(data: ChatRequest): AsyncGenerator<StreamChunk, void> {
    const url = `${this.baseUrl}${API_ENDPOINTS.chat}`;
    const timestamp = new Date().toISOString();

    try {
      console.log(`[${timestamp}] API Stream Request: POST ${url}`);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

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

  async getCards(clientId: number): Promise<APIResponse<{ items: Card[] }>> {
    return this.request(API_ENDPOINTS.clientCards(clientId));
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
    clientId: number,
    cardType: 'self' | 'character' | 'world',
    cardData: Record<string, any>
  ): Promise<APIResponse<{ card_id: number }>> {
    const payload: CardSaveRequest = {
      client_id: clientId,
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

  // Recovery Code API
  async generateRecoveryCode(clientId: number): Promise<APIResponse<{ recovery_code: string }>> {
    return this.request(API_ENDPOINTS.generateRecoveryCode(clientId), {
      method: 'POST',
    });
  }

  async validateRecoveryCode(code: string): Promise<APIResponse<{ client_id: number }>> {
    return this.request(API_ENDPOINTS.validateRecoveryCode, {
      method: 'POST',
      body: JSON.stringify({ recovery_code: code }),
    });
  }

  async getRecoveryStatus(clientId: number): Promise<APIResponse<{
    has_recovery_code: boolean;
    expires_at: string | null;
    last_recovered_at: string | null;
  }>> {
    return this.request(API_ENDPOINTS.recoveryStatus(clientId));
  }
}

export const apiService = new ApiService();
