/**
 * API Types and Interfaces
 * Shared types for API requests and responses
 */

// Common types
export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  timestamp: string;
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: UserDto;
}

export interface UserDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  profileImage?: string;
  emailVerified: boolean;
  kycStatus: 'pending' | 'verified' | 'rejected';
  onboardingComplete: boolean;
  biometricEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

// Portfolio types
export interface PortfolioDto {
  id: string;
  userId: string;
  totalValue: number;
  totalCost: number;
  totalReturn: number;
  totalReturnPercentage: number;
  dayChange: number;
  dayChangePercentage: number;
  holdings: HoldingDto[];
  averageEsgScore?: number;
  createdAt: string;
  updatedAt: string;
}

export interface HoldingDto {
  id: string;
  symbol: string;
  name: string;
  securityName?: string;
  quantity: number;
  averageCost: number;
  currentPrice: number;
  marketValue: number;
  currentValue?: number;
  totalCost?: number;
  totalReturn: number;
  returnPercentage: number;
  dayChange: number;
  dayChangePercentage: number;
  assetType: 'STOCK' | 'ETF' | 'CRYPTO' | 'BOND';
  esgScore?: number;
}

export interface TransactionDto {
  id: string;
  portfolioId: string;
  symbol: string;
  securityName?: string;
  description?: string;
  type: 'BUY' | 'SELL' | 'DIVIDEND' | 'ROUND_UP' | 'DEPOSIT' | 'WITHDRAWAL' | 'FEE' | 'RECURRING';
  quantity?: number;
  price?: number;
  amount: number;
  totalAmount?: number;
  fees?: number;
  esgScore?: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  transactionDate: string;
  executedAt?: string;
  createdAt: string;
}

export interface BuyOrderRequest {
  symbol: string;
  quantity?: number;
  amount?: number;
  orderType: 'MARKET' | 'LIMIT';
  limitPrice?: number;
}

export interface SellOrderRequest {
  symbol: string;
  quantity: number;
  orderType: 'MARKET' | 'LIMIT' | 'STOP_LOSS';
  limitPrice?: number;
  stopPrice?: number;
}

export interface RebalanceRequest {
  targetAllocation: Array<{
    symbol: string;
    percentage: number;
  }>;
  executionType?: 'IMMEDIATE' | 'GRADUAL';
}

export interface RebalanceResultDto {
  currentAllocation: Array<{
    symbol: string;
    percentage: number;
  }>;
  targetAllocation: Array<{
    symbol: string;
    percentage: number;
  }>;
  transactions: Array<{
    type: 'BUY' | 'SELL';
    symbol: string;
    quantity: number;
    estimatedPrice: number;
  }>;
  estimatedCost: number;
  adjustments?: Array<{
    symbol: string;
    currentPercentage: number;
    targetPercentage: number;
    action: 'BUY' | 'SELL' | 'HOLD';
    quantity: number;
    estimatedCost: number;
  }>;
  totalCost?: number;
  estimatedFees?: number;
}

export interface PortfolioPerformanceDto {
  period: string;
  startValue: number;
  endValue: number;
  totalReturn: number;
  totalReturnPercentage: number;
  annualizedReturn: number;
  volatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  performanceData: Array<{
    date: string;
    value: number;
    dailyReturn: number;
  }>;
  history?: Array<{
    date: string;
    value: number;
    dailyReturn?: number;
  }>;
  dailyChange?: number | { amount: number; percentage: number };
  monthlyReturn?: number | { amount: number; percentage: number };
}

export interface PortfolioAllocationDto {
  byAssetType: Array<{
    type: string;
    value: number;
    percentage: number;
  }>;
  bySector: Array<{
    sector: string;
    value: number;
    percentage: number;
  }>;
  byRegion: Array<{
    region: string;
    value: number;
    percentage: number;
  }>;
  sectorBreakdown?: Array<{
    name: string;
    percentage: number;
  }>;
}

