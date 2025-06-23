import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  TextField,
  Typography,
  Alert,
  Link,
  CircularProgress,
} from '@mui/material';
import { ArrowBack, Email } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import Logo from '@components/Logo/Logo';

interface ForgotPasswordFormData {
  email: string;
}

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const { resetPassword, error, clearError } = useSupabaseAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>();

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      setIsLoading(true);
      clearError();
      await resetPassword(data.email);
      setSuccess(true);
    } catch (error) {
      console.error('Password reset failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        }}
      >
        <Container maxWidth="sm">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card>
              <CardContent sx={{ p: 4, textAlign: 'center' }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                  <Email sx={{ fontSize: 64, color: 'success.main' }} />
                </Box>
                <Typography variant="h4" fontWeight={600} gutterBottom>
                  Check Your Email
                </Typography>
                <Typography variant="body1" color="textSecondary" mb={3}>
                  We've sent a password reset link to your email address.
                  Please check your inbox and follow the instructions.
                </Typography>
                <Button
                  component={RouterLink}
                  to="/login"
                  variant="contained"
                  size="large"
                  fullWidth
                  sx={{ mb: 2 }}
                >
                  Back to Login
                </Button>
                <Typography variant="body2" color="textSecondary">
                  Didn't receive the email? Check your spam folder or{' '}
                  <Link
                    component="button"
                    onClick={() => setSuccess(false)}
                    sx={{ cursor: 'pointer' }}
                  >
                    try again
                  </Link>
                </Typography>
              </CardContent>
            </Card>
          </motion.div>
        </Container>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
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
              <Box display="flex" alignItems="center" mb={3}>
                <Button
                  component={RouterLink}
                  to="/login"
                  startIcon={<ArrowBack />}
                  sx={{ mr: 2 }}
                >
                  Back
                </Button>
              </Box>

              <Box textAlign="center" mb={4}>
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                  <Logo sx={{ fontSize: 64 }} />
                </Box>
                <Typography variant="h4" fontWeight={600} gutterBottom>
                  Forgot Password?
                </Typography>
                <Typography variant="body1" color="textSecondary">
                  Enter your email address and we'll send you a link to reset your password.
                </Typography>
              </Box>

              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}

              <form onSubmit={handleSubmit(onSubmit)}>
                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  margin="normal"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address',
                    },
                  })}
                  error={!!errors.email}
                  helperText={errors.email?.message}
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={isLoading}
                  sx={{ mt: 3, mb: 2 }}
                >
                  {isLoading ? <CircularProgress size={24} /> : 'Send Reset Link'}
                </Button>

                <Typography variant="body2" textAlign="center">
                  Remember your password?{' '}
                  <Link component={RouterLink} to="/login" fontWeight={500}>
                    Sign in
                  </Link>
                </Typography>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </Container>
    </Box>
  );
};

export default ForgotPassword;