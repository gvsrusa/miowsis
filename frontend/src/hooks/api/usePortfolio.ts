import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { portfolioService } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
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
} from '@/services/api/types';

// Query keys
const portfolioKeys = {
  all: ['portfolio'] as const,
  portfolio: (userId: string) => [...portfolioKeys.all, 'user', userId] as const,
  holdings: (userId: string, page?: number, size?: number) => 
    [...portfolioKeys.all, 'holdings', userId, { page, size }] as const,
  performance: (userId: string, period?: string) => 
    [...portfolioKeys.all, 'performance', userId, period] as const,
  transactions: (userId: string, filters?: any) => 
    [...portfolioKeys.all, 'transactions', userId, filters] as const,
  allocation: (userId: string) => 
    [...portfolioKeys.all, 'allocation', userId] as const,
};

// Portfolio summary hook
export const usePortfolio = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: portfolioKeys.portfolio(user?.id || ''),
    queryFn: () => portfolioService.getPortfolio(user?.id || ''),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Holdings hook with pagination
export const useHoldings = (page = 0, size = 20) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: portfolioKeys.holdings(user?.id || '', page, size),
    queryFn: () => portfolioService.getHoldings(user?.id || '', page, size),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });
};

// Portfolio performance hook
export const usePortfolioPerformance = (period = '1M') => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: portfolioKeys.performance(user?.id || '', period),
    queryFn: () => portfolioService.getPerformance(user?.id || '', period),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });
};

// Transactions hook with filters
export const useTransactions = (filters?: {
  type?: string;
  symbol?: string;
  page?: number;
  size?: number;
}) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: portfolioKeys.transactions(user?.id || '', filters),
    queryFn: () => portfolioService.getTransactions(user?.id || '', filters),
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Portfolio allocation hook
export const usePortfolioAllocation = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: portfolioKeys.allocation(user?.id || ''),
    queryFn: () => portfolioService.getAllocation(user?.id || ''),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });
};

// Buy securities mutation
export const useBuySecurities = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (order: BuyOrderRequest) => 
      portfolioService.buySecurities(user?.id || '', order),
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: portfolioKeys.portfolio(user?.id || '') });
      queryClient.invalidateQueries({ queryKey: portfolioKeys.holdings(user?.id || '') });
      queryClient.invalidateQueries({ queryKey: portfolioKeys.transactions(user?.id || '') });
      queryClient.invalidateQueries({ queryKey: portfolioKeys.allocation(user?.id || '') });
    },
  });
};

// Sell securities mutation
export const useSellSecurities = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (order: SellOrderRequest) => 
      portfolioService.sellSecurities(user?.id || '', order),
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: portfolioKeys.portfolio(user?.id || '') });
      queryClient.invalidateQueries({ queryKey: portfolioKeys.holdings(user?.id || '') });
      queryClient.invalidateQueries({ queryKey: portfolioKeys.transactions(user?.id || '') });
      queryClient.invalidateQueries({ queryKey: portfolioKeys.allocation(user?.id || '') });
    },
  });
};

// Rebalance portfolio mutation
export const useRebalancePortfolio = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (request: RebalanceRequest) => 
      portfolioService.rebalancePortfolio(user?.id || '', request),
    onSuccess: () => {
      // Invalidate all portfolio queries
      queryClient.invalidateQueries({ queryKey: portfolioKeys.all });
    },
  });
};

// Round up mutation
export const useRoundUp = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (request: RoundUpRequest) => 
      portfolioService.processRoundUp(user?.id || '', request),
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: portfolioKeys.portfolio(user?.id || '') });
      queryClient.invalidateQueries({ queryKey: portfolioKeys.transactions(user?.id || '') });
    },
  });
};