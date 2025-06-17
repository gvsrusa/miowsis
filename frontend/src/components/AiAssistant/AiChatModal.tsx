import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  Typography,
  Avatar,
  Chip,
  CircularProgress,
  Divider,
  InputAdornment,
  Drawer,
  useTheme,
  useMediaQuery,
  Alert,
  Button
} from '@mui/material';
import {
  SmartToy,
  Send,
  Close,
  Psychology,
  TipsAndUpdates,
  Refresh,
  TrendingUp,
  AccountBalance,
  NaturePeople
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useCreateChatSession, useSendChatMessage, useChatSession, usePortfolioInsights } from '@/hooks/api';
import type { ChatSession, ChatMessage as ChatMessageType } from '@/services/api/types';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

interface AiChatModalProps {
  open: boolean;
  onClose: () => void;
}

const AiChatModal: React.FC<AiChatModalProps> = ({ open, onClose }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // API hooks
  const { mutate: createSession, isPending: isCreatingSession } = useCreateChatSession();
  const { mutate: sendMessage, isPending: isSending } = useSendChatMessage();
  const { data: sessionData } = useChatSession(sessionId || '');
  const { data: insights } = usePortfolioInsights();

  // Initialize session when modal opens
  useEffect(() => {
    if (open && !sessionId) {
      createSession(undefined, {
        onSuccess: (data: ChatSession) => {
          setSessionId(data.id);
          setMessages([{
            id: '1',
            role: 'assistant',
            content: "Hi! I'm your MIOwSIS AI assistant. I can help you with investment advice, explain financial concepts, analyze your portfolio, and answer questions about ESG investing. How can I help you today?",
            timestamp: new Date()
          }]);
        },
        onError: () => {
          setMessages([{
            id: '1',
            role: 'assistant',
            content: "Hi! I'm currently having trouble connecting to the AI service, but I'm here to help. Please try again in a moment.",
            timestamp: new Date()
          }]);
        }
      });
    }
  }, [open, sessionId, createSession]);

  // Load messages from session data
  useEffect(() => {
    if (sessionData?.messages && sessionData.messages.length > 0) {
      const formattedMessages: Message[] = sessionData.messages.map((msg: any) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.timestamp)
      }));
      setMessages(formattedMessages);
    }
  }, [sessionData]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || isSending || !sessionId) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');

    sendMessage(
      { sessionId, message: input },
      {
        onSuccess: (response: ChatMessageType) => {
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: response.content,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, assistantMessage]);
        },
        onError: () => {
          const errorMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: "I'm sorry, I couldn't process your request right now. Please try again.",
            timestamp: new Date()
          };
          setMessages(prev => [...prev, errorMessage]);
        }
      }
    );
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const suggestions = [
    "What are ESG scores?",
    "How do round-ups work?",
    "Analyze my portfolio",
    "Best sustainable investments"
  ];

  const insightsSuggestions = insights?.slice(0, 2).map(i => i.title) || [];

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    setTimeout(() => handleSend(), 100); // Small delay to ensure input is set
  };

  const isLoading = isCreatingSession || isSending;

  const chatContent = (
    <>
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          p: 2,
          minHeight: isMobile ? '60vh' : '500px'
        }}
      >
        {messages.map((message) => (
          <Box
            key={message.id}
            sx={{
              display: 'flex',
              justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
              mb: 2
            }}
          >
            <Box
              sx={{
                maxWidth: '80%',
                display: 'flex',
                flexDirection: message.role === 'user' ? 'row-reverse' : 'row',
                alignItems: 'flex-start',
                gap: 1
              }}
            >
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: message.role === 'user' ? 'primary.main' : 'secondary.main'
                }}
              >
                {message.role === 'user' ? 'U' : <SmartToy />}
              </Avatar>
              <Box
                sx={{
                  bgcolor: message.role === 'user' ? 'primary.main' : 'grey.100',
                  color: message.role === 'user' ? 'white' : 'text.primary',
                  borderRadius: 2,
                  p: 2,
                  position: 'relative'
                }}
              >
                <Typography variant="body2" style={{ whiteSpace: 'pre-wrap' }}>
                  {message.content}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.7, mt: 1, display: 'block' }}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Typography>
              </Box>
            </Box>
          </Box>
        ))}

        {isSending && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 5 }}>
            <CircularProgress size={16} />
            <Typography variant="body2" color="textSecondary">
              AI is thinking...
            </Typography>
          </Box>
        )}

        <div ref={messagesEndRef} />
      </Box>

      {/* Quick Suggestions */}
      {messages.length <= 2 && !isCreatingSession && (
        <Box sx={{ px: 2, pb: 1 }}>
          <Typography variant="caption" color="textSecondary" gutterBottom>
            Quick questions:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {suggestions.map((suggestion, index) => (
              <Chip
                key={index}
                label={suggestion}
                size="small"
                onClick={() => handleSuggestionClick(suggestion)}
                sx={{
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: 'primary.light',
                    color: 'white'
                  }
                }}
              />
            ))}
          </Box>
          
          {insightsSuggestions.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" color="textSecondary" gutterBottom>
                Based on your portfolio:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 0.5 }}>
                {insightsSuggestions.map((suggestion: string, index: number) => (
                  <Chip
                    key={`insight-${index}`}
                    label={suggestion}
                    size="small"
                    color="secondary"
                    onClick={() => handleSuggestionClick(suggestion)}
                    sx={{
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: 'secondary.dark',
                        color: 'white'
                      }
                    }}
                  />
                ))}
              </Box>
            </Box>
          )}
        </Box>
      )}

      <Divider />

      {/* Input Area */}
      <Box sx={{ p: 2 }}>
        <TextField
          fullWidth
          multiline
          maxRows={3}
          placeholder="Ask me anything about investing..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isLoading || !sessionId}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading || !sessionId}
                  color="primary"
                >
                  <Send />
                </IconButton>
              </InputAdornment>
            )
          }}
        />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
          <TipsAndUpdates sx={{ fontSize: 16, color: 'text.secondary' }} />
          <Typography variant="caption" color="textSecondary">
            I can help with portfolio analysis, ESG investing, and financial education
          </Typography>
        </Box>
        
        {/* Portfolio Insights */}
        {insights && insights.length > 0 && (
          <Box sx={{ mt: 2, p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="caption" fontWeight={500} gutterBottom display="block">
              Portfolio Insights:
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              {insights.slice(0, 3).map((insight, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {insight.type === 'PERFORMANCE' && <TrendingUp sx={{ fontSize: 16, color: 'success.main' }} />}
                  {insight.type === 'ESG' && <NaturePeople sx={{ fontSize: 16, color: 'secondary.main' }} />}
                  {insight.type === 'RISK' && <AccountBalance sx={{ fontSize: 16, color: 'warning.main' }} />}
                  {insight.type === 'OPPORTUNITY' && <Psychology sx={{ fontSize: 16, color: 'primary.main' }} />}
                  <Typography variant="caption">
                    {insight.title}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </Box>
    </>
  );

  if (isMobile) {
    return (
      <Drawer
        anchor="bottom"
        open={open}
        onClose={onClose}
        PaperProps={{
          sx: {
            height: '85vh',
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16
          }
        }}
      >
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar
              sx={{
                background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                width: 40,
                height: 40
              }}
            >
              <Psychology />
            </Avatar>
            <Box>
              <Typography variant="h6">AI Assistant</Typography>
              <Typography variant="caption" color="textSecondary">
                Your personal investment advisor
              </Typography>
            </Box>
          </Box>
          <Box>
            <IconButton 
              onClick={() => {
                setSessionId(null);
                setMessages([]);
              }}
              size="small"
            >
              <Refresh />
            </IconButton>
            <IconButton onClick={onClose}>
              <Close />
            </IconButton>
          </Box>
        </Box>
        <Divider />
        {chatContent}
      </Drawer>
    );
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          height: '80vh',
          maxHeight: 700
        }
      }}
    >
      <DialogTitle sx={{ m: 0, p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar
            sx={{
              background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
              width: 40,
              height: 40
            }}
          >
            <Psychology />
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6">MIOwSIS AI Assistant</Typography>
            <Typography variant="caption" color="textSecondary">
              Your personal investment advisor
            </Typography>
          </Box>
          <IconButton 
            onClick={() => {
              setSessionId(null);
              setMessages([]);
            }}
            size="small"
            sx={{ mr: 1 }}
          >
            <Refresh />
          </IconButton>
          <IconButton
            aria-label="close"
            onClick={onClose}
            sx={{
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column' }}>
        {chatContent}
      </DialogContent>
    </Dialog>
  );
};

export default AiChatModal;