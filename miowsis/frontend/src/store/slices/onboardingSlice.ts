import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface OnboardingStep {
  id: string;
  title: string;
  completed: boolean;
}

export interface OnboardingData {
  investmentGoals: string[];
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  monthlyInvestment: number;
  esgPreferences: {
    environmental: boolean;
    social: boolean;
    governance: boolean;
  };
  bankAccountLinked: boolean;
  roundUpsEnabled: boolean;
}

interface OnboardingState {
  currentStep: number;
  totalSteps: number;
  steps: OnboardingStep[];
  data: OnboardingData;
  isCompleted: boolean;
}

const initialState: OnboardingState = {
  currentStep: 0,
  totalSteps: 6,
  steps: [
    { id: 'welcome', title: 'Welcome', completed: false },
    { id: 'goals', title: 'Investment Goals', completed: false },
    { id: 'risk', title: 'Risk Profile', completed: false },
    { id: 'esg', title: 'ESG Preferences', completed: false },
    { id: 'funding', title: 'Fund Account', completed: false },
    { id: 'complete', title: 'Complete', completed: false }
  ],
  data: {
    investmentGoals: [],
    riskTolerance: 'moderate',
    monthlyInvestment: 0,
    esgPreferences: {
      environmental: false,
      social: false,
      governance: false
    },
    bankAccountLinked: false,
    roundUpsEnabled: false
  },
  isCompleted: false
};

const onboardingSlice = createSlice({
  name: 'onboarding',
  initialState,
  reducers: {
    nextStep: (state) => {
      if (state.currentStep < state.totalSteps - 1) {
        state.steps[state.currentStep].completed = true;
        state.currentStep++;
      }
    },
    previousStep: (state) => {
      if (state.currentStep > 0) {
        state.currentStep--;
      }
    },
    goToStep: (state, action: PayloadAction<number>) => {
      if (action.payload >= 0 && action.payload < state.totalSteps) {
        state.currentStep = action.payload;
      }
    },
    updateData: (state, action: PayloadAction<Partial<OnboardingData>>) => {
      state.data = { ...state.data, ...action.payload };
    },
    completeOnboarding: (state) => {
      state.steps[state.steps.length - 1].completed = true;
      state.isCompleted = true;
    },
    resetOnboarding: (state) => {
      Object.assign(state, initialState);
    }
  }
});

export const {
  nextStep,
  previousStep,
  goToStep,
  updateData,
  completeOnboarding,
  resetOnboarding
} = onboardingSlice.actions;

export default onboardingSlice.reducer;