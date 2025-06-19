import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, LineChart, PieChart } from 'lucide-react'
import { cn } from '@/lib/utils'

type ChartType = 'line' | 'bar' | 'pie' | 'area'

interface ChartPlaceholderProps {
  title: string
  description?: string
  type?: ChartType
  height?: string
  className?: string
}

export function ChartPlaceholder({
  title,
  description,
  type = 'line',
  height = 'h-64',
  className,
}: ChartPlaceholderProps) {
  const getIcon = () => {
    switch (type) {
      case 'bar':
        return <BarChart3 className="h-8 w-8" />
      case 'pie':
        return <PieChart className="h-8 w-8" />
      case 'area':
      case 'line':
      default:
        return <LineChart className="h-8 w-8" />
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className={cn(
          "flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25",
          height
        )}>
          <div className="text-muted-foreground mb-2">
            {getIcon()}
          </div>
          <p className="text-sm text-muted-foreground text-center">
            {type.charAt(0).toUpperCase() + type.slice(1)} chart will be displayed here
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Visualization coming soon
          </p>
        </div>
      </CardContent>
    </Card>
  )
}