export interface RoundUpRequest {
  transactionAmount: number;
  roundUpAmount: number;
  investmentStrategy: 'BALANCED' | 'AGGRESSIVE' | 'CONSERVATIVE' | 'ESG_FOCUSED';
}

// ESG types
export interface ESGScoreDto {
  companyId: string;
  companyName: string;
  symbol: string;
  overallScore: number;
  totalScore?: number;
  environmentalScore: number;
  socialScore: number;
  governanceScore: number;
  monthlyChange?: number;
  lastUpdated: string;
  trend: 'IMPROVING' | 'STABLE' | 'DECLINING';
}

export interface ESGImpactDto {
  portfolioId: string;
  overallImpactScore: number;
  carbonFootprint: number;
  socialImpact: number;
  governanceRating: number;
  improvements: string[];
  recommendations: string[];
}

// AI types
export interface ChatRequest {
  message: string;
  context?: Record<string, any>;
}

export interface ChatResponse {
  id?: string;
  message: string;
  response: string;
  conversationId: string;
  timestamp: string;
  suggestions?: string[];
  context?: Record<string, any>;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface ChatSession {
  id: string;
  userId: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface AIInsightDto {
  id: string;
  type: 'MARKET' | 'PORTFOLIO' | 'ESG' | 'PERSONAL';
  title: string;
  description: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  actionable: boolean;
  actions?: Array<{
    type: string;
    label: string;
    data: any;
  }>;
  createdAt: string;
}

export interface InvestmentRecommendation {
  id: string;
  symbol: string;
  name: string;
  action: 'BUY' | 'SELL' | 'HOLD';
  reason: string;
  confidence: number;
  expectedReturn?: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  timeHorizon: string;
}

export interface MarketAnalysis {
  id: string;
  symbol?: string;
  title: string;
  summary: string;
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  keyFactors: string[];
  risks: string[];
  opportunities: string[];
  createdAt: string;
}

export interface PortfolioInsight {
  id: string;
  portfolioId: string;
  type: 'PERFORMANCE' | 'RISK' | 'OPPORTUNITY' | 'ESG';
  title: string;
  description: string;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  recommendations: string[];
  metrics?: Record<string, any>;
  createdAt: string;
}

// News types
export interface NewsArticleDto {
  id: string;
  title: string;
  summary: string;
  content?: string;
  source: string;
  url: string;
  publishedAt: string;
  author?: string;
  category?: string;
  tags?: string[];
  sentiment?: string;
  image?: string;
}

// Trading types
export interface MarketDataDto {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercentage: number;
  volume: number;
  marketCap: number;
  dayHigh: number;
  dayLow: number;
  yearHigh: number;
  yearLow: number;
  timestamp: string;
}

export interface QuoteDto {
  symbol: string;
  bid: number;
  ask: number;
  last: number;
  volume: number;
  timestamp: string;
}

// Banking types
export interface BankAccountDto {
  id: string;
  institutionName: string;
  accountName: string;
  accountType: 'CHECKING' | 'SAVINGS' | 'CREDIT';
  accountNumber: string; // Masked
  balance: number;
  currency: string;
  isActive: boolean;
  lastSynced: string;
}

export interface BankTransactionDto {
  id: string;
  accountId: string;
  amount: number;
  description: string;
  category: string;
  date: string;
  pending: boolean;
  merchantName?: string;
  location?: string;
}

// Notification types
export interface NotificationDto {
  id: string;
  userId: string;
  type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS' | 'TRADE' | 'PORTFOLIO' | 'SYSTEM';
  title: string;
  message: string;
  read: boolean;
  actionUrl?: string;
  createdAt: string;
}

export interface NotificationPreferencesDto {
  email: boolean;
  push: boolean;
  sms: boolean;
  tradeAlerts: boolean;
  priceAlerts: boolean;
  portfolioUpdates: boolean;
  marketNews: boolean;
  systemNotifications: boolean;
}