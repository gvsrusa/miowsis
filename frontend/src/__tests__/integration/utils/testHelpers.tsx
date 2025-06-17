/**
 * Test Helper Utilities
 * Common helper functions for integration tests
 */

import { render, RenderOptions } from '@testing-library/react';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import React, { ReactElement } from 'react';
import { Store } from '@reduxjs/toolkit';
import { createTestStore, createTestQueryClient } from './testSetup';

// Custom render function with all providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  store?: Store;
  queryClient?: QueryClient;
  initialRoute?: string;
}

export const renderWithProviders = (
  ui: ReactElement,
  {
    store = createTestStore(),
    queryClient = createTestQueryClient(),
    initialRoute = '/',
    ...renderOptions
  }: CustomRenderOptions = {}
) => {
  // Set initial route if specified
  if (initialRoute !== '/') {
    window.history.pushState({}, 'Test page', initialRoute);
  }

  const theme = createTheme();

  const AllProviders = ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <BrowserRouter>
            {children}
          </BrowserRouter>
        </ThemeProvider>
      </QueryClientProvider>
    </Provider>
  );

  return {
    ...render(ui, { wrapper: AllProviders, ...renderOptions }),
    store,
    queryClient
  };
};

// Wait for element to appear with timeout
export const waitForElement = async (
  callback: () => HTMLElement | null,
  timeout = 5000,
  interval = 100
): Promise<HTMLElement> => {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    const element = callback();
    if (element) return element;
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  throw new Error('Element not found within timeout');
};

// Mock IntersectionObserver
export const mockIntersectionObserver = () => {
  const mockIntersectionObserver = jest.fn();
  mockIntersectionObserver.mockReturnValue({
    observe: () => null,
    unobserve: () => null,
    disconnect: () => null
  });
  window.IntersectionObserver = mockIntersectionObserver as any;
};

// Mock ResizeObserver
export const mockResizeObserver = () => {
  const mockResizeObserver = jest.fn();
  mockResizeObserver.mockReturnValue({
    observe: () => null,
    unobserve: () => null,
    disconnect: () => null
  });
  window.ResizeObserver = mockResizeObserver as any;
};

// Mock window.matchMedia
export const mockMatchMedia = (matches: boolean = false) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
};

// Mock chart.js for tests
export const mockChartJS = () => {
  jest.mock('react-chartjs-2', () => ({
    Line: () => React.createElement('div', { 'data-testid': 'mock-line-chart' }),
    Bar: () => React.createElement('div', { 'data-testid': 'mock-bar-chart' }),
    Doughnut: () => React.createElement('div', { 'data-testid': 'mock-doughnut-chart' }),
    Pie: () => React.createElement('div', { 'data-testid': 'mock-pie-chart' })
  }));
};

// Mock Three.js components
export const mockThreeJS = () => {
  jest.mock('@react-three/fiber', () => ({
    Canvas: ({ children }: any) => React.createElement('div', { 'data-testid': 'mock-canvas' }, children),
    useFrame: jest.fn(),
    useThree: () => ({
      camera: {},
      gl: {},
      scene: {},
      size: { width: 800, height: 600 }
    })
  }));

  jest.mock('@react-three/drei', () => ({
    OrbitControls: () => React.createElement('div', { 'data-testid': 'mock-orbit-controls' }),
    Environment: () => React.createElement('div', { 'data-testid': 'mock-environment' }),
    Text: ({ children }: any) => React.createElement('div', { 'data-testid': 'mock-3d-text' }, children)
  }));
};

// Mock WebSocket
let mockWebSocket: any;

export const setupWebSocketMock = () => {
  mockWebSocket = {
    send: jest.fn(),
    close: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    readyState: 1,
    CONNECTING: 0,
    OPEN: 1,
    CLOSING: 2,
    CLOSED: 3
  };

  (global as any).WebSocket = jest.fn(() => mockWebSocket);
};

export const cleanupWebSocketMock = () => {
  (global as any).WebSocket = undefined;
  mockWebSocket = undefined;
};

// Create mock portfolio data
export const createMockPortfolio = (overrides = {}) => ({
  id: 'portfolio-test',
  userId: 'user-test',
  name: 'Test Portfolio',
  totalValue: 10000.00,
  cashBalance: 1000.00,
  totalReturn: 500.00,
  totalReturnPercentage: 5.26,
  dayChange: 50.00,
  dayChangePercentage: 0.53,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-15T00:00:00Z',
  ...overrides
});

// Create mock holding data
export const createMockHolding = (symbol: string, overrides = {}) => ({
  id: `holding-${symbol}`,
  symbol,
  companyName: `${symbol} Company`,
  quantity: 10,
  avgCostBasis: 100.00,
  currentPrice: 110.00,
  marketValue: 1100.00,
  gainLoss: 100.00,
  gainLossPercentage: 10.00,
  esgScore: 85,
  ...overrides
});

// Create mock transaction data
export const createMockTransaction = (type: 'BUY' | 'SELL', overrides = {}) => ({
  id: 'transaction-test',
  type,
  symbol: 'TEST',
  quantity: 5,
  price: 100.00,
  totalAmount: 500.00,
  commission: 0,
  orderType: 'MARKET',
  status: 'COMPLETED',
  executedAt: new Date().toISOString(),
  ...overrides
});

// Assert Redux action was dispatched
export const expectActionDispatched = (
  store: Store,
  actionType: string,
  payload?: any
) => {
  const actions = (store.dispatch as jest.Mock).mock.calls
    .map(call => call[0])
    .filter(action => action.type === actionType);
    
  expect(actions.length).toBeGreaterThan(0);
  
  if (payload !== undefined) {
    expect(actions[0].payload).toEqual(payload);
  }
};

// Mock WebSocket for real-time features
export class MockWebSocket {
  url: string;
  readyState: number = 0;
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  constructor(url: string) {
    this.url = url;
    setTimeout(() => {
      this.readyState = 1;
      if (this.onopen) {
        this.onopen(new Event('open'));
      }
    }, 0);
  }

  send(data: string) {
    // Mock send implementation
  }

  close() {
    this.readyState = 3;
    if (this.onclose) {
      this.onclose(new CloseEvent('close'));
    }
  }

  simulateMessage(data: any) {
    if (this.onmessage) {
      this.onmessage(new MessageEvent('message', { data: JSON.stringify(data) }));
    }
  }
}

