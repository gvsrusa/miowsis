'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { 
  User, 
  Bell, 
  Shield, 
  CreditCard, 
  HelpCircle, 
  Globe,
  Smartphone,
  Moon,
  Sun,
  ChevronRight
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'

interface NotificationSettings {
  emailNotifications: boolean
  pushNotifications: boolean
  marketingEmails: boolean
  portfolioAlerts: boolean
  priceAlerts: boolean
  newsAlerts: boolean
}

interface PrivacySettings {
  shareDataAnalytics: boolean
  personalizedRecommendations: boolean
  publicProfile: boolean
}

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const { theme, setTheme } = useTheme()
  const [isLoading, setIsLoading] = useState(false)
  
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    pushNotifications: true,
    marketingEmails: false,
    portfolioAlerts: true,
    priceAlerts: true,
    newsAlerts: false,
  })

  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    shareDataAnalytics: true,
    personalizedRecommendations: true,
    publicProfile: false,
  })

  const [userProfile, setUserProfile] = useState({
    fullName: session?.user?.name || '',
    email: session?.user?.email || '',
    phone: '',
    currency: 'USD',
    language: 'en',
    timezone: 'UTC',
  })

  if (status === 'unauthenticated') {
    redirect('/auth/signin')
  }

  const handleSaveProfile = async () => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success('Profile updated successfully')
    } catch (_error) {
      toast.error('Failed to update profile')
    } finally {
      setIsLoading(false)
    }
  }

  const handleNotificationToggle = (key: keyof NotificationSettings) => {
    setNotificationSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
    toast.success('Notification settings updated')
  }

  const handlePrivacyToggle = (key: keyof PrivacySettings) => {
    setPrivacySettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
    toast.success('Privacy settings updated')
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account preferences and settings
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-[400px]">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Update your personal information and contact details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={userProfile.fullName}
                    onChange={(e) => setUserProfile(prev => ({ ...prev, fullName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={userProfile.email}
                    onChange={(e) => setUserProfile(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={userProfile.phone}
                    onChange={(e) => setUserProfile(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Preferred Currency</Label>
                  <Select 
                    value={userProfile.currency} 
                    onValueChange={(value) => setUserProfile(prev => ({ ...prev, currency: value }))}
                  >
                    <SelectTrigger id="currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="GBP">GBP - British Pound</SelectItem>
                      <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
                      <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="pt-4">
                <Button onClick={handleSaveProfile} disabled={isLoading}>
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Methods
              </CardTitle>
              <CardDescription>
                Manage your payment methods and billing information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-16 bg-gradient-to-r from-blue-600 to-blue-400 rounded flex items-center justify-center text-white font-bold text-xs">
                      VISA
                    </div>
                    <div>
                      <p className="font-medium">•••• •••• •••• 4242</p>
                      <p className="text-sm text-muted-foreground">Expires 12/24</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">Edit</Button>
                </div>
                <Button variant="outline" className="w-full">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Add Payment Method
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Choose how you want to receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-notifications">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch
                    id="email-notifications"
                    checked={notificationSettings.emailNotifications}
                    onCheckedChange={() => handleNotificationToggle('emailNotifications')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="push-notifications">Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive push notifications on your devices
                    </p>
                  </div>
                  <Switch
                    id="push-notifications"
                    checked={notificationSettings.pushNotifications}
                    onCheckedChange={() => handleNotificationToggle('pushNotifications')}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="portfolio-alerts">Portfolio Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified about portfolio performance
                    </p>
                  </div>
                  <Switch
                    id="portfolio-alerts"
                    checked={notificationSettings.portfolioAlerts}
                    onCheckedChange={() => handleNotificationToggle('portfolioAlerts')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="price-alerts">Price Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Notifications for significant price changes
                    </p>
                  </div>
                  <Switch
                    id="price-alerts"
                    checked={notificationSettings.priceAlerts}
                    onCheckedChange={() => handleNotificationToggle('priceAlerts')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="news-alerts">Market News</Label>
                    <p className="text-sm text-muted-foreground">
                      Updates about market news and trends
                    </p>
                  </div>
                  <Switch
                    id="news-alerts"
                    checked={notificationSettings.newsAlerts}
                    onCheckedChange={() => handleNotificationToggle('newsAlerts')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="marketing-emails">Marketing Emails</Label>
                    <p className="text-sm text-muted-foreground">
                      Promotional offers and newsletters
                    </p>
                  </div>
                  <Switch
                    id="marketing-emails"
                    checked={notificationSettings.marketingEmails}
                    onCheckedChange={() => handleNotificationToggle('marketingEmails')}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Privacy & Security
              </CardTitle>
              <CardDescription>
                Control your privacy settings and data sharing preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="share-analytics">Share Analytics Data</Label>
                    <p className="text-sm text-muted-foreground">
                      Help us improve by sharing anonymous usage data
                    </p>
                  </div>
                  <Switch
                    id="share-analytics"
                    checked={privacySettings.shareDataAnalytics}
                    onCheckedChange={() => handlePrivacyToggle('shareDataAnalytics')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="personalized-recommendations">Personalized Recommendations</Label>
                    <p className="text-sm text-muted-foreground">
                      Get investment suggestions based on your activity
                    </p>
                  </div>
                  <Switch
                    id="personalized-recommendations"
                    checked={privacySettings.personalizedRecommendations}
                    onCheckedChange={() => handlePrivacyToggle('personalizedRecommendations')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="public-profile">Public Profile</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow others to see your profile and achievements
                    </p>
                  </div>
                  <Switch
                    id="public-profile"
                    checked={privacySettings.publicProfile}
                    onCheckedChange={() => handlePrivacyToggle('publicProfile')}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Shield className="mr-2 h-4 w-4" />
                  Two-Factor Authentication
                  <ChevronRight className="ml-auto h-4 w-4" />
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <User className="mr-2 h-4 w-4" />
                  Download Your Data
                  <ChevronRight className="ml-auto h-4 w-4" />
                </Button>
                <Button variant="outline" className="w-full justify-start text-red-600">
                  Delete Account
                  <ChevronRight className="ml-auto h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                App Preferences
              </CardTitle>
              <CardDescription>
                Customize your app experience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="theme">Theme</Label>
                  <div className="grid grid-cols-3 gap-3">
                    <Button
                      variant={theme === 'light' ? 'default' : 'outline'}
                      className="w-full"
                      onClick={() => setTheme('light')}
                    >
                      <Sun className="mr-2 h-4 w-4" />
                      Light
                    </Button>
                    <Button
                      variant={theme === 'dark' ? 'default' : 'outline'}
                      className="w-full"
                      onClick={() => setTheme('dark')}
                    >
                      <Moon className="mr-2 h-4 w-4" />
                      Dark
                    </Button>
                    <Button
                      variant={theme === 'system' ? 'default' : 'outline'}
                      className="w-full"
                      onClick={() => setTheme('system')}
                    >
                      <Smartphone className="mr-2 h-4 w-4" />
                      System
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select value={userProfile.language} onValueChange={(value) => setUserProfile(prev => ({ ...prev, language: value }))}>
                    <SelectTrigger id="language">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="de">Deutsch</SelectItem>
                      <SelectItem value="ja">日本語</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select value={userProfile.timezone} onValueChange={(value) => setUserProfile(prev => ({ ...prev, timezone: value }))}>
                    <SelectTrigger id="timezone">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">Eastern Time</SelectItem>
                      <SelectItem value="America/Chicago">Central Time</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                      <SelectItem value="Europe/London">London</SelectItem>
                      <SelectItem value="Europe/Paris">Paris</SelectItem>
                      <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                Help & Support
              </CardTitle>
              <CardDescription>
                Get help and learn more about MIOwSIS
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  Help Center
                  <ChevronRight className="ml-auto h-4 w-4" />
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Contact Support
                  <ChevronRight className="ml-auto h-4 w-4" />
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  About MIOwSIS
                  <ChevronRight className="ml-auto h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}