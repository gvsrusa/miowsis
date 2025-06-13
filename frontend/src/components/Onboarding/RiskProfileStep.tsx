import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Slider,
  Card,
  CardContent,
  Grid,
  Chip,
  Avatar,
  Button,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl
} from '@mui/material';
import {
  Shield,
  TrendingUp,
  Speed,
  Warning,
  CheckCircle
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { RootState, AppDispatch } from '@/store';
import { updateData } from '@/store/slices/onboardingSlice';

interface RiskProfile {
  value: 'conservative' | 'moderate' | 'aggressive';
  title: string;
  description: string;
  expectedReturn: string;
  volatility: string;
  icon: React.ReactNode;
  color: string;
  allocation: {
    stocks: number;
    bonds: number;
    alternatives: number;
  };
}

const riskProfiles: RiskProfile[] = [
  {
    value: 'conservative',
    title: 'Conservative',
    description: 'Prioritize capital preservation with steady, modest growth',
    expectedReturn: '4-6% annually',
    volatility: 'Low',
    icon: <Shield />,
    color: '#4CAF50',
    allocation: { stocks: 30, bonds: 60, alternatives: 10 }
  },
  {
    value: 'moderate',
    title: 'Moderate',
    description: 'Balance growth and stability for long-term wealth building',
    expectedReturn: '6-8% annually',
    volatility: 'Medium',
    icon: <TrendingUp />,
    color: '#2196F3',
    allocation: { stocks: 60, bonds: 30, alternatives: 10 }
  },
  {
    value: 'aggressive',
    title: 'Aggressive',
    description: 'Maximize growth potential, accepting higher volatility',
    expectedReturn: '8-12% annually',
    volatility: 'High',
    icon: <Speed />,
    color: '#FF9800',
    allocation: { stocks: 80, bonds: 10, alternatives: 10 }
  }
];

const RiskProfileStep: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { data } = useSelector((state: RootState) => state.onboarding);
  const [selectedProfile, setSelectedProfile] = useState<'conservative' | 'moderate' | 'aggressive'>(
    data.riskTolerance || 'moderate'
  );
  const [investmentHorizon, setInvestmentHorizon] = useState(5);
  const [lossTolerance, setLossTolerance] = useState('10-20');

  const handleProfileSelect = (value: 'conservative' | 'moderate' | 'aggressive') => {
    setSelectedProfile(value);
    dispatch(updateData({ riskTolerance: value }));
  };

  const horizonMarks = [
    { value: 1, label: '1 yr' },
    { value: 5, label: '5 yrs' },
    { value: 10, label: '10 yrs' },
    { value: 20, label: '20+ yrs' }
  ];

  return (
    <Box>
      <Typography variant="h5" gutterBottom fontWeight={600} textAlign="center">
        What's your risk tolerance?
      </Typography>
      <Typography variant="body1" color="textSecondary" textAlign="center" sx={{ mb: 4 }}>
        We'll use this to build a portfolio that matches your comfort level
      </Typography>

      {/* Risk Profile Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {riskProfiles.map((profile, index) => (
          <Grid item xs={12} md={4} key={profile.value}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
            >
              <Card
                sx={{
                  cursor: 'pointer',
                  border: selectedProfile === profile.value ? 3 : 1,
                  borderColor: selectedProfile === profile.value ? profile.color : 'divider',
                  transition: 'all 0.3s',
                  height: '100%'
                }}
                onClick={() => handleProfileSelect(profile.value)}
              >
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Avatar
                      sx={{
                        bgcolor: selectedProfile === profile.value ? profile.color : 'grey.300',
                        width: 48,
                        height: 48
                      }}
                    >
                      {profile.icon}
                    </Avatar>
                    {selectedProfile === profile.value && (
                      <CheckCircle sx={{ color: profile.color }} />
                    )}
                  </Box>
                  
                  <Typography variant="h6" gutterBottom>
                    {profile.title}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                    {profile.description}
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <Chip
                      label={`Returns: ${profile.expectedReturn}`}
                      size="small"
                      sx={{ mr: 1, mb: 1 }}
                    />
                    <Chip
                      label={`Volatility: ${profile.volatility}`}
                      size="small"
                      color={profile.volatility === 'Low' ? 'success' : profile.volatility === 'Medium' ? 'warning' : 'error'}
                      variant="outlined"
                    />
                  </Box>
                  
                  <Typography variant="caption" display="block" gutterBottom>
                    Typical Allocation:
                  </Typography>
                  <Box display="flex" gap={1}>
                    <Chip label={`Stocks ${profile.allocation.stocks}%`} size="small" />
                    <Chip label={`Bonds ${profile.allocation.bonds}%`} size="small" />
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      {/* Investment Horizon */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Investment Time Horizon
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
            How long do you plan to keep your money invested?
          </Typography>
          <Box sx={{ px: 2 }}>
            <Slider
              value={investmentHorizon}
              onChange={(e, value) => setInvestmentHorizon(value as number)}
              min={1}
              max={20}
              marks={horizonMarks}
              valueLabelDisplay="on"
              valueLabelFormat={(value) => `${value} years`}
            />
          </Box>
          <Typography variant="caption" color="textSecondary" sx={{ mt: 2, display: 'block' }}>
            Longer time horizons allow for more aggressive strategies as you have time to recover from market downturns.
          </Typography>
        </CardContent>
      </Card>

      {/* Loss Tolerance */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Loss Tolerance
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            What's the maximum temporary loss you could tolerate?
          </Typography>
          <FormControl component="fieldset">
            <RadioGroup
              value={lossTolerance}
              onChange={(e) => setLossTolerance(e.target.value)}
            >
              <FormControlLabel
                value="0-10"
                control={<Radio />}
                label="0-10% (I prefer stability)"
              />
              <FormControlLabel
                value="10-20"
                control={<Radio />}
                label="10-20% (I can handle moderate swings)"
              />
              <FormControlLabel
                value="20-30"
                control={<Radio />}
                label="20-30% (I'm comfortable with volatility)"
              />
              <FormControlLabel
                value="30+"
                control={<Radio />}
                label="30%+ (I focus on long-term growth)"
              />
            </RadioGroup>
          </FormControl>
        </CardContent>
      </Card>

      {/* Warning Message */}
      <Box
        sx={{
          mt: 3,
          p: 2,
          bgcolor: 'warning.light',
          borderRadius: 2,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 1
        }}
      >
        <Warning sx={{ color: 'warning.dark', mt: 0.5 }} />
        <Box>
          <Typography variant="subtitle2" color="warning.dark">
            Important Note
          </Typography>
          <Typography variant="caption" color="warning.dark">
            All investments carry risk. Past performance doesn't guarantee future results. 
            We'll help you build a diversified portfolio to manage risk, but losses are possible.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default RiskProfileStep;