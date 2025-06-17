import { api } from './apiClient';
import { API_CONFIG, buildUrl } from '@/config/api.config';
import type {
  PortfolioDto,
  HoldingDto,
  TransactionDto,
  BuyOrderRequest,
  SellOrderRequest,
  RebalanceRequest,
  RebalanceResultDto,
  PortfolioPerformanceDto,
  PortfolioAllocationDto,
  RoundUpRequest,
  PaginatedResponse
} from './types';

class PortfolioService {
  async getPortfolio(userId: string): Promise<PortfolioDto> {
    return api.get<PortfolioDto>(
      buildUrl(`${API_CONFIG.endpoints.portfolio.get}/${userId}`)
    );
  }

  async getHoldings(
    userId: string,
    page = 0,
    size = 20
  ): Promise<PaginatedResponse<HoldingDto>> {
    return api.get<PaginatedResponse<HoldingDto>>(
      buildUrl(API_CONFIG.endpoints.portfolio.holdings, { userId }),
      {
        params: { page, size }
      }
    );
  }

  async getPerformance(
    userId: string,
    period = '1M'
  ): Promise<PortfolioPerformanceDto> {
    return api.get<PortfolioPerformanceDto>(
      buildUrl(API_CONFIG.endpoints.portfolio.performance, { userId }),
      {
        params: { period }
      }
    );
  }

  async buySecurities(
    userId: string,
    order: BuyOrderRequest
  ): Promise<TransactionDto> {
    return api.post<TransactionDto>(
      buildUrl(API_CONFIG.endpoints.portfolio.buy, { userId }),
      order
    );
  }

  async sellSecurities(
    userId: string,
    order: SellOrderRequest
  ): Promise<TransactionDto> {
    return api.post<TransactionDto>(
      buildUrl(API_CONFIG.endpoints.portfolio.sell, { userId }),
      order
    );
  }

  async rebalancePortfolio(
    userId: string,
    request: RebalanceRequest
  ): Promise<RebalanceResultDto> {
    return api.post<RebalanceResultDto>(
      buildUrl(API_CONFIG.endpoints.portfolio.rebalance, { userId }),
      request
    );
  }

  async getTransactions(
    userId: string,
    filters: {
      type?: string;
      symbol?: string;
      page?: number;
      size?: number;
    } = {}
  ): Promise<PaginatedResponse<TransactionDto>> {
    const { page = 0, size = 20, ...params } = filters;
    return api.get<PaginatedResponse<TransactionDto>>(
      buildUrl(API_CONFIG.endpoints.portfolio.transactions, { userId }),
      {
        params: { ...params, page, size }
      }
    );
  }

  async getAllocation(userId: string): Promise<PortfolioAllocationDto> {
    return api.get<PortfolioAllocationDto>(
      buildUrl(API_CONFIG.endpoints.portfolio.allocation, { userId })
    );
  }

  async processRoundUp(
    userId: string,
    request: RoundUpRequest
  ): Promise<TransactionDto> {
    return api.post<TransactionDto>(
      buildUrl(API_CONFIG.endpoints.portfolio.roundUp, { userId }),
      request
    );
  }
}

export const portfolioService = new PortfolioService();