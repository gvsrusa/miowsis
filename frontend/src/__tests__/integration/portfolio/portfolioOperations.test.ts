/**
 * Portfolio Operations Integration Tests
 * End-to-end tests for portfolio view, buy, sell, and rebalance operations
 */

import { portfolioService } from '@/services/api/portfolioService';
import { tradingService } from '@/services/api/tradingService';
import { store } from '@/store';
import {
  setPortfolio,
  setHoldings,
  updateHolding,
  setLoading,
  setError
} from '@/store/slices/portfolioSlice';
import {
  setupTestEnvironment,
  cleanupTestEnvironment,
  TEST_TOKENS,
  waitForAsync
} from '../utils/testSetup';
import { createMockAxios } from '../utils/mockHandlers';

// Mock axios
jest.mock('axios');
import axios from 'axios';

describe('Portfolio Operations Integration Tests', () => {
  let mockAxios: any;
  const TEST_USER_ID = 'user-123';

  beforeAll(() => {
    setupTestEnvironment();
  });

  afterAll(() => {
    cleanupTestEnvironment();
  });

  beforeEach(() => {
    mockAxios = createMockAxios();
    (axios as any) = mockAxios;
    (axios.create as any) = jest.fn(() => mockAxios);

    // Setup authenticated state
    localStorage.setItem('accessToken', TEST_TOKENS.validAccessToken);
    
    // Clear Redux store
    store.dispatch(setPortfolio(null));
    store.dispatch(setHoldings([]));
    store.dispatch(setError(null));
  });

  describe('Portfolio View Operations', () => {
    it('should fetch portfolio summary successfully', async () => {
      // Act
      const portfolio = await portfolioService.getPortfolio(TEST_USER_ID);

      // Assert
      expect(portfolio).toEqual({
        id: 'portfolio-123',
        userId: TEST_USER_ID,
        name: 'Test Portfolio',
        totalValue: 10000.00,
        cashBalance: 1000.00,
        totalReturn: 500.00,
        totalReturnPercentage: 5.26,
        dayChange: 50.00,
        dayChangePercentage: 0.53,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-15T00:00:00Z'
      });

      expect(mockAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'GET',
          url: `/api/portfolio/portfolios/${TEST_USER_ID}`
        })
      );
    });

    it('should fetch portfolio holdings with pagination', async () => {
      // Act
      const holdings = await portfolioService.getHoldings(TEST_USER_ID, 0, 20);

      // Assert
      expect(holdings).toEqual({
        content: [
          {
            id: 'holding-1',
            symbol: 'AAPL',
            companyName: 'Apple Inc.',
            quantity: 10,
            avgCostBasis: 150.00,
            currentPrice: 180.00,
            marketValue: 1800.00,
            gainLoss: 300.00,
            gainLossPercentage: 20.00,
            esgScore: 85
          },
          {
            id: 'holding-2',
            symbol: 'MSFT',
            companyName: 'Microsoft Corporation',
            quantity: 5,
            avgCostBasis: 300.00,
            currentPrice: 350.00,
            marketValue: 1750.00,
            gainLoss: 250.00,
            gainLossPercentage: 16.67,
            esgScore: 90
          }
        ],
        totalElements: 2,
        totalPages: 1,
        number: 0,
        size: 20
      });

      expect(mockAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'GET',
          url: `/api/portfolio/portfolios/${TEST_USER_ID}/holdings`,
          params: { page: 0, size: 20 }
        })
      );
    });

    it('should fetch portfolio performance metrics', async () => {
      // Setup performance mock
      mockAxios = createMockAxios({
        'GET /api/portfolio/portfolios/user-123/performance': () => ({
          status: 200,
          data: {
            period: '1M',
            startValue: 9500.00,
            endValue: 10000.00,
            absoluteReturn: 500.00,
            percentageReturn: 5.26,
            benchmarkReturn: 3.50,
            alpha: 1.76,
            volatility: 12.5,
            sharpeRatio: 1.25,
            dataPoints: [
              { date: '2024-01-01', value: 9500 },
              { date: '2024-01-15', value: 9750 },
              { date: '2024-01-31', value: 10000 }
            ]
          }
        })
      });
      (axios as any) = mockAxios;
      (axios.create as any) = jest.fn(() => mockAxios);

      // Act
      const performance = await portfolioService.getPerformance(TEST_USER_ID, '1M');

      // Assert
      expect(performance).toEqual(
        expect.objectContaining({
          period: '1M',
          startValue: 9500.00,
          endValue: 10000.00,
          absoluteReturn: 500.00,
          percentageReturn: 5.26
        })
      );
    });

    it('should handle errors when fetching portfolio data', async () => {
      // Setup error mock
      mockAxios = createMockAxios({
        'GET /api/portfolio/portfolios/user-123': () => ({
          status: 500,
          error: {
            code: 'SERVER_ERROR',
            message: 'Failed to fetch portfolio data'
          }
        })
      });
      (axios as any) = mockAxios;
      (axios.create as any) = jest.fn(() => mockAxios);

      // Act & Assert
      await expect(
        portfolioService.getPortfolio(TEST_USER_ID)
      ).rejects.toMatchObject({
        response: {
          status: 500,
          data: {
            error: {
              code: 'SERVER_ERROR'
            }
          }
        }
      });
    });
  });

  describe('Buy Operations', () => {
    it('should execute market buy order successfully', async () => {
      const buyOrder = {
        symbol: 'AAPL',
        quantity: 5,
        orderType: 'MARKET' as const
      };

      // Act
      const transaction = await portfolioService.buySecurities(TEST_USER_ID, buyOrder);

      // Assert
      expect(transaction).toEqual({
        id: 'transaction-new',
        type: 'BUY',
        symbol: 'AAPL',
        quantity: 5,
        price: 180.00,
        totalAmount: 900.00,
        commission: 0,
        orderType: 'MARKET',
        status: 'COMPLETED',
        executedAt: expect.any(String)
      });

      expect(mockAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          url: `/api/portfolio/portfolios/${TEST_USER_ID}/buy`,
          data: buyOrder
        })
      );
    });

    it('should execute limit buy order successfully', async () => {
      const buyOrder = {
        symbol: 'MSFT',
        quantity: 10,
        orderType: 'LIMIT' as const,
        limitPrice: 345.00
      };

      // Setup limit order mock
      mockAxios = createMockAxios({
        'POST /api/portfolio/portfolios/user-123/buy': (config) => ({
          status: 201,
          data: {
            id: 'transaction-limit',
            type: 'BUY',
            symbol: config.data.symbol,
            quantity: config.data.quantity,
            price: config.data.limitPrice,
            totalAmount: config.data.quantity * config.data.limitPrice,
            commission: 0,
            orderType: 'LIMIT',
            status: 'PENDING',
            createdAt: new Date().toISOString()
          }
        })
      });
      (axios as any) = mockAxios;
      (axios.create as any) = jest.fn(() => mockAxios);

      // Act
      const transaction = await portfolioService.buySecurities(TEST_USER_ID, buyOrder);

      // Assert
      expect(transaction).toEqual(
        expect.objectContaining({
          orderType: 'LIMIT',
          price: 345.00,
          status: 'PENDING'
        })
      );
    });

    it('should handle insufficient funds error', async () => {
      // Setup insufficient funds mock
      mockAxios = createMockAxios({
        'POST /api/portfolio/portfolios/user-123/buy': () => ({
          status: 400,
          error: {
            code: 'INSUFFICIENT_FUNDS',
            message: 'Insufficient funds to complete the transaction',
            details: {
              required: 5000.00,
              available: 1000.00
            }
          }
        })
      });
      (axios as any) = mockAxios;
      (axios.create as any) = jest.fn(() => mockAxios);

      // Act & Assert
      await expect(
        portfolioService.buySecurities(TEST_USER_ID, {
          symbol: 'AAPL',
          quantity: 25,
          orderType: 'MARKET'
        })
      ).rejects.toMatchObject({
        response: {
          status: 400,
          data: {
            error: {
              code: 'INSUFFICIENT_FUNDS'
            }
          }
        }
      });
    });
  });

  describe('Sell Operations', () => {
    it('should execute market sell order successfully', async () => {
      const sellOrder = {
        symbol: 'AAPL',
        quantity: 3,
        orderType: 'MARKET' as const
      };

      // Act
      const transaction = await portfolioService.sellSecurities(TEST_USER_ID, sellOrder);

      // Assert
      expect(transaction).toEqual({
        id: 'transaction-sell',
        type: 'SELL',
        symbol: 'AAPL',
        quantity: 3,
        price: 180.00,
        totalAmount: 540.00,
        commission: 0,
        status: 'COMPLETED',
        executedAt: expect.any(String)
      });
    });

    it('should handle insufficient shares error', async () => {
      // Setup insufficient shares mock
      mockAxios = createMockAxios({
        'POST /api/portfolio/portfolios/user-123/sell': () => ({
          status: 400,
          error: {
            code: 'INSUFFICIENT_SHARES',
            message: 'Insufficient shares to complete the transaction',
            details: {
              requested: 20,
              available: 10
            }
          }
        })
      });
      (axios as any) = mockAxios;
      (axios.create as any) = jest.fn(() => mockAxios);

      // Act & Assert
      await expect(
        portfolioService.sellSecurities(TEST_USER_ID, {
          symbol: 'AAPL',
          quantity: 20,
          orderType: 'MARKET'
        })
      ).rejects.toMatchObject({
        response: {
          status: 400,
          data: {
            error: {
              code: 'INSUFFICIENT_SHARES'
            }
          }
        }
      });
    });

    it('should execute stop-loss sell order', async () => {
      const sellOrder = {
        symbol: 'MSFT',
        quantity: 2,
        orderType: 'STOP_LOSS' as const,
        stopPrice: 340.00
      };

      // Setup stop-loss mock
      mockAxios = createMockAxios({
        'POST /api/portfolio/portfolios/user-123/sell': (config) => ({
          status: 201,
          data: {
            id: 'transaction-stop-loss',
            type: 'SELL',
            symbol: config.data.symbol,
            quantity: config.data.quantity,
            orderType: 'STOP_LOSS',
            stopPrice: config.data.stopPrice,
            status: 'PENDING',
            createdAt: new Date().toISOString()
          }
        })
      });
      (axios as any) = mockAxios;
      (axios.create as any) = jest.fn(() => mockAxios);

      // Act
      const transaction = await portfolioService.sellSecurities(TEST_USER_ID, sellOrder);

      // Assert
      expect(transaction).toEqual(
        expect.objectContaining({
          orderType: 'STOP_LOSS',
          stopPrice: 340.00,
          status: 'PENDING'
        })
      );
    });
  });

  describe('Rebalance Operations', () => {
    it('should calculate and execute portfolio rebalancing', async () => {
      const rebalanceRequest = {
        targetAllocation: [
          { symbol: 'AAPL', percentage: 50 },
          { symbol: 'MSFT', percentage: 50 }
        ]
      };

      // Act
      const result = await portfolioService.rebalancePortfolio(TEST_USER_ID, rebalanceRequest);

      // Assert
      expect(result).toEqual({
        currentAllocation: [
          { symbol: 'AAPL', percentage: 60 },
          { symbol: 'MSFT', percentage: 40 }
        ],
        targetAllocation: [
          { symbol: 'AAPL', percentage: 50 },
          { symbol: 'MSFT', percentage: 50 }
        ],
        transactions: [
          {
            type: 'SELL',
            symbol: 'AAPL',
            quantity: 2,
            estimatedPrice: 180.00
          },
          {
            type: 'BUY',
            symbol: 'MSFT',
            quantity: 1,
            estimatedPrice: 350.00
          }
        ],
        estimatedCost: 10.00
      });

      expect(mockAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          url: `/api/portfolio/portfolios/${TEST_USER_ID}/rebalance`,
          data: rebalanceRequest
        })
      );
    });

    it('should handle rebalance with no changes needed', async () => {
      // Setup no rebalance needed mock
      mockAxios = createMockAxios({
        'POST /api/portfolio/portfolios/user-123/rebalance': () => ({
          status: 200,
          data: {
            currentAllocation: [
              { symbol: 'AAPL', percentage: 50.5 },
              { symbol: 'MSFT', percentage: 49.5 }
            ],
            targetAllocation: [
              { symbol: 'AAPL', percentage: 50 },
              { symbol: 'MSFT', percentage: 50 }
            ],
            transactions: [],
            estimatedCost: 0,
            message: 'Portfolio is already balanced within threshold'
          }
        })
      });
      (axios as any) = mockAxios;
      (axios.create as any) = jest.fn(() => mockAxios);

      // Act
      const result = await portfolioService.rebalancePortfolio(TEST_USER_ID, {
        targetAllocation: [
          { symbol: 'AAPL', percentage: 50 },
          { symbol: 'MSFT', percentage: 50 }
        ]
      });

      // Assert
      expect(result.transactions).toHaveLength(0);
      expect(result.estimatedCost).toBe(0);
    });

    it('should simulate rebalancing before execution', async () => {
      // This test shows the two-step rebalancing process
      const rebalanceRequest = {
        targetAllocation: [
          { symbol: 'AAPL', percentage: 40 },
          { symbol: 'MSFT', percentage: 40 },
          { symbol: 'GOOGL', percentage: 20 }
        ]
      };

      // Setup simulation mock
      mockAxios = createMockAxios({
        'POST /api/portfolio/portfolios/user-123/rebalance': (config) => {
          if (config.data.simulate) {
            return {
              status: 200,
              data: {
                currentAllocation: [
                  { symbol: 'AAPL', percentage: 60 },
                  { symbol: 'MSFT', percentage: 40 }
                ],
                targetAllocation: config.data.targetAllocations,
                transactions: [
                  { type: 'SELL', symbol: 'AAPL', quantity: 5, estimatedPrice: 180.00 },
                  { type: 'BUY', symbol: 'GOOGL', quantity: 2, estimatedPrice: 140.00 }
                ],
                estimatedCost: 15.00,
                simulationOnly: true
              }
            };
          }
          return {
            status: 200,
            data: {
              // Actual execution result
              transactions: [
                { type: 'SELL', symbol: 'AAPL', quantity: 5, price: 179.50, status: 'COMPLETED' },
                { type: 'BUY', symbol: 'GOOGL', quantity: 2, price: 140.25, status: 'COMPLETED' }
              ],
              totalCost: 14.75,
              simulationOnly: false
            }
          };
        }
      });
      (axios as any) = mockAxios;
      (axios.create as any) = jest.fn(() => mockAxios);

      // Act - Simulate rebalancing
      const result = await portfolioService.rebalancePortfolio(TEST_USER_ID, rebalanceRequest);
      
      expect(result.transactions).toHaveLength(2);
      expect(result.estimatedCost).toBe(15.00);
    });
  });

  describe('Transaction History', () => {
    it('should fetch transaction history with filters', async () => {
      // Setup transaction history mock
      mockAxios = createMockAxios({
        'GET /api/portfolio/portfolios/user-123/transactions': () => ({
          status: 200,
          data: {
            content: [
              {
                id: 'tx-1',
                type: 'BUY',
                symbol: 'AAPL',
                quantity: 10,
                price: 150.00,
                totalAmount: 1500.00,
                executedAt: '2024-01-01T10:00:00Z'
              },
              {
                id: 'tx-2',
                type: 'SELL',
                symbol: 'MSFT',
                quantity: 5,
                price: 320.00,
                totalAmount: 1600.00,
                executedAt: '2024-01-02T10:00:00Z'
              }
            ],
            totalElements: 2,
            totalPages: 1,
            number: 0,
            size: 20
          }
        })
      });
      (axios as any) = mockAxios;
      (axios.create as any) = jest.fn(() => mockAxios);

      // Act
      const transactions = await portfolioService.getTransactions(TEST_USER_ID, {
        type: 'BUY',
        symbol: 'AAPL',
        page: 0,
        size: 10
      });

      // Assert
      expect(transactions.content).toHaveLength(2);
      expect(mockAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'GET',
          url: `/api/portfolio/portfolios/${TEST_USER_ID}/transactions`,
          params: {
            type: 'BUY',
            symbol: 'AAPL',
            page: 0,
            size: 10
          }
        })
      );
    });
  });

  describe('Round-Up Operations', () => {
    it('should process round-up investments', async () => {
      const roundUpRequest = {
        transactionAmount: 4.75,
        roundUpAmount: 0.25,
        investmentStrategy: 'BALANCED' as const
      };

      // Setup round-up mock
      mockAxios = createMockAxios({
        'POST /api/portfolio/portfolios/user-123/round-up': () => ({
          status: 201,
          data: {
            id: 'round-up-tx',
            type: 'BUY',
            symbol: 'VOO', // S&P 500 ETF for balanced strategy
            quantity: 0.001,
            price: 450.00,
            totalAmount: 0.25,
            source: 'ROUND_UP',
            status: 'COMPLETED'
          }
        })
      });
      (axios as any) = mockAxios;
      (axios.create as any) = jest.fn(() => mockAxios);

      // Act
      const transaction = await portfolioService.processRoundUp(TEST_USER_ID, roundUpRequest);

      // Assert
      expect(transaction).toEqual(
        expect.objectContaining({
          totalAmount: 0.25,
          symbol: 'VOO'
        })
      );
    });
  });
});