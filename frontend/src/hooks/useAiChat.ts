import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';

interface ChatRequest {
  message: string;
  context?: Record<string, any>;
}

interface ChatResponse {
  message: string;
  conversationId: string;
  timestamp: string;
  suggestions?: string[];
}

export const useAiChat = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useSelector((state: RootState) => state.auth);

  const chatMutation = useMutation({
    mutationFn: async (request: ChatRequest) => {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post<ChatResponse>(
        '/api/ai/chat',
        request,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-User-Id': user?.id || ''
          }
        }
      );
      return response.data;
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
    const token = localStorage.getItem('accessToken');
    const response = await fetch('/api/ai/chat/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'X-User-Id': user?.id || ''
      },
      body: JSON.stringify({ message, context })
    });

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) return;

    setIsLoading(true);
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') return;
            
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                onChunk(parsed.content);
              }
            } catch (e) {
              console.error('Failed to parse SSE data:', e);
            }
          }
        }
      }
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