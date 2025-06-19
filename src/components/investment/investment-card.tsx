import { type ReactNode } from 'react'

import { TrendingUp, TrendingDown, Leaf, Info } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface InvestmentCardProps {
  symbol: string
  name: string
  type: 'stock' | 'etf' | 'bond' | 'fund'
  price: number
  change: number
  changePercentage: number
  esgScore?: number
  className?: string
  children?: ReactNode
  onDetailsClick?: () => void
}

export function InvestmentCard({
  symbol,
  name,
  type,
  price,
  change,
  changePercentage,
  esgScore,
  className,
  children,
  onDetailsClick,
}: InvestmentCardProps) {
  const isPositive = change >= 0

  return (
    <Card className={cn("hover:shadow-md transition-shadow", className)}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg">{symbol}</CardTitle>
            <CardDescription className="line-clamp-1">{name}</CardDescription>
          </div>
          <Badge variant="outline" className="ml-2">
            {type.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="text-2xl font-bold">${price.toFixed(2)}</p>
            <div className="flex items-center gap-1 mt-1">
              <span className={cn(
                "text-sm font-medium",
                isPositive ? 'text-green-600' : 'text-red-600'
              )}>
                {isPositive ? '+' : ''}{change.toFixed(2)}
              </span>
              <span className={cn(
                "text-sm",
                isPositive ? 'text-green-600' : 'text-red-600'
              )}>
                ({changePercentage.toFixed(2)}%)
              </span>
              {isPositive ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
            </div>
          </div>

          {esgScore && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Leaf className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-600">
                  ESG: {esgScore}/100
                </span>
              </div>
            </div>
          )}

          {children}

          {onDetailsClick && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full"
              onClick={onDetailsClick}
            >
              <Info className="h-4 w-4 mr-1" />
              View Details
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}