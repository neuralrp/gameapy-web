import { API_BASE_URL, API_ENDPOINTS } from '../utils/constants';
import type {
  ChatRequest,
  ChatResponse,
  ClientProfileCreate,
  SessionCreate,
  APIResponse,
  GuideStartResponse,
  GuideInputResponse,
  GuideConfirmCardResponse,
  SessionAnalyzeResponse,
} from '../types/api';
import type { CounselorFromDB } from '../types/counselor';
import type { Card } from '../types/card';
import type { Counselor } from '../types/counselor';

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

  async getCards(clientId: number): Promise<APIResponse<{ items: Card[] }>> {
    return this.request(API_ENDPOINTS.clientCards(clientId));
  }

  async updateCard(type: string, id: number, data: Record<string, any>): Promise<any> {
    return this.request(API_ENDPOINTS.updateCard(type, id), {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async toggleAutoUpdate(type: string, id: number): Promise<any> {
    return this.request(API_ENDPOINTS.toggleAutoUpdate(type, id), {
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

  async startGuideConversation(clientId: number): Promise<APIResponse<GuideStartResponse>> {
    return this.request(`${API_ENDPOINTS.guide.start}?client_id=${clientId}`, {
      method: 'POST',
    });
  }

  async sendGuideInput(sessionId: number, userInput: string): Promise<APIResponse<GuideInputResponse>> {
    return this.request(`${API_ENDPOINTS.guide.input}?session_id=${sessionId}&user_input=${encodeURIComponent(userInput)}`, {
      method: 'POST',
    });
  }

  async confirmGuideCard(sessionId: number, cardType: string, topic: string): Promise<APIResponse<GuideConfirmCardResponse>> {
    return this.request(`${API_ENDPOINTS.guide.confirmCard}?session_id=${sessionId}&card_type=${cardType}&topic=${encodeURIComponent(topic)}`, {
      method: 'POST',
    });
  }

  async analyzeSession(sessionId: number): Promise<APIResponse<SessionAnalyzeResponse>> {
    return this.request(API_ENDPOINTS.analyzeSession(sessionId), {
      method: 'POST',
    });
  }
}

export const apiService = new ApiService();
