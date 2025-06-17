import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import portfolioReducer from './slices/portfolioSlice';
import esgReducer from './slices/esgSlice';
import notificationReducer from './slices/notificationSlice';
import onboardingReducer from './slices/onboardingSlice';
import chatReducer from './slices/chatSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    portfolio: portfolioReducer,
    esg: esgReducer,
    notification: notificationReducer,
    onboarding: onboardingReducer,
    chat: chatReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['auth/login/fulfilled'],
        ignoredPaths: ['auth.user']
      }
    })
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;