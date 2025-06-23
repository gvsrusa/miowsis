import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  IconButton,
  InputAdornment,
  LinearProgress,
} from '@mui/material';
import { Visibility, VisibilityOff, Check, Close } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import Logo from '@components/Logo/Logo';

interface ResetPasswordFormData {
  password: string;
  confirmPassword: string;
}

interface PasswordStrength {
  score: number;
  label: string;
  color: string;
}

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { updatePassword, error, clearError } = useSupabaseAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    score: 0,
    label: 'Weak',
    color: 'error',
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordFormData>();

  const password = watch('password');

  useEffect(() => {
    if (password) {
      const strength = calculatePasswordStrength(password);
      setPasswordStrength(strength);
    }
  }, [password]);

  const calculatePasswordStrength = (password: string): PasswordStrength => {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2) return { score: 25, label: 'Weak', color: 'error' };
    if (score <= 4) return { score: 50, label: 'Fair', color: 'warning' };
    if (score <= 5) return { score: 75, label: 'Good', color: 'info' };
    return { score: 100, label: 'Strong', color: 'success' };
  };

  const onSubmit = async (data: ResetPasswordFormData) => {
    try {
      setIsLoading(true);
      clearError();
      await updatePassword(data.password);
      
      // Show success message and redirect
      alert('Password updated successfully!');
      navigate('/login');
    } catch (error) {
      console.error('Password reset failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const passwordRequirements = [
    { regex: /.{8,}/, text: 'At least 8 characters' },
    { regex: /[a-z]/, text: 'One lowercase letter' },
    { regex: /[A-Z]/, text: 'One uppercase letter' },
    { regex: /[0-9]/, text: 'One number' },
    { regex: /[^A-Za-z0-9]/, text: 'One special character' },
  ];

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
              <Box textAlign="center" mb={4}>
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                  <Logo sx={{ fontSize: 64 }} />
                </Box>
                <Typography variant="h4" fontWeight={600} gutterBottom>
                  Reset Your Password
                </Typography>
                <Typography variant="body1" color="textSecondary">
                  Enter your new password below
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
                  label="New Password"
                  type={showPassword ? 'text' : 'password'}
                  margin="normal"
                  {...register('password', {
                    required: 'Password is required',
                    validate: (value) => {
                      const allRequirementsMet = passwordRequirements.every(
                        (req) => req.regex.test(value)
                      );
                      return allRequirementsMet || 'Password does not meet requirements';
                    },
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
                    ),
                  }}
                />

                {password && (
                  <Box sx={{ mt: 1, mb: 2 }}>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="caption">Password strength</Typography>
                      <Typography variant="caption" color={`${passwordStrength.color}.main`}>
                        {passwordStrength.label}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={passwordStrength.score}
                      color={passwordStrength.color as any}
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                    <Box sx={{ mt: 2 }}>
                      {passwordRequirements.map((req, index) => (
                        <Box key={index} display="flex" alignItems="center" gap={1}>
                          {req.regex.test(password) ? (
                            <Check sx={{ fontSize: 16, color: 'success.main' }} />
                          ) : (
                            <Close sx={{ fontSize: 16, color: 'text.disabled' }} />
                          )}
                          <Typography
                            variant="caption"
                            color={req.regex.test(password) ? 'success.main' : 'text.disabled'}
                          >
                            {req.text}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}

                <TextField
                  fullWidth
                  label="Confirm New Password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  margin="normal"
                  {...register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: (value) => value === password || 'Passwords do not match',
                  })}
                  error={!!errors.confirmPassword}
                  helperText={errors.confirmPassword?.message}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          edge="end"
                        >
                          {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={isLoading}
                  sx={{ mt: 3, mb: 2 }}
                >
                  {isLoading ? <CircularProgress size={24} /> : 'Update Password'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </Container>
    </Box>
  );
};

export default ResetPassword;