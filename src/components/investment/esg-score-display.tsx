import { Leaf, Users, Building } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface ESGScoreDisplayProps {
  overallScore: number
  environmentScore: number
  socialScore: number
  governanceScore: number
  showDetails?: boolean
  className?: string
}

export function ESGScoreDisplay({
  overallScore,
  environmentScore,
  socialScore,
  governanceScore,
  showDetails = true,
  className,
}: ESGScoreDisplayProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent'
    if (score >= 60) return 'Good'
    if (score >= 40) return 'Fair'
    return 'Poor'
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Leaf className="h-5 w-5 text-green-600" />
          ESG Score
        </CardTitle>
        <CardDescription>Environmental, Social & Governance Rating</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Overall Score */}
          <div className="text-center">
            <div className="relative inline-flex items-center justify-center">
              <div className="text-center">
                <p className={cn("text-4xl font-bold", getScoreColor(overallScore))}>
                  {overallScore}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {getScoreLabel(overallScore)}
                </p>
              </div>
            </div>
          </div>

          {showDetails && (
            <>
              <div className="space-y-4">
                {/* Environmental Score */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Leaf className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">Environmental</span>
                    </div>
                    <span className={cn("text-sm font-bold", getScoreColor(environmentScore))}>
                      {environmentScore}/100
                    </span>
                  </div>
                  <Progress 
                    value={environmentScore} 
                    className="h-2 [&>div]:bg-green-600"
                  />
                </div>

                {/* Social Score */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">Social</span>
                    </div>
                    <span className={cn("text-sm font-bold", getScoreColor(socialScore))}>
                      {socialScore}/100
                    </span>
                  </div>
                  <Progress 
                    value={socialScore} 
                    className="h-2 [&>div]:bg-blue-600"
                  />
                </div>

                {/* Governance Score */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-medium">Governance</span>
                    </div>
                    <span className={cn("text-sm font-bold", getScoreColor(governanceScore))}>
                      {governanceScore}/100
                    </span>
                  </div>
                  <Progress 
                    value={governanceScore} 
                    className="h-2 [&>div]:bg-purple-600"
                  />
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  ESG scores help you invest in companies that align with your values and contribute to sustainable development.
                </p>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}