import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState, AppDispatch } from '@/store';
import { verifyToken, logout } from '@/store/slices/authSlice';

export const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, error, token } = useSelector(
    (state: RootState) => state.auth
  );

  useEffect(() => {
    if (token && !isAuthenticated && !isLoading) {
      dispatch(verifyToken());
    }
  }, [dispatch, token, isAuthenticated, isLoading]);

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/');
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    logout: handleLogout
  };
};