import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  IconButton,
  TextField,
  Typography,
  Avatar,
  Fab,
  Chip,
  CircularProgress,
  Divider,
  InputAdornment,
  Paper,
  Badge,
  Fade,
  Collapse,
  useTheme
} from '@mui/material';
import {
  SmartToy,
  Send,
  Close,
  Psychology,
  TipsAndUpdates,
  Minimize,
  Chat
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
  const theme = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
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

  useEffect(() => {
    if (!isOpen && messages.length > 1) {
      const newMessages = messages.filter((msg, index) => 
        msg.role === 'assistant' && index > 0
      ).length;
      setUnreadCount(newMessages);
    } else {
      setUnreadCount(0);
    }
  }, [messages, isOpen]);

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
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Fab
              color="primary"
              aria-label="chat"
              onClick={() => setIsOpen(true)}
              sx={{
                position: 'fixed',
                bottom: 24,
                right: 24,
                background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #1976D2 30%, #00ACC1 90%)',
                }
              }}
            >
              <Badge badgeContent={unreadCount} color="error">
                <Chat />
              </Badge>
            </Fab>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'fixed',
              bottom: 90,
              right: 24,
              zIndex: 1300
            }}
          >
            <Paper
              elevation={8}
              sx={{
                width: 380,
                height: isMinimized ? 'auto' : 500,
                maxHeight: 'calc(100vh - 120px)',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 2,
                overflow: 'hidden',
                position: 'relative'
              }}
            >
              {/* Header */}
              <Box
                sx={{
                  background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                  color: 'white',
                  p: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  position: 'sticky',
                  top: 0,
                  zIndex: 10,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar
                    sx={{
                      bgcolor: 'rgba(255, 255, 255, 0.2)',
                      width: 36,
                      height: 36
                    }}
                  >
                    <Psychology />
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={600}>
                      AI Assistant
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.9 }}>
                      {isTyping ? 'Typing...' : 'Online'}
                    </Typography>
                  </Box>
                </Box>
                <Box display="flex" gap={0.5}>
                  <IconButton
                    size="small"
                    onClick={() => setIsMinimized(!isMinimized)}
                    sx={{ color: 'white' }}
                  >
                    <Minimize />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => setIsOpen(false)}
                    sx={{ color: 'white' }}
                  >
                    <Close />
                  </IconButton>
                </Box>
              </Box>

              <Collapse in={!isMinimized} sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                  {/* Messages */}
                  <Box
                    sx={{
                      flex: 1,
                      overflowY: 'auto',
                      overflowX: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      p: 2,
                      bgcolor: 'grey.50'
                    }}
                  >
                    {messages.map((message) => (
                      <Fade in key={message.id}>
                        <Box
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
                            {message.role === 'assistant' && (
                              <Avatar
                                sx={{
                                  width: 28,
                                  height: 28,
                                  bgcolor: 'secondary.main'
                                }}
                              >
                                <SmartToy sx={{ fontSize: 18 }} />
                              </Avatar>
                            )}
                            <Box
                              sx={{
                                bgcolor: message.role === 'user' ? 'primary.main' : 'white',
                                color: message.role === 'user' ? 'white' : 'text.primary',
                                borderRadius: 2,
                                p: 1.5,
                                boxShadow: 1
                              }}
                            >
                              <Typography variant="body2">
                                {message.content}
                              </Typography>
                              <Typography variant="caption" sx={{ opacity: 0.7, mt: 0.5, display: 'block' }}>
                                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      </Fade>
                    ))}

                    {isTyping && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 28, height: 28, bgcolor: 'secondary.main' }}>
                          <SmartToy sx={{ fontSize: 18 }} />
                        </Avatar>
                        <Box sx={{ bgcolor: 'white', borderRadius: 2, p: 1.5, boxShadow: 1 }}>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <CircularProgress size={8} />
                            <CircularProgress size={8} sx={{ animationDelay: '0.1s' }} />
                            <CircularProgress size={8} sx={{ animationDelay: '0.2s' }} />
                          </Box>
                        </Box>
                      </Box>
                    )}

                    <div ref={messagesEndRef} />
                  </Box>

                  {/* Quick Suggestions */}
                  {messages.length === 1 && (
                    <Box sx={{ px: 2, pb: 1, bgcolor: 'grey.50' }}>
                      <Typography variant="caption" color="textSecondary" gutterBottom>
                        Quick questions:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {suggestions.map((suggestion, index) => (
                          <Chip
                            key={index}
                            label={suggestion}
                            size="small"
                            onClick={() => handleSuggestionClick(suggestion)}
                            sx={{
                              cursor: 'pointer',
                              fontSize: '0.75rem',
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
                  <Box sx={{ p: 2, bgcolor: 'background.paper' }}>
                    <TextField
                      fullWidth
                      multiline
                      maxRows={3}
                      placeholder="Ask me anything..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      disabled={isLoading}
                      size="small"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 3
                        }
                      }}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={handleSend}
                              disabled={!input.trim() || isLoading}
                              color="primary"
                              size="small"
                            >
                              <Send fontSize="small" />
                            </IconButton>
                          </InputAdornment>
                        )
                      }}
                    />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                      <TipsAndUpdates sx={{ fontSize: 14, color: 'text.secondary' }} />
                      <Typography variant="caption" color="textSecondary">
                        Powered by AI • Always learning
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Collapse>
            </Paper>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AiChatWidget;