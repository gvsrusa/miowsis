'use client'

import { Brain, Sparkles, TrendingUp, Shield } from 'lucide-react'

import { AIAssistant } from '@/components/ai/ai-assistant'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function AIAssistantPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Brain className="h-8 w-8 text-primary" />
          AI Investment Assistant
          <Sparkles className="h-6 w-6 text-yellow-500" />
        </h1>
        <p className="text-muted-foreground mt-2">
          Get personalized investment advice and insights powered by AI
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AIAssistant />
        </div>
        
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                AI Capabilities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Portfolio analysis and optimization suggestions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>ESG investment recommendations</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Risk assessment and management</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Market trends and insights</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Personalized investment strategies</span>
                </li>
              </ul>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Privacy & Security
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Your conversations are private and secure. The AI assistant uses your portfolio data to provide personalized advice but never shares your information.
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-sm">Pro Tip</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                Ask specific questions about your portfolio for the most helpful insights. For example: &quot;How can I improve my ESG score?&quot; or &quot;What&apos;s my risk exposure?&quot;
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}