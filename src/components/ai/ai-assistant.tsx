'use client'

import { useState, useRef, useEffect } from 'react'

import { motion, AnimatePresence } from 'framer-motion'
import { Bot, Send, Loader2, Sparkles, TrendingUp, Lightbulb, AlertTriangle } from 'lucide-react'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  suggestions?: string[]
  actionCard?: ActionCard
}

interface ActionCard {
  type: 'portfolio_suggestion' | 'esg_insight' | 'market_alert' | 'goal_progress'
  title: string
  description: string
  actions?: Array<{
    label: string
    onClick: () => void
  }>
  data?: Array<{
    symbol: string
    name: string
    esg: number
  }>
}

const QUICK_ACTIONS = [
  "What's my portfolio performance?",
  "Show me ESG investment options",
  "How can I improve my returns?",
  "Analyze my risk exposure",
]

const AI_RESPONSES: Record<string, {
  content: string
  actionCard?: ActionCard
  suggestions: string[]
}> = {
  portfolio_performance: {
    content: "Based on your current portfolio, you're up 12.5% year-to-date! Your ESG-focused investments are performing particularly well, with your clean energy holdings up 18%.",
    actionCard: {
      type: 'portfolio_suggestion',
      title: 'Portfolio Optimization Available',
      description: 'I noticed you have some cash available. Would you like me to suggest some high-performing ESG investments?',
    },
    suggestions: [
      "Show me the best performers",
      "What about my worst performers?",
      "Compare to market benchmarks",
    ],
  },
  esg_options: {
    content: "I've identified several ESG investment opportunities that align with your values and risk profile. Here are my top recommendations based on your interest in renewable energy and social impact.",
    actionCard: {
      type: 'esg_insight',
      title: 'Top ESG Investment Picks',
      description: 'These companies have ESG scores above 85 and strong growth potential.',
      data: [
        { symbol: 'ICLN', name: 'iShares Global Clean Energy', esg: 92 },
        { symbol: 'ESGU', name: 'iShares ESG Aware MSCI USA', esg: 88 },
        { symbol: 'SDG', name: 'iShares MSCI Global Sustainable', esg: 90 },
      ],
    },
    suggestions: [
      "Tell me more about ICLN",
      "Compare these options",
      "Show me social impact funds",
    ],
  },
  improve_returns: {
    content: "I've analyzed your portfolio and found several opportunities to improve your returns while maintaining your ESG standards. Your current allocation could be optimized for better risk-adjusted returns.",
    actionCard: {
      type: 'goal_progress',
      title: 'Return Optimization Strategy',
      description: 'Rebalancing these positions could increase returns by 2-3% annually.',
    },
    suggestions: [
      "Show me the rebalancing plan",
      "What's the risk impact?",
      "Execute the changes",
    ],
  },
  risk_analysis: {
    content: "Your portfolio has a moderate risk profile with good diversification across sectors. However, I've noticed some concentration in tech stocks that we should address.",
    actionCard: {
      type: 'market_alert',
      title: 'Risk Concentration Alert',
      description: 'Tech sector represents 45% of your portfolio. Consider diversifying.',
    },
    suggestions: [
      "Show me diversification options",
      "What's my risk score?",
      "Compare to my risk tolerance",
    ],
  },
}

export function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm your AI investment assistant. I can help you analyze your portfolio, find ESG investments, and optimize your returns. What would you like to know?",
      timestamp: new Date(),
      suggestions: QUICK_ACTIONS,
    },
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsTyping(true)

    // Simulate AI response
    setTimeout(() => {
      let response = AI_RESPONSES.portfolio_performance

      if (input.toLowerCase().includes('esg') || input.toLowerCase().includes('sustainable')) {
        response = AI_RESPONSES.esg_options
      } else if (input.toLowerCase().includes('improve') || input.toLowerCase().includes('returns')) {
        response = AI_RESPONSES.improve_returns
      } else if (input.toLowerCase().includes('risk') || input.toLowerCase().includes('exposure')) {
        response = AI_RESPONSES.risk_analysis
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
        suggestions: response.suggestions,
        actionCard: response.actionCard,
      }

      setMessages(prev => [...prev, assistantMessage])
      setIsTyping(false)
    }, 1500)
  }

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion)
    handleSend()
  }

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          AI Investment Assistant
          <Sparkles className="h-4 w-4 text-primary ml-auto" />
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`flex gap-3 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div className={`max-w-[80%] space-y-2 ${
                    message.role === 'user' ? 'items-end' : 'items-start'
                  }`}>
                    <div
                      className={`rounded-lg px-4 py-2 ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                    </div>
                    
                    {message.actionCard && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                      >
                        <Card className="w-full">
                          <CardHeader className="pb-3">
                            <div className="flex items-center gap-2">
                              {message.actionCard.type === 'portfolio_suggestion' && (
                                <TrendingUp className="h-4 w-4 text-blue-500" />
                              )}
                              {message.actionCard.type === 'esg_insight' && (
                                <Lightbulb className="h-4 w-4 text-green-500" />
                              )}
                              {message.actionCard.type === 'market_alert' && (
                                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                              )}
                              <h4 className="font-semibold text-sm">
                                {message.actionCard.title}
                              </h4>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <p className="text-sm text-muted-foreground">
                              {message.actionCard.description}
                            </p>
                            
                            {message.actionCard.data && (
                              <div className="mt-3 space-y-2">
                                {message.actionCard.data.map((item, index) => (
                                  <div
                                    key={index}
                                    className="flex justify-between items-center text-sm"
                                  >
                                    <span>{item.symbol} - {item.name}</span>
                                    <span className="text-green-600 font-medium">
                                      ESG: {item.esg}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            {message.actionCard.actions && (
                              <div className="flex gap-2 mt-3">
                                {message.actionCard.actions.map((action, index) => (
                                  <Button
                                    key={index}
                                    size="sm"
                                    variant={index === 0 ? 'default' : 'outline'}
                                    onClick={action.onClick}
                                  >
                                    {action.label}
                                  </Button>
                                ))}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    )}
                    
                    {message.suggestions && (
                      <div className="flex flex-wrap gap-2">
                        {message.suggestions.map((suggestion, index) => (
                          <Button
                            key={index}
                            size="sm"
                            variant="outline"
                            className="text-xs"
                            onClick={() => handleSuggestionClick(suggestion)}
                          >
                            {suggestion}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {message.role === 'user' && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            
            {isTyping && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-3"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-muted rounded-lg px-4 py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </motion.div>
            )}
          </div>
        </ScrollArea>
        
        <div className="border-t p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSend()
            }}
            className="flex gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything about your investments..."
              disabled={isTyping}
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={isTyping || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  )
}