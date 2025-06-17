import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  currentStreamingId: string | null;
}

const initialState: ChatState = {
  messages: [],
  isLoading: false,
  error: null,
  currentStreamingId: null
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    addMessage: (state, action: PayloadAction<ChatMessage>) => {
      state.messages.push(action.payload);
      state.error = null;
    },
    updateLastMessage: (state, action: PayloadAction<Partial<ChatMessage>>) => {
      if (state.messages.length > 0) {
        const lastIndex = state.messages.length - 1;
        state.messages[lastIndex] = {
          ...state.messages[lastIndex],
          ...action.payload
        };
      }
    },
    clearMessages: (state) => {
      state.messages = [];
      state.error = null;
      state.currentStreamingId = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    setStreamingId: (state, action: PayloadAction<string | null>) => {
      state.currentStreamingId = action.payload;
    }
  }
});

export const { 
  addMessage, 
  updateLastMessage, 
  clearMessages, 
  setLoading, 
  setError, 
  setStreamingId 
} = chatSlice.actions;

export default chatSlice.reducer;