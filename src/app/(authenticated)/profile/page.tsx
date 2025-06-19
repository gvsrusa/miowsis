'use client'

import { useState, useEffect } from 'react'

import { redirect } from 'next/navigation'

import { motion } from 'framer-motion'
import { 
  Calendar, 
  Target,
  Award,
  TrendingUp,
  Leaf,
  Edit2,
  Camera,
  MapPin,
  Link as LinkIcon
} from 'lucide-react'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'


interface UserProfile {
  id: string
  fullName: string
  email: string
  bio: string
  location: string
  website: string
  joinedDate: string
  avatarUrl: string
  investorType: 'Conservative' | 'Moderate' | 'Aggressive'
  experience: 'Beginner' | 'Intermediate' | 'Expert'
  totalInvested: number
  totalReturns: number
  portfoliosCount: number
  achievementsCount: number
  averageESGScore: number
}

interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  unlockedAt: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

const mockProfile: UserProfile = {
  id: '1',
  fullName: 'John Doe',
  email: 'john.doe@example.com',
  bio: 'Passionate about sustainable investing and making a positive impact through my investment choices.',
  location: 'San Francisco, CA',
  website: 'https://johndoe.com',
  joinedDate: '2024-01-15',
  avatarUrl: '',
  investorType: 'Moderate',
  experience: 'Intermediate',
  totalInvested: 50000,
  totalReturns: 8500,
  portfoliosCount: 3,
  achievementsCount: 12,
  averageESGScore: 85,
}

const mockAchievements: Achievement[] = [
  {
    id: '1',
    title: 'First Investment',
    description: 'Made your first sustainable investment',
    icon: '🌱',
    unlockedAt: '2024-01-16',
    rarity: 'common',
  },
  {
    id: '2',
    title: 'ESG Champion',
    description: 'Maintained an average ESG score above 80',
    icon: '🏆',
    unlockedAt: '2024-02-20',
    rarity: 'rare',
  },
  {
    id: '3',
    title: 'Portfolio Diversifier',
    description: 'Created 3 different portfolios',
    icon: '📊',
    unlockedAt: '2024-03-10',
    rarity: 'rare',
  },
]

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const [profile, setProfile] = useState<UserProfile>(mockProfile)
  const [achievements] = useState<Achievement[]>(mockAchievements)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editedProfile, setEditedProfile] = useState(profile)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/auth/signin')
    }
  }, [status])

  useEffect(() => {
    // Update profile with session data if available
    if (session?.user) {
      setProfile(prev => ({
        ...prev,
        fullName: session.user.name || prev.fullName,
        email: session.user.email || prev.email,
        avatarUrl: session.user.image || prev.avatarUrl,
      }))
      setEditedProfile(prev => ({
        ...prev,
        fullName: session.user.name || prev.fullName,
        email: session.user.email || prev.email,
        avatarUrl: session.user.image || prev.avatarUrl,
      }))
    }
  }, [session])

  const handleSaveProfile = async () => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      setProfile(editedProfile)
      setIsEditDialogOpen(false)
      toast.success('Profile updated successfully')
    } catch (_error) {
      toast.error('Failed to update profile')
    } finally {
      setIsLoading(false)
    }
  }

  const returnsPercentage = profile.totalInvested > 0 
    ? ((profile.totalReturns / profile.totalInvested) * 100).toFixed(2)
    : '0.00'

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Profile Header */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile.avatarUrl} />
                <AvatarFallback className="text-2xl">
                  {profile.fullName.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <Button
                size="icon"
                variant="secondary"
                className="absolute bottom-0 right-0 h-8 w-8 rounded-full"
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold">{profile.fullName}</h1>
                  <p className="text-muted-foreground">{profile.email}</p>
                  {profile.bio && (
                    <p className="mt-2 text-sm max-w-2xl">{profile.bio}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
                    {profile.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {profile.location}
                      </div>
                    )}
                    {profile.website && (
                      <div className="flex items-center gap-1">
                        <LinkIcon className="h-4 w-4" />
                        <a href={profile.website} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
                          {profile.website.replace(/^https?:\/\//, '')}
                        </a>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Joined {new Date(profile.joinedDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Edit2 className="mr-2 h-4 w-4" />
                      Edit Profile
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Edit Profile</DialogTitle>
                      <DialogDescription>
                        Update your profile information
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                          id="name"
                          value={editedProfile.fullName}
                          onChange={(e) => setEditedProfile(prev => ({ ...prev, fullName: e.target.value }))}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea
                          id="bio"
                          value={editedProfile.bio}
                          onChange={(e) => setEditedProfile(prev => ({ ...prev, bio: e.target.value }))}
                          rows={3}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
                          value={editedProfile.location}
                          onChange={(e) => setEditedProfile(prev => ({ ...prev, location: e.target.value }))}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="website">Website</Label>
                        <Input
                          id="website"
                          type="url"
                          value={editedProfile.website}
                          onChange={(e) => setEditedProfile(prev => ({ ...prev, website: e.target.value }))}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsEditDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleSaveProfile} disabled={isLoading}>
                        {isLoading ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="text-center">
              <p className="text-2xl font-bold">${(profile.totalInvested / 1000).toFixed(1)}k</p>
              <p className="text-sm text-muted-foreground">Total Invested</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">+{returnsPercentage}%</p>
              <p className="text-sm text-muted-foreground">Returns</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{profile.portfoliosCount}</p>
              <p className="text-sm text-muted-foreground">Portfolios</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{profile.achievementsCount}</p>
              <p className="text-sm text-muted-foreground">Achievements</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Investor Profile
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Type</span>
                      <Badge variant="outline">{profile.investorType}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Experience</span>
                      <Badge variant="outline">{profile.experience}</Badge>
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Investment Strategy</p>
                    <p className="text-sm">
                      Focused on long-term growth with moderate risk tolerance and strong emphasis on ESG factors.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Leaf className="h-5 w-5 text-green-600" />
                  ESG Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-baseline justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Average ESG Score</span>
                      <span className="text-2xl font-bold text-green-600">{profile.averageESGScore}</span>
                    </div>
                    <Progress value={profile.averageESGScore} className="h-2" />
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-sm font-medium">E</p>
                      <p className="text-xl font-bold text-green-600">88</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">S</p>
                      <p className="text-xl font-bold text-blue-600">82</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">G</p>
                      <p className="text-xl font-bold text-purple-600">85</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Performance Summary
              </CardTitle>
              <CardDescription>
                Your investment performance over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                Performance chart will be displayed here
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Your Achievements
              </CardTitle>
              <CardDescription>
                Track your progress and unlock new achievements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {achievements.map((achievement, index) => (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="h-full">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="text-3xl">{achievement.icon}</div>
                          <div className="flex-1">
                            <h4 className="font-semibold">{achievement.title}</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              {achievement.description}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge
                                variant={
                                  achievement.rarity === 'legendary' ? 'default' :
                                  achievement.rarity === 'epic' ? 'secondary' :
                                  achievement.rarity === 'rare' ? 'outline' :
                                  'secondary'
                                }
                                className="text-xs"
                              >
                                {achievement.rarity}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {new Date(achievement.unlockedAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Your latest investment activities and transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground text-center py-8">
                  No recent activity to display
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}