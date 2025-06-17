import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  Container,
  Card,
  CardContent,
  LinearProgress
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { RootState, AppDispatch } from '@/store';
import { nextStep, previousStep, completeOnboarding } from '@/store/slices/onboardingSlice';
import { userService } from '@/services/userService';
import WelcomeStep from '@components/Onboarding/WelcomeStep';
import GoalsStep from '@components/Onboarding/GoalsStep';
import RiskProfileStep from '@components/Onboarding/RiskProfileStep';
import ESGPreferencesStep from '@components/Onboarding/ESGPreferencesStep';
import FundingStep from '@components/Onboarding/FundingStep';
import CompletionStep from '@components/Onboarding/CompletionStep';

const Onboarding: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { currentStep, steps, isCompleted } = useSelector(
    (state: RootState) => state.onboarding
  );

  const handleNext = async () => {
    if (currentStep === steps.length - 1) {
      try {
        // Mark onboarding as complete in Redux state
        dispatch(completeOnboarding());
        
        // Persist onboarding completion to backend
        await userService.completeOnboarding();
        
        // Navigate to dashboard
        navigate('/dashboard');
      } catch (error) {
        console.error('Failed to complete onboarding:', error);
        // Still navigate to dashboard even if backend call fails
        navigate('/dashboard');
      }
    } else {
      dispatch(nextStep());
    }
  };

  const handleBack = () => {
    dispatch(previousStep());
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return <WelcomeStep />;
      case 1:
        return <GoalsStep />;
      case 2:
        return <RiskProfileStep />;
      case 3:
        return <ESGPreferencesStep />;
      case 4:
        return <FundingStep />;
      case 5:
        return <CompletionStep />;
      default:
        return <div>Unknown step</div>;
    }
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        pt: 4,
        pb: 8
      }}
    >
      <Container maxWidth="md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Progress Bar */}
          <Box sx={{ mb: 4 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h5" fontWeight={600}>
                Welcome to MIOwSIS
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Step {currentStep + 1} of {steps.length}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: 'rgba(0, 0, 0, 0.1)',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 4,
                  background: 'linear-gradient(90deg, #4CAF50 0%, #2196F3 100%)'
                }
              }}
            />
          </Box>

          {/* Stepper */}
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Stepper activeStep={currentStep} alternativeLabel>
                {steps.map((step) => (
                  <Step key={step.id} completed={step.completed}>
                    <StepLabel>{step.title}</StepLabel>
                  </Step>
                ))}
              </Stepper>
            </CardContent>
          </Card>

          {/* Step Content */}
          <Card sx={{ minHeight: 400 }}>
            <CardContent sx={{ p: 4 }}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.3 }}
                >
                  {getStepContent(currentStep)}
                </motion.div>
              </AnimatePresence>
            </CardContent>
          </Card>

          {/* Navigation Buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button
              onClick={handleBack}
              disabled={currentStep === 0}
              variant="outlined"
              size="large"
            >
              Back
            </Button>
            <Button
              onClick={handleNext}
              variant="contained"
              size="large"
              sx={{
                background: 'linear-gradient(90deg, #4CAF50 0%, #2196F3 100%)',
                color: 'white'
              }}
            >
              {currentStep === steps.length - 1 ? 'Complete' : 'Next'}
            </Button>
          </Box>
        </motion.div>
      </Container>
    </Box>
  );
};

export default Onboarding;