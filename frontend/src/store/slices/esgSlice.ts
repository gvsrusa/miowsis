import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ESGPreferences {
  environmental: number;
  social: number;
  governance: number;
  excludedSectors: string[];
  minimumScore: number;
}

export interface ESGScore {
  overall: number;
  environmental: number;
  social: number;
  governance: number;
  trend: 'up' | 'down' | 'stable';
}

interface ESGState {
  preferences: ESGPreferences;
  portfolioScore: ESGScore | null;
  isLoading: boolean;
}

const initialState: ESGState = {
  preferences: {
    environmental: 50,
    social: 30,
    governance: 20,
    excludedSectors: [],
    minimumScore: 60
  },
  portfolioScore: {
    overall: 87,
    environmental: 92,
    social: 85,
    governance: 78,
    trend: 'up'
  },
  isLoading: false
};

const esgSlice = createSlice({
  name: 'esg',
  initialState,
  reducers: {
    updatePreferences: (state, action: PayloadAction<Partial<ESGPreferences>>) => {
      state.preferences = { ...state.preferences, ...action.payload };
    },
    setPortfolioScore: (state, action: PayloadAction<ESGScore>) => {
      state.portfolioScore = action.payload;
    },
    toggleExcludedSector: (state, action: PayloadAction<string>) => {
      const sector = action.payload;
      const index = state.preferences.excludedSectors.indexOf(sector);
      if (index > -1) {
        state.preferences.excludedSectors.splice(index, 1);
      } else {
        state.preferences.excludedSectors.push(sector);
      }
    }
  }
});

export const { updatePreferences, setPortfolioScore, toggleExcludedSector } = esgSlice.actions;
export default esgSlice.reducer;