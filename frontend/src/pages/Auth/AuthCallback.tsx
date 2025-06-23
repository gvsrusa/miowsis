import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, CircularProgress, Typography, Alert } from '@mui/material';
import { supabase } from '../../config/supabase';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = React.useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the session from the URL hash
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          setError(error.message);
          // Redirect to login with error
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        if (data.session) {
          // Success - redirect to dashboard or intended page
          const returnTo = localStorage.getItem('auth_return_to') || '/dashboard';
          localStorage.removeItem('auth_return_to');
          navigate(returnTo, { replace: true });
        } else {
          // No session found - redirect to login
          navigate('/login', { replace: true });
        }
      } catch (error: any) {
        console.error('Auth callback error:', error);
        setError('Authentication failed. Please try again.');
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    handleAuthCallback();
  }, [navigate]);

  if (error) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: 4,
        }}
      >
        <Alert severity="error" sx={{ mb: 2, maxWidth: 400 }}>
          {error}
        </Alert>
        <Typography variant="body2" color="textSecondary">
          Redirecting to login...
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
      }}
    >
      <CircularProgress size={60} thickness={4} />
      <Typography variant="h6" color="textSecondary">
        Completing authentication...
      </Typography>
    </Box>
  );
};

export default AuthCallback;