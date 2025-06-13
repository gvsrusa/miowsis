import React from 'react';
import {
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  Chip,
  Box
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AttachMoney,
  NaturePeople
} from '@mui/icons-material';
import { motion } from 'framer-motion';

interface Transaction {
  id: string;
  type: 'buy' | 'sell' | 'dividend' | 'roundup';
  company: string;
  ticker: string;
  amount: number;
  shares?: number;
  date: string;
  esgScore?: number;
}

const RecentTransactions: React.FC = () => {
  const transactions: Transaction[] = [
    {
      id: '1',
      type: 'buy',
      company: 'Tesla Inc.',
      ticker: 'TSLA',
      amount: 250.00,
      shares: 0.5,
      date: '2 hours ago',
      esgScore: 89
    },
    {
      id: '2',
      type: 'roundup',
      company: 'Vanguard ESG',
      ticker: 'VESG',
      amount: 12.34,
      date: '5 hours ago',
      esgScore: 92
    },
    {
      id: '3',
      type: 'dividend',
      company: 'Apple Inc.',
      ticker: 'AAPL',
      amount: 15.23,
      date: '1 day ago',
      esgScore: 85
    },
    {
      id: '4',
      type: 'sell',
      company: 'Exxon Mobil',
      ticker: 'XOM',
      amount: 500.00,
      shares: 5,
      date: '2 days ago',
      esgScore: 45
    },
    {
      id: '5',
      type: 'buy',
      company: 'Microsoft',
      ticker: 'MSFT',
      amount: 300.00,
      shares: 1.2,
      date: '3 days ago',
      esgScore: 87
    }
  ];

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'buy':
        return <TrendingUp />;
      case 'sell':
        return <TrendingDown />;
      case 'dividend':
        return <AttachMoney />;
      case 'roundup':
        return <NaturePeople />;
      default:
        return <AttachMoney />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'buy':
      case 'roundup':
        return 'success';
      case 'sell':
        return 'error';
      case 'dividend':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
      {transactions.map((transaction, index) => (
        <motion.div
          key={transaction.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
        >
          <ListItem
            alignItems="flex-start"
            sx={{
              borderBottom: index < transactions.length - 1 ? '1px solid' : 'none',
              borderColor: 'divider',
              px: 0
            }}
          >
            <ListItemAvatar>
              <Avatar
                sx={{
                  bgcolor: `${getTransactionColor(transaction.type)}.light`,
                  color: `${getTransactionColor(transaction.type)}.main`
                }}
              >
                {getTransactionIcon(transaction.type)}
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              disableTypography
              primary={
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="body2" fontWeight={500}>
                      {transaction.company}
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="caption" color="textSecondary">
                        {transaction.ticker}
                      </Typography>
                      {transaction.shares && (
                        <Typography variant="caption" color="textSecondary">
                          • {transaction.shares} shares
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  <Box textAlign="right">
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      color={transaction.type === 'sell' ? 'error.main' : 'success.main'}
                    >
                      {transaction.type === 'sell' ? '-' : '+'}${transaction.amount.toFixed(2)}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {transaction.date}
                    </Typography>
                  </Box>
                </Box>
              }
              secondary={
                <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                  <Chip
                    label={transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                    size="small"
                    color={getTransactionColor(transaction.type) as any}
                    variant="outlined"
                  />
                  {transaction.esgScore && (
                    <Chip
                      label={`ESG: ${transaction.esgScore}`}
                      size="small"
                      color={transaction.esgScore >= 70 ? 'success' : 'warning'}
                      variant="outlined"
                    />
                  )}
                </Box>
              }
            />
          </ListItem>
        </motion.div>
      ))}
    </List>
  );
};

export default RecentTransactions;