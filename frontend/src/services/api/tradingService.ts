import { api } from './apiClient';
import { API_CONFIG, buildUrl } from '@/config/api.config';
import type {
  MarketDataDto,
  QuoteDto,
  TransactionDto,
  PaginatedResponse,
  NewsArticleDto
} from './types';

interface OrderDto {
  id: string;
  userId: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  orderType: 'MARKET' | 'LIMIT' | 'STOP' | 'STOP_LIMIT';
  quantity: number;
  price?: number;
  stopPrice?: number;
  status: 'PENDING' | 'EXECUTED' | 'CANCELLED' | 'FAILED';
  filledQuantity: number;
  averagePrice?: number;
  createdAt: string;
  executedAt?: string;
}

interface OrderRequest {
  symbol: string;
  type: 'BUY' | 'SELL';
  orderType: 'MARKET' | 'LIMIT' | 'STOP' | 'STOP_LIMIT';
  quantity: number;
  price?: number;
  stopPrice?: number;
  timeInForce?: 'DAY' | 'GTC' | 'IOC' | 'FOK';
}

interface SearchResult {
  symbol: string;
  name: string;
  type: 'STOCK' | 'ETF' | 'CRYPTO' | 'BOND';
  exchange: string;
  currency: string;
}

class TradingService {
  async createOrder(order: OrderRequest): Promise<OrderDto> {
    return api.post<OrderDto>(
      API_CONFIG.endpoints.trading.orders,
      order
    );
  }

  async getOrders(
    filters: {
      status?: string;
      symbol?: string;
      type?: string;
      page?: number;
      size?: number;
    } = {}
  ): Promise<PaginatedResponse<OrderDto>> {
    const { page = 0, size = 20, ...params } = filters;
    return api.get<PaginatedResponse<OrderDto>>(
      API_CONFIG.endpoints.trading.orders,
      {
        params: { ...params, page, size }
      }
    );
  }

  async getOrderStatus(orderId: string): Promise<OrderDto> {
    return api.get<OrderDto>(
      buildUrl(API_CONFIG.endpoints.trading.orderStatus, { orderId })
    );
  }

  async cancelOrder(orderId: string): Promise<void> {
    return api.delete(
      buildUrl(API_CONFIG.endpoints.trading.orderStatus, { orderId })
    );
  }

  async getMarketData(symbols: string[]): Promise<MarketDataDto[]> {
    return api.get<MarketDataDto[]>(
      API_CONFIG.endpoints.trading.marketData,
      {
        params: { symbols: symbols.join(',') }
      }
    );
  }

  async getQuote(symbol: string): Promise<QuoteDto> {
    return api.get<QuoteDto>(
      `${API_CONFIG.endpoints.trading.quotes}/${symbol}`
    );
  }

  async getQuotes(symbols: string[]): Promise<QuoteDto[]> {
    return api.get<QuoteDto[]>(
      API_CONFIG.endpoints.trading.quotes,
      {
        params: { symbols: symbols.join(',') }
      }
    );
  }

  async searchSecurities(
    query: string,
    filters: {
      type?: string;
      exchange?: string;
      limit?: number;
    } = {}
  ): Promise<SearchResult[]> {
    return api.get<SearchResult[]>(
      API_CONFIG.endpoints.trading.search,
      {
        params: { q: query, ...filters }
      }
    );
  }

  // Market data methods
  async getMarketQuote(symbol: string): Promise<QuoteDto> {
    return this.getQuote(symbol);
  }

  async getMultipleQuotes(symbols: string[]): Promise<QuoteDto[]> {
    return this.getQuotes(symbols);
  }

  async getTrendingSecurities(): Promise<MarketDataDto[]> {
    return api.get<MarketDataDto[]>('/api/market/trending');
  }

  async getMarketNews(category?: string): Promise<{ articles: NewsArticleDto[] }> {
    return api.get<{ articles: NewsArticleDto[] }>('/api/market/news', {
      params: category ? { category } : undefined
    });
  }
}

export const tradingService = new TradingService();