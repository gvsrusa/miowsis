import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
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
  CircularProgress,
  Grid,
  LinearProgress
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Google,
  Check,
  Close
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { AppDispatch, RootState } from '@/store';
import { register as registerUser, clearError } from '@/store/slices/authSlice';

interface RegisterFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface PasswordStrength {
  score: number;
  label: string;
  color: string;
}

const Register: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    score: 0,
    label: 'Weak',
    color: 'error'
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<RegisterFormData>();

  const password = watch('password');

  React.useEffect(() => {
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

  const onSubmit = async (data: RegisterFormData) => {
    dispatch(clearError());
    const { confirmPassword, ...userData } = data;
    const result = await dispatch(registerUser(userData));
    if (registerUser.fulfilled.match(result)) {
      navigate('/onboarding');
    }
  };

  const passwordRequirements = [
    { regex: /.{8,}/, text: 'At least 8 characters' },
    { regex: /[a-z]/, text: 'One lowercase letter' },
    { regex: /[A-Z]/, text: 'One uppercase letter' },
    { regex: /[0-9]/, text: 'One number' },
    { regex: /[^A-Za-z0-9]/, text: 'One special character' }
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        py: 4
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
                <Typography variant="h4" fontWeight={600} gutterBottom>
                  Create Your Account
                </Typography>
                <Typography variant="body1" color="textSecondary">
                  Start your investment journey with MIOwSIS
                </Typography>
              </Box>

              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}

              <form onSubmit={handleSubmit(onSubmit)}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="First Name"
                      {...register('firstName', {
                        required: 'First name is required'
                      })}
                      error={!!errors.firstName}
                      helperText={errors.firstName?.message}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Last Name"
                      {...register('lastName', {
                        required: 'Last name is required'
                      })}
                      error={!!errors.lastName}
                      helperText={errors.lastName?.message}
                    />
                  </Grid>
                </Grid>

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
                    validate: (value) => {
                      const allRequirementsMet = passwordRequirements.every(
                        req => req.regex.test(value)
                      );
                      return allRequirementsMet || 'Password does not meet requirements';
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
                  label="Confirm Password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  margin="normal"
                  {...register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: (value) => value === password || 'Passwords do not match'
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
                    )
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
                  {isLoading ? <CircularProgress size={24} /> : 'Create Account'}
                </Button>

                <Divider sx={{ my: 3 }}>OR</Divider>

                <Button
                  fullWidth
                  variant="outlined"
                  size="large"
                  startIcon={<Google />}
                  sx={{ mb: 3 }}
                >
                  Sign up with Google
                </Button>

                <Typography variant="body2" textAlign="center">
                  Already have an account?{' '}
                  <Link component={RouterLink} to="/login" fontWeight={500}>
                    Sign in
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
            By creating an account, you agree to our{' '}
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

export default Register;