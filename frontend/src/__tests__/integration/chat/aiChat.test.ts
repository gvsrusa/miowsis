/**
 * AI Chat Integration Tests
 * End-to-end tests for AI chat functionality including streaming responses
 */

import { aiService } from '@/services/api/aiService';
import { store } from '@/store';
import {
  addMessage,
  setLoading,
  setError,
  clearMessages,
  updateLastMessage
} from '@/store/slices/chatSlice';
import {
  setupTestEnvironment,
  cleanupTestEnvironment,
  TEST_TOKENS,
  waitForAsync
} from '../utils/testSetup';
import { createMockAxios, createMockSSE } from '../utils/mockHandlers';

// Mock axios and fetch
jest.mock('axios');
import axios from 'axios';

// Mock fetch for SSE
global.fetch = jest.fn();

describe('AI Chat Integration Tests', () => {
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
    store.dispatch(clearMessages());
    store.dispatch(setError(null));

    // Reset fetch mock
    (global.fetch as jest.Mock).mockReset();
  });

  describe('Basic Chat Operations', () => {
    it('should send chat message and receive response', async () => {
      const chatRequest = {
        message: 'What are the best ESG stocks to invest in?',
        context: {
          portfolioId: 'portfolio-123',
          includeHoldings: true
        }
      };

      // Act
      const response = await aiService.chat(chatRequest);

      // Assert
      expect(response).toEqual({
        id: 'chat-response-1',
        message: chatRequest.message,
        response: `AI response to: ${chatRequest.message}`,
        timestamp: expect.any(String)
      });

      expect(mockAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          url: '/api/ai/chat',
          data: chatRequest
        })
      );
    });

    it('should handle chat errors gracefully', async () => {
      // Setup error mock
      mockAxios = createMockAxios({
        'POST /api/ai/chat': () => ({
          status: 500,
          error: {
            code: 'AI_SERVICE_ERROR',
            message: 'AI service temporarily unavailable'
          }
        })
      });
      (axios as any) = mockAxios;
      (axios.create as any) = jest.fn(() => mockAxios);

      // Act & Assert
      await expect(
        aiService.chat({
          message: 'Test message',
          context: {}
        })
      ).rejects.toMatchObject({
        response: {
          status: 500,
          data: {
            error: {
              code: 'AI_SERVICE_ERROR'
            }
          }
        }
      });
    });

    it('should maintain chat history in Redux store', async () => {
      // Add user message to store
      store.dispatch(addMessage({
        id: 'msg-1',
        role: 'user',
        content: 'What is my portfolio performance?',
        timestamp: new Date()
      }));

      // Simulate AI response
      const aiResponse = {
        id: 'chat-response-2',
        message: 'What is my portfolio performance?',
        response: 'Your portfolio has gained 5.26% over the past month.',
        timestamp: new Date().toISOString()
      };

      // Add AI response to store
      store.dispatch(addMessage({
        id: 'msg-2',
        role: 'assistant',
        content: aiResponse.response,
        timestamp: new Date(aiResponse.timestamp)
      }));

      // Assert
      const state = store.getState().chat;
      expect(state.messages).toHaveLength(2);
      expect(state.messages[0].role).toBe('user');
      expect(state.messages[1].role).toBe('assistant');
    });
  });

  describe('Streaming Chat Operations', () => {
    it('should handle streaming responses correctly', async () => {
      const chunks = [
        'Based on your portfolio analysis, ',
        'I recommend diversifying into ESG-focused ETFs.'
      ];

      // Mock fetch for SSE
      (global.fetch as jest.Mock).mockResolvedValueOnce(createMockSSE(chunks));

      const receivedChunks: string[] = [];
      
      // Act
      await aiService.streamChat(
        {
          message: 'Analyze my portfolio',
          context: { portfolioId: 'portfolio-123' }
        },
        (chunk) => {
          receivedChunks.push(chunk);
        }
      );

      // Assert
      expect(receivedChunks).toEqual(chunks);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/ai/chat/stream',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: `Bearer ${TEST_TOKENS.validAccessToken}`
          }),
          body: JSON.stringify({
            message: 'Analyze my portfolio',
            context: { portfolioId: 'portfolio-123' }
          })
        })
      );
    });

    it('should handle streaming errors', async () => {
      // Mock fetch to return error
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      // Act & Assert
      await expect(
        aiService.streamChat(
          { message: 'Test', context: {} },
          () => {}
        )
      ).rejects.toThrow('HTTP error! status: 500');
    });

    it('should handle malformed SSE data', async () => {
      // Mock SSE with malformed data
      const mockSSE = {
        body: {
          getReader: () => ({
            read: jest.fn()
              .mockResolvedValueOnce({ 
                done: false, 
                value: new TextEncoder().encode('data: invalid-json\n\n') 
              })
              .mockResolvedValueOnce({ 
                done: false, 
                value: new TextEncoder().encode('data: {"content": "valid chunk"}\n\n') 
              })
              .mockResolvedValueOnce({ 
                done: false, 
                value: new TextEncoder().encode('data: [DONE]\n\n') 
              })
              .mockResolvedValueOnce({ done: true }),
            releaseLock: jest.fn()
          })
        },
        ok: true,
        status: 200
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce(mockSSE);

      const receivedChunks: string[] = [];
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act
      await aiService.streamChat(
        { message: 'Test', context: {} },
        (chunk) => receivedChunks.push(chunk)
      );

      // Assert
      expect(receivedChunks).toEqual(['valid chunk']); // Only valid chunk received
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to parse SSE data:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('should update message progressively during streaming', async () => {
      const chunks = ['Analyzing... ', 'Found 3 opportunities.'];
      
      (global.fetch as jest.Mock).mockResolvedValueOnce(createMockSSE(chunks));

      // Add initial message
      store.dispatch(addMessage({
        id: 'msg-streaming',
        role: 'assistant',
        content: '',
        timestamp: new Date()
      }));

      // Act - simulate streaming updates
      await aiService.streamChat(
        { message: 'Find opportunities', context: {} },
        (chunk) => {
          const currentState = store.getState().chat;
          const lastMessage = currentState.messages[currentState.messages.length - 1];
          store.dispatch(updateLastMessage({
            ...lastMessage,
            content: lastMessage.content + chunk
          }));
        }
      );

      // Assert
      const finalState = store.getState().chat;
      const lastMessage = finalState.messages[finalState.messages.length - 1];
      expect(lastMessage.content).toBe('Analyzing... Found 3 opportunities.');
    });
  });

  describe('AI Insights and Recommendations', () => {
    it('should fetch AI insights for user', async () => {
      // Setup insights mock
      mockAxios = createMockAxios({
        'GET /api/ai/insights': () => ({
          status: 200,
          data: [
            {
              id: 'insight-1',
              type: 'PORTFOLIO_OPTIMIZATION',
              title: 'Rebalancing Opportunity',
              description: 'Your tech allocation is 15% above target',
              priority: 'HIGH',
              actionable: true,
              createdAt: '2024-01-15T10:00:00Z'
            },
            {
              id: 'insight-2',
              type: 'ESG_IMPROVEMENT',
              title: 'ESG Score Enhancement',
              description: 'Adding renewable energy stocks could improve your ESG score',
              priority: 'MEDIUM',
              actionable: true,
              createdAt: '2024-01-15T09:00:00Z'
            }
          ]
        })
      });
      (axios as any) = mockAxios;
      (axios.create as any) = jest.fn(() => mockAxios);

      // Act
      const insights = await aiService.getInsights(TEST_USER_ID, {
        type: 'PORTFOLIO_OPTIMIZATION',
        limit: 5
      });

      // Assert
      expect(insights).toHaveLength(2);
      expect(insights[0]).toEqual(
        expect.objectContaining({
          type: 'PORTFOLIO_OPTIMIZATION',
          priority: 'HIGH',
          actionable: true
        })
      );

      expect(mockAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'GET',
          url: '/api/ai/insights',
          params: {
            userId: TEST_USER_ID,
            type: 'PORTFOLIO_OPTIMIZATION',
            limit: 5
          }
        })
      );
    });

    it('should get AI recommendations based on context', async () => {
      const recommendationRequest = {
        context: 'INVESTMENT' as const,
        portfolioId: 'portfolio-123',
        preferences: {
          riskTolerance: 'MODERATE',
          investmentHorizon: '5_YEARS',
          focusAreas: ['ESG', 'TECHNOLOGY']
        }
      };

      // Setup recommendations mock
      mockAxios = createMockAxios({
        'POST /api/ai/recommendations': () => ({
          status: 200,
          data: {
            recommendations: [
              {
                id: 'rec-1',
                title: 'Invest in Clean Energy ETF',
                description: 'Consider adding ICLN for ESG exposure',
                expectedReturn: 12.5,
                riskLevel: 'MEDIUM',
                timeHorizon: '3-5 years',
                actions: [
                  {
                    type: 'BUY',
                    symbol: 'ICLN',
                    quantity: 50,
                    reason: 'Diversify into renewable energy sector'
                  }
                ]
              },
              {
                id: 'rec-2',
                title: 'Rebalance Tech Holdings',
                description: 'Reduce overexposure to large-cap tech',
                expectedReturn: 8.0,
                riskLevel: 'LOW',
                timeHorizon: '1-2 years',
                actions: [
                  {
                    type: 'SELL',
                    symbol: 'AAPL',
                    quantity: 5,
                    reason: 'Take profits and reduce concentration risk'
                  },
                  {
                    type: 'BUY',
                    symbol: 'VTI',
                    quantity: 10,
                    reason: 'Increase market diversification'
                  }
                ]
              }
            ]
          }
        })
      });
      (axios as any) = mockAxios;
      (axios.create as any) = jest.fn(() => mockAxios);

      // Act
      const recommendations = await aiService.getRecommendations(recommendationRequest);

      // Assert
      expect(recommendations.recommendations).toHaveLength(2);
      expect(recommendations.recommendations[0]).toEqual(
        expect.objectContaining({
          title: 'Invest in Clean Energy ETF',
          riskLevel: 'MEDIUM',
          actions: expect.arrayContaining([
            expect.objectContaining({
              type: 'BUY',
              symbol: 'ICLN'
            })
          ])
        })
      );
    });

    it('should analyze portfolio with AI', async () => {
      const analysisRequest = {
        type: 'PORTFOLIO' as const,
        data: {
          portfolioId: 'portfolio-123',
          holdings: ['AAPL', 'MSFT', 'GOOGL']
        },
        depth: 'COMPREHENSIVE' as const
      };

      // Setup analysis mock
      mockAxios = createMockAxios({
        'POST /api/ai/analysis': () => ({
          status: 200,
          data: {
            summary: 'Your portfolio shows strong performance with tech concentration',
            insights: [
              'Tech sector represents 80% of holdings',
              'Portfolio beta is 1.2, indicating higher volatility than market',
              'ESG score could be improved with sustainable investments'
            ],
            recommendations: [
              {
                action: 'Diversify into other sectors',
                reason: 'Reduce sector concentration risk',
                priority: 'HIGH'
              },
              {
                action: 'Add defensive stocks',
                reason: 'Balance portfolio volatility',
                priority: 'MEDIUM'
              }
            ],
            risks: [
              'High concentration in technology sector',
              'Limited international exposure'
            ],
            opportunities: [
              'Emerging markets expansion',
              'Green technology investments',
              'Healthcare sector growth'
            ]
          }
        })
      });
      (axios as any) = mockAxios;
      (axios.create as any) = jest.fn(() => mockAxios);

      // Act
      const analysis = await aiService.analyze(analysisRequest);

      // Assert
      expect(analysis).toEqual(
        expect.objectContaining({
          summary: expect.stringContaining('tech concentration'),
          insights: expect.arrayContaining([
            expect.stringContaining('80% of holdings')
          ]),
          recommendations: expect.arrayContaining([
            expect.objectContaining({
              priority: 'HIGH'
            })
          ])
        })
      );
    });
  });

  describe('Context-Aware Chat', () => {
    it('should include portfolio context in chat requests', async () => {
      const chatRequest = {
        message: 'How can I improve my ESG score?',
        context: {
          portfolioId: 'portfolio-123',
          includeHoldings: true,
          includePerformance: true,
          timeframe: '1M'
        }
      };

      // Setup context-aware mock
      mockAxios = createMockAxios({
        'POST /api/ai/chat': (config) => ({
          status: 200,
          data: {
            id: 'chat-context',
            message: config.data.message,
            response: 'Based on your current holdings (AAPL, MSFT), you can improve your ESG score by adding renewable energy ETFs like ICLN or sustainable companies like TSLA.',
            context: config.data.context,
            timestamp: new Date().toISOString()
          }
        })
      });
      (axios as any) = mockAxios;
      (axios.create as any) = jest.fn(() => mockAxios);

      // Act
      const response = await aiService.chat(chatRequest);

      // Assert
      expect(response.response).toContain('AAPL, MSFT');
      expect(response.response).toContain('renewable energy ETFs');
      expect(response.context).toEqual(chatRequest.context);
    });

    it('should handle rate limiting gracefully', async () => {
      // Setup rate limit mock
      mockAxios = createMockAxios({
        'POST /api/ai/chat': () => ({
          status: 429,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests. Please try again in 60 seconds.',
            details: {
              retryAfter: 60,
              limit: 100,
              remaining: 0
            }
          }
        })
      });
      (axios as any) = mockAxios;
      (axios.create as any) = jest.fn(() => mockAxios);

      // Act & Assert
      await expect(
        aiService.chat({
          message: 'Test message',
          context: {}
        })
      ).rejects.toMatchObject({
        response: {
          status: 429,
          data: {
            error: {
              code: 'RATE_LIMIT_EXCEEDED',
              details: {
                retryAfter: 60
              }
            }
          }
        }
      });
    });
  });
});