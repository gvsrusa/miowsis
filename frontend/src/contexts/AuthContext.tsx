import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabaseAuthService, User, AuthResponse } from '../services/supabaseAuthService';
import { supabase } from '../config/supabase';

interface AuthContextType {
  user: User | null;
  session: any;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = !!user;

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        const authResponse = await supabaseAuthService.getCurrentSession();
        
        if (mounted) {
          if (authResponse) {
            setUser(authResponse.user);
            setSession(authResponse.session);
          } else {
            setUser(null);
            setSession(null);
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          setError('Failed to initialize authentication');
          setUser(null);
          setSession(null);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
    };
  }, []);

  // Listen to auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session);
        
        if (event === 'SIGNED_IN' && session?.user) {
          try {
            setIsLoading(true);
            const userProfile = await supabaseAuthService.getOrCreateUserProfile(session.user);
            setUser(userProfile);
            setSession(session);
            setError(null);
          } catch (error) {
            console.error('Error handling sign in:', error);
            setError('Failed to load user profile');
          } finally {
            setIsLoading(false);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setSession(null);
          setError(null);
          setIsLoading(false);
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          try {
            const userProfile = await supabaseAuthService.getOrCreateUserProfile(session.user);
            setUser(userProfile);
            setSession(session);
          } catch (error) {
            console.error('Error handling token refresh:', error);
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const authResponse = await supabaseAuthService.login({ email, password });
      // Auth state change will be handled by the listener
    } catch (error: any) {
      setError(error.message || 'Login failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
  }) => {
    try {
      setIsLoading(true);
      setError(null);
      const authResponse = await supabaseAuthService.register(userData);
      // Auth state change will be handled by the listener
    } catch (error: any) {
      setError(error.message || 'Registration failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await supabaseAuthService.logout();
      // Auth state change will be handled by the listener
    } catch (error: any) {
      setError(error.message || 'Logout failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      setError(null);
      await supabaseAuthService.signInWithGoogle();
      // Redirect will happen automatically
    } catch (error: any) {
      setError(error.message || 'Google sign-in failed');
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setError(null);
      await supabaseAuthService.resetPassword(email);
    } catch (error: any) {
      setError(error.message || 'Password reset failed');
      throw error;
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      setError(null);
      await supabaseAuthService.updatePassword(newPassword);
    } catch (error: any) {
      setError(error.message || 'Password update failed');
      throw error;
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    try {
      setError(null);
      const updatedUser = await supabaseAuthService.updateUserProfile(updates);
      setUser(updatedUser);
    } catch (error: any) {
      setError(error.message || 'Profile update failed');
      throw error;
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value: AuthContextType = {
    user,
    session,
    isLoading,
    isAuthenticated,
    error,
    login,
    register,
    logout,
    signInWithGoogle,
    resetPassword,
    updatePassword,
    updateProfile,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};