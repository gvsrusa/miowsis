'use client'

import Link from 'next/link'

import { motion } from 'framer-motion'
import { ArrowRight, BarChart3, Globe, Shield, Sparkles, TrendingUp } from 'lucide-react'
import { useSession } from '@/contexts/auth-context'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function HomePage() {
  const { data: session } = useSession()

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-primary-100 to-background dark:from-primary-950 dark:via-background dark:to-background">
        <div className="container mx-auto px-4 py-24 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">
              Invest Your Spare Change
              <span className="block text-primary-600 dark:text-primary-400">
                For a Better Tomorrow
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-600 dark:text-gray-300">
              MIOwSIS democratizes sustainable investing through automated micro-investments
              and ESG integration. Start your journey with as little as $1.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              {session ? (
                <Button size="lg" asChild>
                  <Link href="/dashboard">
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button size="lg" asChild>
                    <Link href="/auth/signin">
                      Get Started
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="outline" size="lg" asChild>
                    <Link href="#features">Learn More</Link>
                  </Button>
                </>
              )}
            </div>
          </motion.div>
        </div>
        
        {/* Animated Background */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute left-[max(-7rem,calc(50%-52rem))] top-1/2 -z-10 -translate-y-1/2 transform-gpu blur-2xl" aria-hidden="true">
            <div className="aspect-[577/310] w-[36.0625rem] bg-gradient-to-r from-primary-400 to-primary-600 opacity-30" />
          </div>
          <div className="absolute left-[max(45rem,calc(50%+8rem))] top-1/2 -z-10 -translate-y-1/2 transform-gpu blur-2xl" aria-hidden="true">
            <div className="aspect-[577/310] w-[36.0625rem] bg-gradient-to-r from-primary-400 to-primary-600 opacity-30" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              Smart Investing Made Simple
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
              Powerful features designed to make sustainable investing accessible to everyone
            </p>
          </div>
          
          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900">
                      <feature.icon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                    </div>
                    <CardTitle className="mt-4">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-gray-50 dark:bg-gray-900 py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-4xl font-bold text-primary-600 dark:text-primary-400">
                  {stat.value}
                </div>
                <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="bg-gradient-to-r from-primary-600 to-primary-700 text-white">
            <CardContent className="p-12 text-center">
              <h2 className="text-3xl font-bold">
                Ready to Start Your Investment Journey?
              </h2>
              <p className="mt-4 text-lg opacity-90">
                Join thousands of investors making a difference with every dollar
              </p>
              <Button
                size="lg"
                variant="secondary"
                className="mt-8"
                asChild
              >
                <Link href="/auth/signin">
                  Create Free Account
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}

const features = [
  {
    title: 'Micro-Investments',
    description: 'Start investing with as little as $1. Round up your purchases and invest the spare change automatically.',
    icon: TrendingUp,
  },
  {
    title: 'ESG Integration',
    description: 'Invest in companies that align with your values. Track environmental, social, and governance impact.',
    icon: Globe,
  },
  {
    title: 'AI-Powered Insights',
    description: 'Get personalized investment recommendations based on your goals, risk tolerance, and market conditions.',
    icon: Sparkles,
  },
  {
    title: 'Real-Time Analytics',
    description: 'Monitor your portfolio performance with beautiful visualizations and detailed analytics.',
    icon: BarChart3,
  },
  {
    title: 'Bank-Level Security',
    description: 'Your investments are protected with industry-leading security and encryption standards.',
    icon: Shield,
  },
  {
    title: 'Automated Rebalancing',
    description: 'Keep your portfolio optimized with automatic rebalancing based on your investment strategy.',
    icon: TrendingUp,
  },
]

const stats = [
  { value: '$5B+', label: 'Assets Under Management' },
  { value: '2M+', label: 'Active Investors' },
  { value: '98%', label: 'Customer Satisfaction' },
  { value: '15%', label: 'Average Annual Return' },
]