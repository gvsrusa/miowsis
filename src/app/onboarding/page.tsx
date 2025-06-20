'use client'

import { useState } from 'react'

import { useRouter, redirect } from 'next/navigation'

import { zodResolver } from '@hookform/resolvers/zod'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2 } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { createClient } from '@/lib/supabase/client'


// Form schemas
const personalInfoSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  phoneNumber: z.string().min(1, 'Phone number is required'),
})

const TOTAL_STEPS = 5

type PersonalInfoData = z.infer<typeof personalInfoSchema>

interface OnboardingData {
  personalInfo?: PersonalInfoData
  investmentExperience?: string
  esgPreferences?: string[]
  riskTolerance?: string
}

export default function OnboardingPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({})
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PersonalInfoData>({
    resolver: zodResolver(personalInfoSchema),
  })

  if (authLoading) {
    return <div>Loading...</div>
  }

  if (!authLoading && !user) {
    redirect('/auth/signin')
  }

  const progress = (currentStep / TOTAL_STEPS) * 100

  const handlePersonalInfoSubmit = (data: PersonalInfoData) => {
    setOnboardingData({ ...onboardingData, personalInfo: data })
    setCurrentStep(2)
  }

  const handleInvestmentExperience = (experience: string) => {
    setOnboardingData({ ...onboardingData, investmentExperience: experience })
    setCurrentStep(3)
  }

  const handleESGPreferences = (preferences: string[]) => {
    setOnboardingData({ ...onboardingData, esgPreferences: preferences })
    setCurrentStep(4)
  }

  const handleRiskTolerance = (risk: string) => {
    setOnboardingData({ ...onboardingData, riskTolerance: risk })
    setCurrentStep(5)
  }

  const completeOnboarding = async () => {
    setIsLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: onboardingData.personalInfo?.fullName,
          onboarding_completed: true,
          risk_profile: {
            experience: onboardingData.investmentExperience,
            tolerance: onboardingData.riskTolerance,
          },
          preferences: {
            esg: onboardingData.esgPreferences,
          },
        })
        .eq('id', user?.id)

      if (!error) {
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Onboarding error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <form onSubmit={handleSubmit(handlePersonalInfoSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                {...register('fullName')}
                placeholder="John Doe"
              />
              {errors.fullName && (
                <p className="text-sm text-destructive">{errors.fullName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Input
                id="dateOfBirth"
                type="date"
                {...register('dateOfBirth')}
              />
              {errors.dateOfBirth && (
                <p className="text-sm text-destructive">{errors.dateOfBirth.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                type="tel"
                {...register('phoneNumber')}
                placeholder="+1 (555) 123-4567"
              />
              {errors.phoneNumber && (
                <p className="text-sm text-destructive">{errors.phoneNumber.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full">
              Continue
            </Button>
          </form>
        )

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">What&apos;s your investment experience?</h3>
            <div className="grid gap-3">
              {['Beginner', 'Intermediate', 'Advanced', 'Expert'].map((level) => (
                <Button
                  key={level}
                  variant="outline"
                  className="justify-start h-auto p-4"
                  onClick={() => handleInvestmentExperience(level)}
                >
                  <div className="text-left">
                    <div className="font-medium">{level}</div>
                    <div className="text-sm text-muted-foreground">
                      {getExperienceDescription(level)}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        )

      case 3:
        return <ESGPreferencesStep onContinue={handleESGPreferences} />

      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">How much risk are you comfortable with?</h3>
            <div className="grid gap-3">
              {['Conservative', 'Moderate', 'Aggressive'].map((risk) => (
                <Button
                  key={risk}
                  variant="outline"
                  className="justify-start h-auto p-4"
                  onClick={() => handleRiskTolerance(risk)}
                >
                  <div className="text-left">
                    <div className="font-medium">{risk}</div>
                    <div className="text-sm text-muted-foreground">
                      {getRiskDescription(risk)}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-6 text-center">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
            <div>
              <h3 className="text-2xl font-bold">All set!</h3>
              <p className="text-muted-foreground mt-2">
                Your account is ready. Let&apos;s start your investment journey.
              </p>
            </div>
            <Button
              onClick={completeOnboarding}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Setting up...' : 'Start Investing'}
            </Button>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <Progress value={progress} className="mb-4" />
          <CardTitle>
            {currentStep === 1 && 'Welcome to MIOwSIS!'}
            {currentStep === 2 && 'Investment Profile'}
            {currentStep === 3 && 'ESG Preferences'}
            {currentStep === 4 && 'Risk Assessment'}
            {currentStep === 5 && 'Account Setup'}
          </CardTitle>
          <CardDescription>
            {currentStep === 1 && "Let's get to know you better"}
            {currentStep === 2 && 'Tell us about your investment experience'}
            {currentStep === 3 && 'Select your impact preferences'}
            {currentStep === 4 && 'Help us understand your risk tolerance'}
            {currentStep === 5 && 'Your profile is complete'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  )
}

function ESGPreferencesStep({ onContinue }: { onContinue: (preferences: string[]) => void }) {
  const [selected, setSelected] = useState<string[]>([])

  const togglePreference = (preference: string) => {
    setSelected((prev) =>
      prev.includes(preference)
        ? prev.filter((p) => p !== preference)
        : [...prev, preference]
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">What matters most to you?</h3>
      <div className="space-y-3">
        {[
          { id: 'environmental', label: 'Environmental Impact', description: 'Climate action, renewable energy, conservation' },
          { id: 'social', label: 'Social Responsibility', description: 'Fair labor, community development, diversity' },
          { id: 'governance', label: 'Corporate Governance', description: 'Ethical leadership, transparency, accountability' },
        ].map((option) => (
          <label
            key={option.id}
            className="flex items-start space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-accent"
          >
            <input
              type="checkbox"
              value={option.id}
              checked={selected.includes(option.id)}
              onChange={() => togglePreference(option.id)}
              className="mt-1"
              aria-label={option.label}
            />
            <div className="flex-1">
              <div className="font-medium">{option.label}</div>
              <div className="text-sm text-muted-foreground">{option.description}</div>
            </div>
          </label>
        ))}
      </div>
      <Button
        onClick={() => onContinue(selected)}
        disabled={selected.length === 0}
        className="w-full"
      >
        Continue
      </Button>
    </div>
  )
}

function getExperienceDescription(level: string): string {
  const descriptions: Record<string, string> = {
    Beginner: "I'm new to investing and want to learn",
    Intermediate: "I have some investing experience",
    Advanced: "I'm comfortable with various investment strategies",
    Expert: "I have extensive investing knowledge",
  }
  return descriptions[level] || ''
}

function getRiskDescription(risk: string): string {
  const descriptions: Record<string, string> = {
    Conservative: 'Prioritize capital preservation with steady, modest returns',
    Moderate: 'Balance growth and stability with diversified investments',
    Aggressive: 'Maximize growth potential, comfortable with market volatility',
  }
  return descriptions[risk] || ''
}