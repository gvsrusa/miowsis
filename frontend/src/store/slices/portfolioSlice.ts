import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface Holding {
  id: string;
  symbol: string;
  name: string;
  shares: number;
  avgCost: number;
  currentPrice: number;
  value: number;
  gain: number;
  gainPercent: number;
  esgScore: number;
}

export interface Portfolio {
  totalValue: number;
  totalCost: number;
  totalGain: number;
  totalGainPercent: number;
  dayGain: number;
  dayGainPercent: number;
  holdings: Holding[];
}

interface PortfolioState {
  portfolio: Portfolio | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: PortfolioState = {
  portfolio: null,
  isLoading: false,
  error: null
};

export const fetchPortfolio = createAsyncThunk(
  'portfolio/fetch',
  async () => {
    // Simulated API call
    return {
      totalValue: 12543.67,
      totalCost: 10000,
      totalGain: 2543.67,
      totalGainPercent: 25.44,
      dayGain: 123.45,
      dayGainPercent: 1.02,
      holdings: []
    };
  }
);

const portfolioSlice = createSlice({
  name: 'portfolio',
  initialState,
  reducers: {
    updateHolding: (state, action: PayloadAction<Holding>) => {
      if (state.portfolio) {
        const index = state.portfolio.holdings.findIndex(h => h.id === action.payload.id);
        if (index !== -1) {
          state.portfolio.holdings[index] = action.payload;
        }
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPortfolio.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPortfolio.fulfilled, (state, action) => {
        state.isLoading = false;
        state.portfolio = action.payload;
      })
      .addCase(fetchPortfolio.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch portfolio';
      });
  }
});

export const { updateHolding } = portfolioSlice.actions;
export default portfolioSlice.reducer;