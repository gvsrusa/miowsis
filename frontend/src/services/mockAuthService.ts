// Mock authentication service for development
interface MockUser {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  profileImage?: string;
  emailVerified: boolean;
  kycStatus: 'pending' | 'verified' | 'rejected';
  onboardingComplete: boolean;
  biometricEnabled: boolean;
}

// Mock user database
const mockUsers: MockUser[] = [
  {
    id: '1',
    email: 'demo@miowsis.com',
    password: 'Demo123!',
    firstName: 'Demo',
    lastName: 'User',
    emailVerified: true,
    kycStatus: 'verified',
    onboardingComplete: true,
    biometricEnabled: false
  }
];

// Generate mock tokens
const generateMockTokens = (userId: string) => {
  const timestamp = Date.now();
  return {
    accessToken: `mock_access_token_${userId}_${timestamp}`,
    refreshToken: `mock_refresh_token_${userId}_${timestamp}`
  };
};

export const mockAuthService = {
  login: async (credentials: { email: string; password: string }) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const user = mockUsers.find(
      u => u.email === credentials.email && u.password === credentials.password
    );
    
    if (!user) {
      throw new Error('Invalid email or password');
    }
    
    const tokens = generateMockTokens(user.id);
    const { password, ...userWithoutPassword } = user;
    
    return {
      data: {
        ...tokens,
        user: userWithoutPassword
      }
    };
  },

  register: async (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check if user already exists
    if (mockUsers.find(u => u.email === userData.email)) {
      throw new Error('User already exists');
    }
    
    const newUser: MockUser = {
      id: String(mockUsers.length + 1),
      email: userData.email,
      password: userData.password,
      firstName: userData.firstName,
      lastName: userData.lastName,
      emailVerified: false,
      kycStatus: 'pending',
      onboardingComplete: false,
      biometricEnabled: false
    };
    
    mockUsers.push(newUser);
    
    const tokens = generateMockTokens(newUser.id);
    const { password, ...userWithoutPassword } = newUser;
    
    return {
      data: {
        ...tokens,
        user: userWithoutPassword
      }
    };
  },

  logout: async () => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return;
  },

  verifyToken: async () => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const token = localStorage.getItem('accessToken');
    if (!token || !token.startsWith('mock_access_token_')) {
      throw new Error('Invalid token');
    }
    
    const userId = token.split('_')[3];
    const user = mockUsers.find(u => u.id === userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    const { password, ...userWithoutPassword } = user;
    
    return {
      data: {
        user: userWithoutPassword,
        accessToken: token,
        refreshToken: localStorage.getItem('refreshToken') || ''
      }
    };
  },

  refreshToken: async (refreshToken: string) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (!refreshToken.startsWith('mock_refresh_token_')) {
      throw new Error('Invalid refresh token');
    }
    
    const userId = refreshToken.split('_')[3];
    const user = mockUsers.find(u => u.id === userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    const tokens = generateMockTokens(user.id);
    const { password, ...userWithoutPassword } = user;
    
    return {
      data: {
        ...tokens,
        user: userWithoutPassword
      }
    };
  }
};