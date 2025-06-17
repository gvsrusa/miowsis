import { useQuery } from '@tanstack/react-query';
import { esgService } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
import type { ESGScoreDto } from '@/services/api/types';

// Query keys
const esgKeys = {
  all: ['esg'] as const,
  score: (userId: string) => [...esgKeys.all, 'score', userId] as const,
  portfolio: (userId: string) => [...esgKeys.all, 'portfolio', userId] as const,
  security: (symbol: string) => [...esgKeys.all, 'security', symbol] as const,
  trends: (symbol: string) => 
    [...esgKeys.all, 'trends', symbol] as const,
};

// User ESG score hook
export const useESGScore = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: esgKeys.score(user?.id || ''),
    queryFn: () => esgService.getESGScore(user?.id || ''),
    enabled: !!user?.id,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Portfolio ESG analysis hook
export const usePortfolioESG = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: esgKeys.portfolio(user?.id || ''),
    queryFn: () => esgService.getPortfolioESGAnalysis(user?.id || ''),
    enabled: !!user?.id,
    staleTime: 10 * 60 * 1000,
  });
};

// Security ESG data hook
export const useSecurityESG = (symbol: string) => {
  return useQuery({
    queryKey: esgKeys.security(symbol),
    queryFn: () => esgService.getSecurityESGData(symbol),
    enabled: !!symbol,
    staleTime: 60 * 60 * 1000, // 1 hour
  });
};

// ESG trends hook
export const useESGTrends = (symbol: string) => {
  return useQuery({
    queryKey: esgKeys.trends(symbol),
    queryFn: () => esgService.getESGTrends(symbol),
    enabled: !!symbol,
    staleTime: 10 * 60 * 1000,
  });
};