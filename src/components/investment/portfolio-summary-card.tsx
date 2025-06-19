import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, DollarSign, Percent, Leaf } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PortfolioSummaryCardProps {
  name: string
  totalValue: number
  totalInvested: number
  totalReturns: number
  returnsPercentage: number
  esgScore: number
  holdings: number
  isActive?: boolean
  className?: string
}

export function PortfolioSummaryCard({
  name,
  totalValue,
  totalInvested,
  totalReturns,
  returnsPercentage,
  esgScore,
  holdings,
  isActive = false,
  className,
}: PortfolioSummaryCardProps) {
  const isPositiveReturn = totalReturns >= 0

  return (
    <Card className={cn(
      "relative overflow-hidden",
      isActive && "ring-2 ring-primary",
      className
    )}>
      {isActive && (
        <div className="absolute top-2 right-2">
          <Badge>Active</Badge>
        </div>
      )}
      
      <CardHeader>
        <CardTitle className="text-xl">{name}</CardTitle>
        <CardDescription>{holdings} holdings</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-muted-foreground">Total Value</span>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-2xl font-bold">${totalValue.toLocaleString()}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Invested</p>
            <p className="font-semibold">${totalInvested.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Returns</p>
            <div className="flex items-center gap-1">
              <p className={cn(
                "font-semibold",
                isPositiveReturn ? 'text-green-600' : 'text-red-600'
              )}>
                ${Math.abs(totalReturns).toLocaleString()}
              </p>
              {isPositiveReturn ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Performance</span>
            <span className={cn(
              "text-sm font-medium flex items-center gap-1",
              isPositiveReturn ? 'text-green-600' : 'text-red-600'
            )}>
              <Percent className="h-3 w-3" />
              {returnsPercentage.toFixed(2)}%
            </span>
          </div>
          <Progress 
            value={Math.min(Math.abs(returnsPercentage), 100)} 
            className="h-2"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Leaf className="h-4 w-4 text-green-600" />
              ESG Score
            </span>
            <span className="text-sm font-medium text-green-600">
              {esgScore}/100
            </span>
          </div>
          <Progress 
            value={esgScore} 
            className="h-2 [&>div]:bg-green-600"
          />
        </div>
      </CardContent>
    </Card>
  )
}