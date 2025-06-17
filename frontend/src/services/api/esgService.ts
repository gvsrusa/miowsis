import { api } from './apiClient';
import { API_CONFIG } from '@/config/api.config';
import type {
  ESGScoreDto,
  ESGImpactDto,
  PaginatedResponse
} from './types';

export interface ESGAnalysisDto {
  portfolioId: string;
  overallScore: number;
  totalScore?: number;
  environmentalScore?: number;
  environmentalDetails?: string;
  socialScore?: number;
  socialDetails?: string;
  governanceScore?: number;
  governanceDetails?: string;
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  risks: string[];
  insights?: string[];
  peerComparison: {
    averageScore: number;
    rank: number;
    totalPeers: number;
  };
}

interface ESGRecommendationDto {
  id: string;
  title: string;
  description: string;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  category: 'ENVIRONMENTAL' | 'SOCIAL' | 'GOVERNANCE';
  suggestedActions: Array<{
    action: string;
    expectedImprovement: number;
  }>;
}

class ESGService {
  async getScores(
    filters: {
      symbols?: string[];
      minScore?: number;
      page?: number;
      size?: number;
    } = {}
  ): Promise<PaginatedResponse<ESGScoreDto>> {
    const { page = 0, size = 20, ...params } = filters;
    return api.get<PaginatedResponse<ESGScoreDto>>(
      API_CONFIG.endpoints.esg.scores,
      {
        params: { ...params, page, size }
      }
    );
  }

  async getCompanyScore(symbol: string): Promise<ESGScoreDto> {
    return api.get<ESGScoreDto>(
      `${API_CONFIG.endpoints.esg.companies}/${symbol}/score`
    );
  }

  async getPortfolioImpact(portfolioId: string): Promise<ESGImpactDto> {
    return api.get<ESGImpactDto>(
      `${API_CONFIG.endpoints.esg.impact}/${portfolioId}`
    );
  }

  async getAnalysis(portfolioId: string): Promise<ESGAnalysisDto> {
    return api.get<ESGAnalysisDto>(
      `${API_CONFIG.endpoints.esg.analysis}/${portfolioId}`
    );
  }

  async getRecommendations(
    portfolioId: string
  ): Promise<ESGRecommendationDto[]> {
    return api.get<ESGRecommendationDto[]>(
      `${API_CONFIG.endpoints.esg.recommendations}/${portfolioId}`
    );
  }

  async searchESGCompanies(
    query: string,
    filters: {
      minScore?: number;
      sectors?: string[];
      page?: number;
      size?: number;
    } = {}
  ): Promise<PaginatedResponse<ESGScoreDto>> {
    const { page = 0, size = 20, ...params } = filters;
    return api.get<PaginatedResponse<ESGScoreDto>>(
      API_CONFIG.endpoints.esg.companies,
      {
        params: { q: query, ...params, page, size }
      }
    );
  }

  // Additional methods for compatibility
  async getESGScore(userId: string): Promise<ESGScoreDto> {
    return api.get<ESGScoreDto>(`/api/esg/users/${userId}/score`);
  }

  async getPortfolioESGAnalysis(userId: string): Promise<ESGAnalysisDto> {
    // Get user's portfolio first, then get ESG analysis
    const portfolios = await api.get<any[]>(`/api/portfolios/users/${userId}`);
    if (portfolios.length > 0) {
      return this.getAnalysis(portfolios[0].id);
    }
    throw new Error('No portfolio found for user');
  }

  async getSecurityESGData(symbol: string): Promise<ESGScoreDto> {
    return this.getCompanyScore(symbol);
  }

  async getESGTrends(symbol: string): Promise<any> {
    return api.get(`/api/esg/companies/${symbol}/trends`);
  }
}

export const esgService = new ESGService();