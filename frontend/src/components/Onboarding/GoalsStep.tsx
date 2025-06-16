import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  TextField,
  InputAdornment,
  Avatar
} from '@mui/material';
import { motion } from 'framer-motion';
import {
  Home,
  School,
  BeachAccess,
  DirectionsCar,
  ChildCare,
  Savings,
  TrendingUp,
  AccountBalance
} from '@mui/icons-material';
import { RootState, AppDispatch } from '@/store';
import { updateData } from '@/store/slices/onboardingSlice';

interface InvestmentGoal {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const goals: InvestmentGoal[] = [
  {
    id: 'retirement',
    title: 'Retirement',
    description: 'Build long-term wealth for retirement',
    icon: <BeachAccess />,
    color: '#FF9800'
  },
  {
    id: 'house',
    title: 'Buy a Home',
    description: 'Save for a down payment',
    icon: <Home />,
    color: '#4CAF50'
  },
  {
    id: 'education',
    title: 'Education',
    description: 'Fund education expenses',
    icon: <School />,
    color: '#2196F3'
  },
  {
    id: 'car',
    title: 'Buy a Car',
    description: 'Save for a vehicle purchase',
    icon: <DirectionsCar />,
    color: '#9C27B0'
  },
  {
    id: 'children',
    title: "Children's Future",
    description: 'Invest for your children',
    icon: <ChildCare />,
    color: '#E91E63'
  },
  {
    id: 'emergency',
    title: 'Emergency Fund',
    description: 'Build financial security',
    icon: <Savings />,
    color: '#607D8B'
  },
  {
    id: 'growth',
    title: 'Wealth Growth',
    description: 'Grow your money over time',
    icon: <TrendingUp />,
    color: '#00BCD4'
  },
  {
    id: 'other',
    title: 'Other Goals',
    description: 'Custom investment objectives',
    icon: <AccountBalance />,
    color: '#795548'
  }
];

const GoalsStep: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { data } = useSelector((state: RootState) => state.onboarding);
  const [selectedGoals, setSelectedGoals] = useState<string[]>(data.investmentGoals);
  const [monthlyAmount, setMonthlyAmount] = useState(data.monthlyInvestment || 0);

  const handleGoalToggle = (goalId: string) => {
    const newGoals = selectedGoals.includes(goalId)
      ? selectedGoals.filter(id => id !== goalId)
      : [...selectedGoals, goalId];
    
    setSelectedGoals(newGoals);
    dispatch(updateData({ investmentGoals: newGoals }));
  };

  const handleAmountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const amount = parseFloat(event.target.value) || 0;
    setMonthlyAmount(amount);
    dispatch(updateData({ monthlyInvestment: amount }));
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom fontWeight={600} textAlign="center">
        What are your investment goals?
      </Typography>
      <Typography variant="body1" color="textSecondary" textAlign="center" sx={{ mb: 4 }}>
        Select all that apply. We'll help you create a portfolio to achieve them.
      </Typography>

      <Grid container spacing={2} sx={{ mb: 4 }}>
        {goals.map((goal, index) => (
          <Grid item xs={12} sm={6} md={4} key={goal.id}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Card
                sx={{
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  border: selectedGoals.includes(goal.id) ? 2 : 1,
                  borderColor: selectedGoals.includes(goal.id) ? goal.color : 'divider',
                  transform: selectedGoals.includes(goal.id) ? 'scale(1.05)' : 'scale(1)',
                  '&:hover': {
                    transform: 'scale(1.05)',
                    boxShadow: 3
                  }
                }}
                onClick={() => handleGoalToggle(goal.id)}
              >
                <CardContent sx={{ textAlign: 'center', p: 3 }}>
                  <Avatar
                    sx={{
                      bgcolor: selectedGoals.includes(goal.id) ? goal.color : 'grey.300',
                      width: 56,
                      height: 56,
                      mb: 2,
                      mx: 'auto',
                      transition: 'background-color 0.3s'
                    }}
                  >
                    {goal.icon}
                  </Avatar>
                  <Typography variant="subtitle1" fontWeight={500}>
                    {goal.title}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {goal.description}
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ bgcolor: 'grey.100', borderRadius: 2, p: 3 }}>
        <Typography variant="h6" gutterBottom>
          How much would you like to invest monthly?
        </Typography>
        <TextField
          fullWidth
          type="number"
          value={monthlyAmount}
          onChange={handleAmountChange}
          InputProps={{
            startAdornment: <InputAdornment position="start">$</InputAdornment>,
          }}
          placeholder="0"
          sx={{ bgcolor: 'white' }}
        />
        <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
          You can start with any amount and change it anytime. Average users invest $250/month.
        </Typography>
      </Box>

      {selectedGoals.length > 0 && (
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Selected goals:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
            {selectedGoals.map(goalId => {
              const goal = goals.find(g => g.id === goalId);
              return goal ? (
                <Chip
                  key={goalId}
                  label={goal.title}
                  sx={{ bgcolor: goal.color, color: 'white' }}
                />
              ) : null;
            })}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default GoalsStep;