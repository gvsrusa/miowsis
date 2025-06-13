import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  TextField,
  InputAdornment,
  Switch,
  FormControlLabel,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Chip
} from '@mui/material';
import {
  AccountBalance,
  CreditCard,
  Security,
  CheckCircle,
  Info,
  Savings,
  Loop,
  AttachMoney
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { RootState, AppDispatch } from '@/store';
import { updateData } from '@/store/slices/onboardingSlice';

const FundingStep: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { data } = useSelector((state: RootState) => state.onboarding);
  const [fundingMethod, setFundingMethod] = useState<'bank' | 'card'>('bank');
  const [initialDeposit, setInitialDeposit] = useState(100);
  const [enableRoundUps, setEnableRoundUps] = useState(true);
  const [recurringEnabled, setRecurringEnabled] = useState(false);
  const [recurringAmount, setRecurringAmount] = useState(250);

  const handleBankLink = () => {
    // Simulate bank linking process
    dispatch(updateData({ bankAccountLinked: true }));
  };

  const handleRoundUpsToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEnableRoundUps(event.target.checked);
    dispatch(updateData({ roundUpsEnabled: event.target.checked }));
  };

  const fundingMethods = [
    {
      id: 'bank',
      title: 'Link Bank Account',
      description: 'Connect your checking account for easy transfers',
      icon: <AccountBalance />,
      benefits: ['Instant verification', 'No fees', 'Automatic round-ups']
    },
    {
      id: 'card',
      title: 'Debit Card',
      description: 'Use your debit card for one-time deposits',
      icon: <CreditCard />,
      benefits: ['Quick setup', 'Immediate funding', 'Secure payments']
    }
  ];

  return (
    <Box>
      <Typography variant="h5" gutterBottom fontWeight={600} textAlign="center">
        Fund Your Account
      </Typography>
      <Typography variant="body1" color="textSecondary" textAlign="center" sx={{ mb: 4 }}>
        Choose how you'd like to add money to start investing
      </Typography>

      {/* Funding Methods */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {fundingMethods.map((method, index) => (
          <Grid item xs={12} md={6} key={method.id}>
            <motion.div
              initial={{ opacity: 0, x: index === 0 ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card
                sx={{
                  cursor: 'pointer',
                  border: fundingMethod === method.id ? 3 : 1,
                  borderColor: fundingMethod === method.id ? 'primary.main' : 'divider',
                  transition: 'all 0.3s'
                }}
                onClick={() => setFundingMethod(method.id as 'bank' | 'card')}
              >
                <CardContent>
                  <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <Avatar
                      sx={{
                        bgcolor: fundingMethod === method.id ? 'primary.main' : 'grey.300',
                        width: 48,
                        height: 48
                      }}
                    >
                      {method.icon}
                    </Avatar>
                    <Box>
                      <Typography variant="h6">{method.title}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        {method.description}
                      </Typography>
                    </Box>
                  </Box>
                  <List dense>
                    {method.benefits.map((benefit, i) => (
                      <ListItem key={i} sx={{ px: 0 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <CheckCircle color="success" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary={benefit} />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      {/* Bank Linking */}
      {fundingMethod === 'bank' && !data.bankAccountLinked && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2} mb={2}>
              <Security color="primary" />
              <Typography variant="h6">Secure Bank Connection</Typography>
            </Box>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
              We use bank-level encryption and never store your login credentials. 
              Your connection is powered by Plaid, trusted by millions.
            </Typography>
            <Button
              variant="contained"
              fullWidth
              size="large"
              onClick={handleBankLink}
            >
              Connect Bank Account
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Initial Deposit */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Initial Deposit
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
            Start your investment journey with any amount
          </Typography>
          <TextField
            fullWidth
            type="number"
            value={initialDeposit}
            onChange={(e) => setInitialDeposit(Number(e.target.value))}
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            }}
            sx={{ mb: 2 }}
          />
          <Box display="flex" gap={1} flexWrap="wrap">
            {[10, 50, 100, 250, 500].map((amount) => (
              <Chip
                key={amount}
                label={`$${amount}`}
                onClick={() => setInitialDeposit(amount)}
                color={initialDeposit === amount ? 'primary' : 'default'}
                variant={initialDeposit === amount ? 'filled' : 'outlined'}
              />
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* Round-Ups */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Box display="flex" alignItems="center" gap={2}>
              <Loop color="primary" />
              <Box>
                <Typography variant="h6">Enable Round-Ups</Typography>
                <Typography variant="body2" color="textSecondary">
                  Automatically invest spare change from purchases
                </Typography>
              </Box>
            </Box>
            <Switch
              checked={enableRoundUps}
              onChange={handleRoundUpsToggle}
              color="primary"
            />
          </Box>
          {enableRoundUps && (
            <Box
              sx={{
                bgcolor: 'primary.light',
                borderRadius: 2,
                p: 2,
                mt: 2
              }}
            >
              <Typography variant="body2">
                Example: Buy coffee for $3.50 → We round up to $4.00 and invest $0.50
              </Typography>
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                Average user invests an extra $30-50/month with round-ups!
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Recurring Investment */}
      <Card>
        <CardContent>
          <FormControlLabel
            control={
              <Switch
                checked={recurringEnabled}
                onChange={(e) => setRecurringEnabled(e.target.checked)}
                color="primary"
              />
            }
            label={
              <Box>
                <Typography variant="h6">Set Up Recurring Investment</Typography>
                <Typography variant="body2" color="textSecondary">
                  Automatically invest a fixed amount each month
                </Typography>
              </Box>
            }
          />
          {recurringEnabled && (
            <Box sx={{ mt: 3 }}>
              <TextField
                fullWidth
                type="number"
                value={recurringAmount}
                onChange={(e) => setRecurringAmount(Number(e.target.value))}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  endAdornment: <InputAdornment position="end">per month</InputAdornment>,
                }}
              />
              <Box display="flex" alignItems="center" gap={1} mt={2}>
                <Info fontSize="small" color="info" />
                <Typography variant="caption" color="textSecondary">
                  You can change or cancel recurring investments anytime
                </Typography>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Summary */}
      <Box
        sx={{
          mt: 4,
          p: 3,
          bgcolor: 'grey.100',
          borderRadius: 2
        }}
      >
        <Typography variant="h6" gutterBottom>
          Investment Summary
        </Typography>
        <Divider sx={{ my: 2 }} />
        <Box display="flex" justifyContent="space-between" mb={1}>
          <Typography>Initial Deposit:</Typography>
          <Typography fontWeight={500}>${initialDeposit}</Typography>
        </Box>
        {enableRoundUps && (
          <Box display="flex" justifyContent="space-between" mb={1}>
            <Typography>Estimated Round-Ups:</Typography>
            <Typography fontWeight={500}>~$40/month</Typography>
          </Box>
        )}
        {recurringEnabled && (
          <Box display="flex" justifyContent="space-between" mb={1}>
            <Typography>Recurring Investment:</Typography>
            <Typography fontWeight={500}>${recurringAmount}/month</Typography>
          </Box>
        )}
        <Divider sx={{ my: 2 }} />
        <Box display="flex" justifyContent="space-between">
          <Typography variant="h6">Estimated Monthly Total:</Typography>
          <Typography variant="h6" color="primary">
            ${initialDeposit + (enableRoundUps ? 40 : 0) + (recurringEnabled ? recurringAmount : 0)}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default FundingStep;