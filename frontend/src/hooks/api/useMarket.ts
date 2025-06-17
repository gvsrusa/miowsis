import { useQuery } from '@tanstack/react-query';
import { tradingService } from '@/services/api';
import type { MarketDataDto, NewsArticleDto } from '@/services/api/types';

// Query keys
const marketKeys = {
  all: ['market'] as const,
  quote: (symbol: string) => [...marketKeys.all, 'quote', symbol] as const,
  quotes: (symbols: string[]) => [...marketKeys.all, 'quotes', symbols] as const,
  trending: () => [...marketKeys.all, 'trending'] as const,
  news: (category?: string) => [...marketKeys.all, 'news', category] as const,
  search: (query: string) => [...marketKeys.all, 'search', query] as const,
};

// Market quote hook
export const useMarketQuote = (symbol: string) => {
  return useQuery({
    queryKey: marketKeys.quote(symbol),
    queryFn: () => tradingService.getMarketQuote(symbol),
    enabled: !!symbol,
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 60 * 1000, // Refresh every minute during market hours
  });
};

// Multiple quotes hook
export const useMarketQuotes = (symbols: string[]) => {
  return useQuery({
    queryKey: marketKeys.quotes(symbols),
    queryFn: () => tradingService.getMultipleQuotes(symbols),
    enabled: symbols.length > 0,
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
  });
};

// Trending securities hook
export const useTrendingSecurities = () => {
  return useQuery({
    queryKey: marketKeys.trending(),
    queryFn: () => tradingService.getTrendingSecurities(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Market news hook
export const useMarketNews = (category?: string) => {
  return useQuery({
    queryKey: marketKeys.news(category),
    queryFn: () => tradingService.getMarketNews(category),
    staleTime: 5 * 60 * 1000,
  });
};

// Security search hook
export const useSecuritySearch = (query: string, enabled = true) => {
  return useQuery({
    queryKey: marketKeys.search(query),
    queryFn: () => tradingService.searchSecurities(query),
    enabled: enabled && query.length > 0,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
};