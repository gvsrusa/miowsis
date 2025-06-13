import React from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Add,
  AccountBalanceWallet,
  AutoGraph,
  Loop,
  Info,
  TrendingUp
} from '@mui/icons-material';
import { motion } from 'framer-motion';

interface QuickAction {
  title: string;
  description: string;
  icon: React.ReactNode;
  action: () => void;
  color: string;
}

const QuickActions: React.FC = () => {
  const actions: QuickAction[] = [
    {
      title: 'Add Funds',
      description: 'Deposit money to invest',
      icon: <AccountBalanceWallet />,
      action: () => console.log('Add funds'),
      color: 'primary'
    },
    {
      title: 'Auto-Invest',
      description: 'Set up recurring investments',
      icon: <Loop />,
      action: () => console.log('Auto invest'),
      color: 'secondary'
    },
    {
      title: 'Round-ups',
      description: 'Enable spare change investing',
      icon: <AutoGraph />,
      action: () => console.log('Round-ups'),
      color: 'success'
    },
    {
      title: 'Rebalance',
      description: 'Optimize your portfolio',
      icon: <TrendingUp />,
      action: () => console.log('Rebalance'),
      color: 'info'
    }
  ];

  return (
    <Box>
      {/* Account Summary */}
      <Card sx={{ mb: 3, bgcolor: 'primary.main', color: 'white' }}>
        <CardContent>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            Available to Invest
          </Typography>
          <Typography variant="h4" fontWeight={600}>
            $2,145.50
          </Typography>
          <Box display="flex" alignItems="center" gap={0.5} mt={1}>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Next round-up: $0.45
            </Typography>
            <Tooltip title="Your next purchase will round up this amount">
              <IconButton size="small" sx={{ color: 'white', opacity: 0.7 }}>
                <Info fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </CardContent>
      </Card>

      <Divider sx={{ mb: 2 }} />

      {/* Quick Actions */}
      <Box display="flex" flexDirection="column" gap={2}>
        {actions.map((action, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <Button
              fullWidth
              variant="outlined"
              onClick={action.action}
              sx={{
                justifyContent: 'flex-start',
                p: 2,
                borderColor: 'divider',
                '&:hover': {
                  borderColor: `${action.color}.main`,
                  bgcolor: `${action.color}.main` + '10'
                }
              }}
            >
              <Box
                sx={{
                  bgcolor: `${action.color}.main` + '20',
                  borderRadius: 2,
                  p: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mr: 2
                }}
              >
                {React.cloneElement(action.icon as React.ReactElement, {
                  sx: { color: `${action.color}.main`, fontSize: 24 }
                })}
              </Box>
              <Box textAlign="left">
                <Typography variant="body1" fontWeight={500}>
                  {action.title}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {action.description}
                </Typography>
              </Box>
            </Button>
          </motion.div>
        ))}
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* Investment Tip */}
      <Card sx={{ bgcolor: 'info.main' + '10', border: '1px solid', borderColor: 'info.main' + '30' }}>
        <CardContent sx={{ p: 2 }}>
          <Box display="flex" alignItems="flex-start" gap={1}>
            <Info sx={{ color: 'info.main', fontSize: 20, mt: 0.5 }} />
            <Box>
              <Typography variant="body2" fontWeight={500} color="info.main">
                Investment Tip
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Enable round-ups to automatically invest your spare change. Small amounts add up over time!
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default QuickActions;