import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useSupabaseAuth } from './useSupabaseAuth';
import { RootState, AppDispatch } from '@/store';
import { setAuthState, logout as logoutAction } from '@/store/slices/authSlice';

export const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const supabaseAuth = useSupabaseAuth();
  
  // Sync Supabase auth state with Redux store
  useEffect(() => {
    if (supabaseAuth.user && supabaseAuth.session) {
      dispatch(setAuthState({
        user: supabaseAuth.user,
        token: supabaseAuth.session.access_token,
        refreshToken: supabaseAuth.session.refresh_token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      }));
    } else if (!supabaseAuth.isLoading && !supabaseAuth.user) {
      dispatch(logoutAction());
    }
  }, [dispatch, supabaseAuth.user, supabaseAuth.session, supabaseAuth.isLoading]);

  const handleLogout = async () => {
    try {
      await supabaseAuth.logout();
      dispatch(logoutAction());
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return {
    user: supabaseAuth.user,
    isAuthenticated: supabaseAuth.isAuthenticated,
    isLoading: supabaseAuth.isLoading,
    error: supabaseAuth.error,
    logout: handleLogout
  };
};