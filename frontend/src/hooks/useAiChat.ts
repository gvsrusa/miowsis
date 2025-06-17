import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { aiService } from '@/services/api/aiService';
import { ApiError } from '@/services/api/apiClient';
import type { ChatRequest, ChatResponse } from '@/services/api/types';

export const useAiChat = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useSelector((state: RootState) => state.auth);

  const chatMutation = useMutation({
    mutationFn: async (request: ChatRequest) => {
      // Add user context
      const enrichedRequest: ChatRequest = {
        ...request,
        context: {
          ...request.context,
          userId: user?.id
        }
      };
      return aiService.chat(enrichedRequest);
    },
    onError: (error: ApiError) => {
      console.error('Chat error:', error.message);
    }
  });

  const sendMessage = async (message: string, context?: Record<string, any>) => {
    setIsLoading(true);
    try {
      const response = await chatMutation.mutateAsync({ message, context });
      return response;
    } finally {
      setIsLoading(false);
    }
  };

  const streamMessage = async (
    message: string,
    onChunk: (chunk: string) => void,
    context?: Record<string, any>
  ) => {
    setIsLoading(true);
    try {
      await aiService.streamChat(
        { 
          message, 
          context: {
            ...context,
            userId: user?.id
          }
        },
        onChunk
      );
    } catch (error) {
      console.error('Stream error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    sendMessage,
    streamMessage,
    isLoading,
    error: chatMutation.error
  };
};