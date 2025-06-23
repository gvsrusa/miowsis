import React, { useState } from 'react';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Divider,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
  Alert,
  Link,
  CircularProgress
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Google,
  Fingerprint
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { AppDispatch, RootState } from '@/store';
import { clearError } from '@/store/slices/authSlice';
import Logo from '@components/Logo/Logo';

interface LoginFormData {
  email: string;
  password: string;
}

const Login: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();
  const { login, signInWithGoogle, isLoading, error, clearError: clearAuthError } = useSupabaseAuth();
  const [showPassword, setShowPassword] = useState(false);

  const from = location.state?.from?.pathname || '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    try {
      clearAuthError();
      await login(data.email, data.password);
      navigate(from, { replace: true });
    } catch (error) {
      // Error is handled by the auth context
      console.error('Login failed:', error);
    }
  };

  const handleBiometricLogin = () => {
    // Implement biometric authentication
    // This would integrate with WebAuthn API or similar
    console.log('Biometric login - WebAuthn integration needed');
    // TODO: Implement WebAuthn biometric authentication
  };

  const handleGoogleSignIn = async () => {
    try {
      clearAuthError();
      await signInWithGoogle();
      // Redirect will be handled by Supabase
    } catch (error) {
      console.error('Google sign-in failed:', error);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
      }}
    >
      <Container maxWidth="sm">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card>
            <CardContent sx={{ p: 4 }}>
              <Box textAlign="center" mb={4}>
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                  <Logo sx={{ fontSize: 64 }} />
                </Box>
                <Typography variant="h4" fontWeight={600} gutterBottom>
                  Welcome Back
                </Typography>
                <Typography variant="body1" color="textSecondary">
                  Sign in to continue to MIOwSIS
                </Typography>
              </Box>

              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  <strong>Demo Account:</strong><br />
                  Email: demo@miowsis.com<br />
                  Password: Demo123!
                </Typography>
              </Alert>

              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}

              <form onSubmit={handleSubmit(onSubmit)}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  margin="normal"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                  error={!!errors.email}
                  helperText={errors.email?.message}
                />

                <TextField
                  fullWidth
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  margin="normal"
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 8,
                      message: 'Password must be at least 8 characters'
                    }
                  })}
                  error={!!errors.password}
                  helperText={errors.password?.message}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />

                <Box display="flex" justifyContent="space-between" alignItems="center" my={2}>
                  <Link component={RouterLink} to="/forgot-password" variant="body2">
                    Forgot password?
                  </Link>
                </Box>

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={isLoading}
                  sx={{ mb: 2 }}
                >
                  {isLoading ? <CircularProgress size={24} /> : 'Sign In'}
                </Button>

                <Button
                  fullWidth
                  variant="outlined"
                  size="large"
                  startIcon={<Fingerprint />}
                  onClick={handleBiometricLogin}
                  sx={{ mb: 2 }}
                >
                  Sign in with Biometrics
                </Button>

                <Divider sx={{ my: 3 }}>OR</Divider>

                <Button
                  fullWidth
                  variant="outlined"
                  size="large"
                  startIcon={<Google />}
                  onClick={handleGoogleSignIn}
                  sx={{ mb: 3 }}
                >
                  Continue with Google
                </Button>

                <Typography variant="body2" textAlign="center">
                  Don't have an account?{' '}
                  <Link component={RouterLink} to="/register" fontWeight={500}>
                    Sign up
                  </Link>
                </Typography>
              </form>
            </CardContent>
          </Card>

          <Typography
            variant="caption"
            color="textSecondary"
            textAlign="center"
            display="block"
            mt={3}
          >
            By signing in, you agree to our{' '}
            <Link href="/terms" target="_blank">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" target="_blank">
              Privacy Policy
            </Link>
          </Typography>
        </motion.div>
      </Container>
    </Box>
  );
};

export default Login;