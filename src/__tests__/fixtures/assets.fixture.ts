export interface Asset {
  id: string
  symbol: string
  name: string
  type: 'stock' | 'etf' | 'crypto' | 'bond' | 'commodity'
  exchange: string
  currency: string
  current_price: number
  previous_close: number
  day_change: number
  day_change_percent: number
  market_cap: number | null
  volume: number
  pe_ratio: number | null
  dividend_yield: number | null
  esg_score: number | null
  sector: string | null
  industry: string | null
  logo_url: string | null
  description: string | null
  created_at: string
  updated_at: string
}

export const mockAssets: Record<string, Asset> = {
  apple: {
    id: 'asset-aapl',
    symbol: 'AAPL',
    name: 'Apple Inc.',
    type: 'stock',
    exchange: 'NASDAQ',
    currency: 'USD',
    current_price: 180.50,
    previous_close: 178.25,
    day_change: 2.25,
    day_change_percent: 1.26,
    market_cap: 2800000000000,
    volume: 58000000,
    pe_ratio: 29.5,
    dividend_yield: 0.0044,
    esg_score: 82,
    sector: 'Technology',
    industry: 'Consumer Electronics',
    logo_url: 'https://example.com/logos/aapl.png',
    description: 'Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide.',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2024-01-15T16:00:00Z'
  },
  google: {
    id: 'asset-googl',
    symbol: 'GOOGL',
    name: 'Alphabet Inc.',
    type: 'stock',
    exchange: 'NASDAQ',
    currency: 'USD',
    current_price: 3000.00,
    previous_close: 2980.50,
    day_change: 19.50,
    day_change_percent: 0.65,
    market_cap: 1900000000000,
    volume: 1200000,
    pe_ratio: 26.8,
    dividend_yield: 0,
    esg_score: 75,
    sector: 'Technology',
    industry: 'Internet Services',
    logo_url: 'https://example.com/logos/googl.png',
    description: 'Alphabet Inc. provides various products and platforms in the United States, Europe, the Middle East, Africa, the Asia-Pacific, Canada, and Latin America.',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2024-01-15T16:00:00Z'
  },
  tesla: {
    id: 'asset-tsla',
    symbol: 'TSLA',
    name: 'Tesla, Inc.',
    type: 'stock',
    exchange: 'NASDAQ',
    currency: 'USD',
    current_price: 250.75,
    previous_close: 245.30,
    day_change: 5.45,
    day_change_percent: 2.22,
    market_cap: 800000000000,
    volume: 120000000,
    pe_ratio: 68.5,
    dividend_yield: 0,
    esg_score: 88,
    sector: 'Consumer Discretionary',
    industry: 'Automobiles',
    logo_url: 'https://example.com/logos/tsla.png',
    description: 'Tesla, Inc. designs, develops, manufactures, leases, and sells electric vehicles, and energy generation and storage systems.',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2024-01-15T16:00:00Z'
  },
  vanguardSnp: {
    id: 'asset-voo',
    symbol: 'VOO',
    name: 'Vanguard S&P 500 ETF',
    type: 'etf',
    exchange: 'NYSE',
    currency: 'USD',
    current_price: 450.25,
    previous_close: 448.90,
    day_change: 1.35,
    day_change_percent: 0.30,
    market_cap: null,
    volume: 3500000,
    pe_ratio: null,
    dividend_yield: 0.0128,
    esg_score: 76,
    sector: null,
    industry: null,
    logo_url: 'https://example.com/logos/voo.png',
    description: 'The Vanguard S&P 500 ETF tracks the performance of the S&P 500 Index.',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2024-01-15T16:00:00Z'
  },
  bitcoin: {
    id: 'asset-btc',
    symbol: 'BTC',
    name: 'Bitcoin',
    type: 'crypto',
    exchange: 'CRYPTO',
    currency: 'USD',
    current_price: 42000.00,
    previous_close: 41500.00,
    day_change: 500.00,
    day_change_percent: 1.20,
    market_cap: 820000000000,
    volume: 25000000000,
    pe_ratio: null,
    dividend_yield: null,
    esg_score: null,
    sector: null,
    industry: null,
    logo_url: 'https://example.com/logos/btc.png',
    description: 'Bitcoin is a decentralized digital currency that can be transferred on the peer-to-peer bitcoin network.',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2024-01-15T16:00:00Z'
  }
}

export const createMockAsset = (overrides?: Partial<Asset>): Asset => {
  return {
    ...mockAssets.apple,
    id: `asset-${Date.now()}`,
    symbol: `TEST-${Date.now()}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides
  }
}

export const mockAssetPriceHistory = {
  asset_id: mockAssets.apple.id,
  symbol: mockAssets.apple.symbol,
  prices: [
    { date: '2024-01-01', open: 175.00, high: 177.50, low: 174.50, close: 176.00, volume: 45000000 },
    { date: '2024-01-02', open: 176.00, high: 178.00, low: 175.50, close: 177.25, volume: 48000000 },
    { date: '2024-01-03', open: 177.25, high: 179.00, low: 176.75, close: 178.50, volume: 52000000 },
    { date: '2024-01-04', open: 178.50, high: 180.00, low: 177.00, close: 179.00, volume: 55000000 },
    { date: '2024-01-05', open: 179.00, high: 181.00, low: 178.00, close: 180.50, volume: 58000000 }
  ]
}

export const mockAssetSearch = [
  { id: mockAssets.apple.id, symbol: 'AAPL', name: 'Apple Inc.', type: 'stock' },
  { id: 'asset-aple', symbol: 'APLE', name: 'Apple Hospitality REIT', type: 'stock' },
  { id: 'asset-apld', symbol: 'APLD', name: 'Applied Digital Corporation', type: 'stock' }
]