import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { aiService } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
import type {
  ChatMessage,
  ChatSession,
  InvestmentRecommendation,
  MarketAnalysis,
  PortfolioInsight
} from '@/services/api/types';

// Query keys
const aiKeys = {
  all: ['ai'] as const,
  sessions: (userId: string) => [...aiKeys.all, 'sessions', userId] as const,
  session: (sessionId: string) => [...aiKeys.all, 'session', sessionId] as const,
  recommendations: (userId: string) => [...aiKeys.all, 'recommendations', userId] as const,
  analysis: (symbol?: string) => [...aiKeys.all, 'analysis', symbol] as const,
  insights: (userId: string) => [...aiKeys.all, 'insights', userId] as const,
};

// Chat sessions hook
export const useChatSessions = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: aiKeys.sessions(user?.id || ''),
    queryFn: () => aiService.getChatSessions(user?.id || ''),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });
};

// Single chat session hook
export const useChatSession = (sessionId: string) => {
  return useQuery({
    queryKey: aiKeys.session(sessionId),
    queryFn: () => aiService.getChatSession(sessionId),
    enabled: !!sessionId,
    staleTime: 2 * 60 * 1000,
  });
};

// Create chat session mutation
export const useCreateChatSession = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => aiService.createChatSession(user?.id || ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aiKeys.sessions(user?.id || '') });
    },
  });
};

// Send chat message mutation
export const useSendChatMessage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ sessionId, message }: { sessionId: string; message: string }) => 
      aiService.sendMessage(sessionId, message),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: aiKeys.session(variables.sessionId) });
    },
  });
};

// Investment recommendations hook
export const useInvestmentRecommendations = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: aiKeys.recommendations(user?.id || ''),
    queryFn: () => aiService.getInvestmentRecommendations(user?.id || ''),
    enabled: !!user?.id,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
};

// Market analysis hook
export const useMarketAnalysis = (symbol?: string) => {
  return useQuery({
    queryKey: aiKeys.analysis(symbol),
    queryFn: () => aiService.getMarketAnalysis(symbol),
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
};

// Portfolio insights hook
export const usePortfolioInsights = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: aiKeys.insights(user?.id || ''),
    queryFn: () => aiService.getPortfolioInsights(user?.id || ''),
    enabled: !!user?.id,
    staleTime: 30 * 60 * 1000,
  });
};

// Generate portfolio advice mutation
export const useGenerateAdvice = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (portfolioId: string) => 
      aiService.generatePortfolioAdvice(portfolioId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aiKeys.insights(user?.id || '') });
    },
  });
};