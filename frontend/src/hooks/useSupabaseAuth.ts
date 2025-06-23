import { useAuthContext } from '../contexts/AuthContext';

/**
 * Hook to access Supabase authentication context
 * This hook provides all authentication functionality including:
 * - User state and session management
 * - Login/register/logout methods
 * - Profile management
 * - Error handling
 */
export const useSupabaseAuth = () => {
  return useAuthContext();
};

/**
 * Hook for authentication status checks
 */
export const useAuthStatus = () => {
  const { isAuthenticated, isLoading, user } = useAuthContext();
  
  return {
    isAuthenticated,
    isLoading,
    user,
    isLoggedIn: isAuthenticated && !isLoading,
    needsOnboarding: user && !user.onboardingComplete,
    isEmailVerified: user?.emailVerified || false,
    kycStatus: user?.kycStatus || 'pending',
  };
};

/**
 * Hook for authentication actions
 */
export const useAuthActions = () => {
  const {
    login,
    register,
    logout,
    signInWithGoogle,
    resetPassword,
    updatePassword,
    updateProfile,
    clearError,
  } = useAuthContext();

  return {
    login,
    register,
    logout,
    signInWithGoogle,
    resetPassword,
    updatePassword,
    updateProfile,
    clearError,
  };
};