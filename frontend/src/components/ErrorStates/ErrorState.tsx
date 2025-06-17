import React from 'react';
import { Box, Typography, Button, SvgIcon } from '@mui/material';
import { Refresh, ErrorOutline, WifiOff, SearchOff } from '@mui/icons-material';
import { motion } from 'framer-motion';

export type ErrorType = 'network' | 'server' | 'notFound' | 'permission' | 'generic';

interface ErrorStateProps {
  type?: ErrorType;
  title?: string;
  message?: string;
  onRetry?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
  compact?: boolean;
}

const errorConfigs: Record<ErrorType, {
  icon: typeof SvgIcon;
  defaultTitle: string;
  defaultMessage: string;
  color: string;
}> = {
  network: {
    icon: WifiOff,
    defaultTitle: 'No Connection',
    defaultMessage: 'Please check your internet connection and try again.',
    color: 'warning.main'
  },
  server: {
    icon: ErrorOutline,
    defaultTitle: 'Server Error',
    defaultMessage: 'Something went wrong on our end. Please try again later.',
    color: 'error.main'
  },
  notFound: {
    icon: SearchOff,
    defaultTitle: 'Not Found',
    defaultMessage: 'We couldn\'t find what you\'re looking for.',
    color: 'info.main'
  },
  permission: {
    icon: ErrorOutline,
    defaultTitle: 'Access Denied',
    defaultMessage: 'You don\'t have permission to view this content.',
    color: 'error.main'
  },
  generic: {
    icon: ErrorOutline,
    defaultTitle: 'Something Went Wrong',
    defaultMessage: 'An unexpected error occurred. Please try again.',
    color: 'error.main'
  }
};

const ErrorState: React.FC<ErrorStateProps> = ({
  type = 'generic',
  title,
  message,
  onRetry,
  action,
  compact = false
}) => {
  const config = errorConfigs[type];
  const Icon = config.icon;

  if (compact) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2,
          gap: 2,
          backgroundColor: 'background.paper',
          borderRadius: 1,
          border: 1,
          borderColor: 'divider'
        }}
      >
        <Icon sx={{ color: config.color, fontSize: 24 }} />
        <Typography variant="body2" color="text.secondary">
          {message || config.defaultMessage}
        </Typography>
        {onRetry && (
          <Button size="small" onClick={onRetry} startIcon={<Refresh />}>
            Retry
          </Button>
        )}
      </Box>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          p: 4,
          minHeight: 300
        }}
      >
        <Box
          sx={{
            mb: 3,
            p: 2,
            borderRadius: '50%',
            backgroundColor: config.color + '20',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Icon sx={{ fontSize: 48, color: config.color }} />
        </Box>
        
        <Typography variant="h5" gutterBottom fontWeight={500}>
          {title || config.defaultTitle}
        </Typography>
        
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ mb: 3, maxWidth: 400 }}
        >
          {message || config.defaultMessage}
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          {onRetry && (
            <Button
              variant="contained"
              onClick={onRetry}
              startIcon={<Refresh />}
            >
              Try Again
            </Button>
          )}
          {action && (
            <Button
              variant={onRetry ? 'outlined' : 'contained'}
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          )}
        </Box>
      </Box>
    </motion.div>
  );
};

export default ErrorState;