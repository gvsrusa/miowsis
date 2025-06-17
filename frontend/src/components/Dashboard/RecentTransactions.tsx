import React from 'react';
import {
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  Chip,
  Box,
  Skeleton,
  Alert
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AttachMoney,
  NaturePeople
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useTransactions } from '@/hooks/api';
import { formatDistanceToNow } from 'date-fns';

const RecentTransactions: React.FC = () => {
  const { data: transactionsData, isLoading, error } = useTransactions({ 
    page: 0, 
    size: 5 
  });

  const getTransactionIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'buy':
        return <TrendingUp />;
      case 'sell':
        return <TrendingDown />;
      case 'dividend':
        return <AttachMoney />;
      case 'round_up':
      case 'roundup':
        return <NaturePeople />;
      default:
        return <AttachMoney />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'buy':
      case 'round_up':
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

  const formatTransactionType = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (isLoading) {
    return (
      <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <ListItem key={i} sx={{ px: 0 }}>
            <ListItemAvatar>
              <Skeleton variant="circular" width={40} height={40} />
            </ListItemAvatar>
            <ListItemText
              primary={<Skeleton variant="text" width="60%" />}
              secondary={<Skeleton variant="text" width="40%" />}
            />
          </ListItem>
        ))}
      </List>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        Failed to load recent transactions. Please try again later.
      </Alert>
    );
  }

  const transactions = transactionsData?.content || [];

  if (transactions.length === 0) {
    return (
      <Box textAlign="center" py={4}>
        <Typography color="textSecondary">
          No transactions yet. Start investing to see your activity here!
        </Typography>
      </Box>
    );
  }

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
                      {transaction.securityName || transaction.symbol}
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="caption" color="textSecondary">
                        {transaction.symbol}
                      </Typography>
                      {transaction.quantity && (
                        <Typography variant="caption" color="textSecondary">
                          • {transaction.quantity} shares
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  <Box textAlign="right">
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      color={transaction.type === 'SELL' ? 'error.main' : 'success.main'}
                    >
                      {transaction.type === 'SELL' ? '-' : '+'}${Math.abs(transaction.amount).toFixed(2)}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {formatDistanceToNow(new Date(transaction.transactionDate), { addSuffix: true })}
                    </Typography>
                  </Box>
                </Box>
              }
              secondary={
                <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                  <Chip
                    label={formatTransactionType(transaction.type)}
                    size="small"
                    color={getTransactionColor(transaction.type) as any}
                    variant="outlined"
                  />
                  {transaction.esgScore && (
                    <Chip
                      label={`ESG: ${Math.round(transaction.esgScore)}`}
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