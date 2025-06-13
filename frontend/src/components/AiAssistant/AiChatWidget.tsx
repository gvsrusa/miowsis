import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  TextField,
  Typography,
  Avatar,
  Fab,
  Zoom,
  Chip,
  CircularProgress,
  Divider,
  InputAdornment
} from '@mui/material';
import {
  SmartToy,
  Send,
  Close,
  Refresh,
  Psychology,
  TipsAndUpdates
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAiChat } from '@hooks/useAiChat';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

const AiChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm your MIOwSIS AI assistant. I can help you with investment advice, explain financial concepts, analyze your portfolio, and answer questions about ESG investing. How can I help you today?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { sendMessage, isLoading } = useAiChat();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await sendMessage(input);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.message,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Failed to get AI response:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm sorry, I couldn't process your request right now. Please try again.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
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

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    handleSend();
  };

  return (
    <>
      {/* Floating Action Button */}
      <Zoom in={!isOpen}>
        <Fab
          color="primary"
          aria-label="AI Assistant"
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
            '&:hover': {
              transform: 'scale(1.1)'
            }
          }}
          onClick={() => setIsOpen(true)}
        >
          <SmartToy />
        </Fab>
      </Zoom>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'fixed',
              bottom: 24,
              right: 24,
              zIndex: 1300
            }}
          >
            <Card
              sx={{
                width: { xs: '90vw', sm: 400 },
                height: { xs: '80vh', sm: 600 },
                maxHeight: '80vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: 6
              }}
            >
              <CardHeader
                avatar={
                  <Avatar
                    sx={{
                      background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)'
                    }}
                  >
                    <Psychology />
                  </Avatar>
                }
                title="MIOwSIS AI Assistant"
                subheader="Your personal investment advisor"
                action={
                  <IconButton onClick={() => setIsOpen(false)}>
                    <Close />
                  </IconButton>
                }
                sx={{
                  background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
                }}
              />

              <CardContent
                sx={{
                  flex: 1,
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  p: 2
                }}
              >
                {messages.map((message, index) => (
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
                          position: 'relative',
                          '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 8,
                            [message.role === 'user' ? 'right' : 'left']: -8,
                            width: 0,
                            height: 0,
                            borderStyle: 'solid',
                            borderWidth: message.role === 'user' ? '8px 0 8px 8px' : '8px 8px 8px 0',
                            borderColor: message.role === 'user'
                              ? 'transparent transparent transparent primary.main'
                              : 'transparent grey.100 transparent transparent'
                          }
                        }}
                      >
                        <Typography variant="body2">
                          {message.content}
                        </Typography>
                        <Typography variant="caption" sx={{ opacity: 0.7, mt: 1, display: 'block' }}>
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                ))}

                {isTyping && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 5 }}>
                    <CircularProgress size={16} />
                    <Typography variant="body2" color="textSecondary">
                      AI is thinking...
                    </Typography>
                  </Box>
                )}

                <div ref={messagesEndRef} />
              </CardContent>

              {/* Quick Suggestions */}
              {messages.length === 1 && (
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
                  disabled={isLoading}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={handleSend}
                          disabled={!input.trim() || isLoading}
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
              </Box>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AiChatWidget;