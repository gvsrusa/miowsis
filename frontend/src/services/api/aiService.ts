import { api } from './apiClient';
import { API_CONFIG } from '@/config/api.config';
import type {
  ChatRequest,
  ChatResponse,
  AIInsightDto,
  ChatSession,
  ChatMessage,
  InvestmentRecommendation,
  MarketAnalysis,
  PortfolioInsight
} from './types';

interface AIAnalysisRequest {
  type: 'PORTFOLIO' | 'MARKET' | 'STOCK' | 'ESG';
  data: any;
  depth?: 'BASIC' | 'DETAILED' | 'COMPREHENSIVE';
}

interface AIAnalysisResponse {
  summary: string;
  insights: string[];
  recommendations: Array<{
    action: string;
    reason: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
  }>;
  risks: string[];
  opportunities: string[];
}

interface AIRecommendationRequest {
  context: 'INVESTMENT' | 'REBALANCING' | 'TAX_OPTIMIZATION' | 'ESG_IMPROVEMENT';
  portfolioId: string;
  preferences?: Record<string, any>;
}

interface AIRecommendationResponse {
  recommendations: Array<{
    id: string;
    title: string;
    description: string;
    expectedReturn?: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    timeHorizon: string;
    actions: Array<{
      type: 'BUY' | 'SELL' | 'HOLD' | 'REBALANCE';
      symbol?: string;
      quantity?: number;
      reason: string;
    }>;
  }>;
}

class AIService {
  async chat(request: ChatRequest): Promise<ChatResponse> {
    return api.post<ChatResponse>(
      API_CONFIG.endpoints.ai.chat,
      request
    );
  }

  async streamChat(
    request: ChatRequest,
    onChunk: (chunk: string) => void
  ): Promise<void> {
    const token = localStorage.getItem('accessToken');
    const response = await fetch(`${API_CONFIG.baseURL}${API_CONFIG.endpoints.ai.chatStream}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) return;

    try {
      let done = false;
      while (!done) {
        const result = await reader.read();
        done = result.done;
        const value = result.value;
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') return;
            
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                onChunk(parsed.content);
              }
            } catch (e) {
              console.error('Failed to parse SSE data:', e);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  async getInsights(
    userId: string,
    filters: {
      type?: string;
      limit?: number;
    } = {}
  ): Promise<AIInsightDto[]> {
    return api.get<AIInsightDto[]>(
      API_CONFIG.endpoints.ai.insights,
      {
        params: { userId, ...filters }
      }
    );
  }

  async analyze(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
    return api.post<AIAnalysisResponse>(
      API_CONFIG.endpoints.ai.analysis,
      request
    );
  }

  async getRecommendations(
    request: AIRecommendationRequest
  ): Promise<AIRecommendationResponse> {
    return api.post<AIRecommendationResponse>(
      API_CONFIG.endpoints.ai.recommendations,
      request
    );
  }

  // Chat session methods
  async getChatSessions(userId: string): Promise<ChatSession[]> {
    return api.get<ChatSession[]>('/api/ai/chat/sessions', {
      params: { userId }
    });
  }

  async getChatSession(sessionId: string): Promise<ChatSession> {
    return api.get<ChatSession>(`/api/ai/chat/sessions/${sessionId}`);
  }

  async createChatSession(userId: string): Promise<ChatSession> {
    return api.post<ChatSession>('/api/ai/chat/sessions', { userId });
  }

  async sendMessage(sessionId: string, message: string): Promise<ChatMessage> {
    return api.post<ChatMessage>(`/api/ai/chat/sessions/${sessionId}/messages`, {
      message
    });
  }

  // Investment recommendation methods
  async getInvestmentRecommendations(userId: string): Promise<InvestmentRecommendation[]> {
    return api.get<InvestmentRecommendation[]>('/api/ai/recommendations', {
      params: { userId }
    });
  }

  // Market analysis methods
  async getMarketAnalysis(symbol?: string): Promise<MarketAnalysis> {
    return api.get<MarketAnalysis>('/api/ai/analysis/market', {
      params: symbol ? { symbol } : undefined
    });
  }

  // Portfolio insights methods
  async getPortfolioInsights(userId: string): Promise<PortfolioInsight[]> {
    return api.get<PortfolioInsight[]>('/api/ai/insights/portfolio', {
      params: { userId }
    });
  }

  async generatePortfolioAdvice(portfolioId: string): Promise<string> {
    return api.post<{ advice: string }>('/api/ai/portfolio/advice', {
      portfolioId
    }).then(response => response.advice);
  }
}

export const aiService = new AIService();