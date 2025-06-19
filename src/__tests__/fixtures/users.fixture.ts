import { type Database } from '@/types/database'

type Profile = Database['public']['Tables']['profiles']['Row']

export const mockUsers: Record<string, Profile> = {
  testUser: {
    id: 'user-123',
    email: 'test@example.com',
    full_name: 'Test User',
    avatar_url: 'https://example.com/avatar.jpg',
    role: 'user',
    kyc_status: 'verified',
    kyc_completed_at: '2024-01-01T00:00:00Z',
    onboarding_completed: true,
    risk_profile: {
      risk_tolerance: 'moderate',
      investment_horizon: 'long-term',
      investment_goals: ['growth', 'income'],
      experience_level: 'intermediate'
    },
    preferences: {
      theme: 'light',
      currency: 'USD',
      notifications: {
        email: true,
        push: true,
        sms: false
      }
    },
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  pendingKycUser: {
    id: 'user-456',
    email: 'pending@example.com',
    full_name: 'Pending User',
    avatar_url: null,
    role: 'user',
    kyc_status: 'pending',
    kyc_completed_at: null,
    onboarding_completed: false,
    risk_profile: null,
    preferences: {
      theme: 'light',
      currency: 'USD',
      notifications: {
        email: true,
        push: false,
        sms: false
      }
    },
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z'
  },
  adminUser: {
    id: 'admin-789',
    email: 'admin@example.com',
    full_name: 'Admin User',
    avatar_url: 'https://example.com/admin-avatar.jpg',
    role: 'admin',
    kyc_status: 'verified',
    kyc_completed_at: '2023-12-01T00:00:00Z',
    onboarding_completed: true,
    risk_profile: {
      risk_tolerance: 'high',
      investment_horizon: 'long-term',
      investment_goals: ['growth'],
      experience_level: 'expert'
    },
    preferences: {
      theme: 'dark',
      currency: 'USD',
      notifications: {
        email: true,
        push: true,
        sms: true
      }
    },
    created_at: '2023-12-01T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z'
  }
}

export const createMockUser = (overrides?: Partial<Profile>): Profile => {
  return {
    ...mockUsers.testUser,
    id: `user-${Date.now()}`,
    email: `test-${Date.now()}@example.com`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides
  }
}

export const mockSession = {
  user: {
    id: mockUsers.testUser.id,
    email: mockUsers.testUser.email,
    name: mockUsers.testUser.full_name,
    image: mockUsers.testUser.avatar_url,
    role: mockUsers.testUser.role
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
}

export const mockAdminSession = {
  user: {
    id: mockUsers.adminUser.id,
    email: mockUsers.adminUser.email,
    name: mockUsers.adminUser.full_name,
    image: mockUsers.adminUser.avatar_url,
    role: mockUsers.adminUser.role
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
}