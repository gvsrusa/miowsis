'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { Plus, MoreVertical, TrendingUp, TrendingDown, Activity } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

const createPortfolioSchema = z.object({
  name: z.string().min(1, 'Portfolio name is required').max(100),
  currency: z.string().length(3).optional(),
})

type CreatePortfolioData = z.infer<typeof createPortfolioSchema>

interface Portfolio {
  id: string
  name: string
  currency: string
  total_value: number
  total_invested: number
  total_returns: number
  esg_score: number
  is_active: boolean
  holdings_count: number
  last_transaction_at: string | null
}

export default function PortfoliosPage() {
  const { data: session, status } = useSession()
  const [portfolios, setPortfolios] = useState<Portfolio[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreatePortfolioData>({
    resolver: zodResolver(createPortfolioSchema),
    defaultValues: {
      currency: 'USD',
    },
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/auth/signin')
    }
  }, [status])

  useEffect(() => {
    async function fetchPortfolios() {
      if (!session) return

      try {
        const response = await fetch('/api/portfolios')
        if (!response.ok) throw new Error('Failed to fetch portfolios')
        
        const data = await response.json()
        setPortfolios(data.portfolios)
      } catch (error) {
        console.error('Error fetching portfolios:', error)
        toast.error('Failed to load portfolios')
      } finally {
        setIsLoading(false)
      }
    }

    if (status === 'authenticated') {
      fetchPortfolios()
    }
  }, [session, status])

  const onCreatePortfolio = async (data: CreatePortfolioData) => {
    setIsCreating(true)
    
    try {
      const response = await fetch('/api/portfolios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create portfolio')
      }

      const { portfolio } = await response.json()
      setPortfolios([portfolio, ...portfolios])
      setIsCreateOpen(false)
      reset()
      toast.success('Portfolio created successfully')
    } catch (error) {
      console.error('Error creating portfolio:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create portfolio')
    } finally {
      setIsCreating(false)
    }
  }

  const handleSetActive = async (portfolioId: string) => {
    try {
      const response = await fetch(`/api/portfolios/${portfolioId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: true }),
      })

      if (!response.ok) throw new Error('Failed to update portfolio')

      setPortfolios(portfolios.map(p => ({
        ...p,
        is_active: p.id === portfolioId,
      })))
      
      toast.success('Active portfolio updated')
    } catch (error) {
      console.error('Error updating portfolio:', error)
      toast.error('Failed to update portfolio')
    }
  }

  const handleDelete = async (portfolioId: string) => {
    if (!confirm('Are you sure you want to delete this portfolio?')) return

    try {
      const response = await fetch(`/api/portfolios/${portfolioId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete portfolio')
      }

      setPortfolios(portfolios.filter(p => p.id !== portfolioId))
      toast.success('Portfolio deleted successfully')
    } catch (error) {
      console.error('Error deleting portfolio:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete portfolio')
    }
  }

  if (status === 'loading' || isLoading) {
    return <PortfoliosSkeleton />
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">My Portfolios</h1>
          <p className="text-muted-foreground mt-2">
            Manage your investment portfolios
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Portfolio
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit(onCreatePortfolio)}>
              <DialogHeader>
                <DialogTitle>Create New Portfolio</DialogTitle>
                <DialogDescription>
                  Add a new portfolio to organize your investments
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Portfolio Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., ESG Growth Portfolio"
                    {...register('name')}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500">{errors.name.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Input
                    id="currency"
                    placeholder="USD"
                    {...register('currency')}
                  />
                  {errors.currency && (
                    <p className="text-sm text-red-500">{errors.currency.message}</p>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? 'Creating...' : 'Create Portfolio'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {portfolios.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Activity className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No portfolios yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first portfolio to start investing
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Portfolio
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {portfolios.map((portfolio, index) => (
            <motion.div
              key={portfolio.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={portfolio.is_active ? 'ring-2 ring-primary' : ''}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {portfolio.name}
                        {portfolio.is_active && (
                          <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                            Active
                          </span>
                        )}
                      </CardTitle>
                      <CardDescription>
                        {portfolio.holdings_count} holdings · {portfolio.currency}
                      </CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => window.location.href = `/portfolios/${portfolio.id}`}
                        >
                          View Details
                        </DropdownMenuItem>
                        {!portfolio.is_active && (
                          <DropdownMenuItem
                            onClick={() => handleSetActive(portfolio.id)}
                          >
                            Set as Active
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleDelete(portfolio.id)}
                        >
                          Delete Portfolio
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Value</p>
                      <p className="text-2xl font-bold">
                        ${portfolio.total_value.toLocaleString()}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Returns</p>
                        <div className="flex items-center gap-1">
                          <p className={`font-semibold ${
                            portfolio.total_returns >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            ${Math.abs(portfolio.total_returns).toLocaleString()}
                          </p>
                          {portfolio.total_returns >= 0 ? (
                            <TrendingUp className="h-4 w-4 text-green-600" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">ESG Score</p>
                        <p className="font-semibold text-green-600">
                          {portfolio.esg_score}/100
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

function PortfoliosSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-5 w-64 mt-2" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-64" />
        ))}
      </div>
    </div>
  )
}