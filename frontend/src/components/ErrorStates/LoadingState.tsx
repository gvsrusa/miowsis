import React from 'react';
import { Box, CircularProgress, Typography, Skeleton } from '@mui/material';
import { motion } from 'framer-motion';

interface LoadingStateProps {
  message?: string;
  variant?: 'spinner' | 'skeleton' | 'dots';
  rows?: number;
  compact?: boolean;
}

const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
  variant = 'spinner',
  rows = 3,
  compact = false
}) => {
  if (variant === 'skeleton') {
    return (
      <Box sx={{ p: compact ? 1 : 2 }}>
        {Array.from({ length: rows }).map((_, index) => (
          <Skeleton
            key={index}
            variant="text"
            sx={{ mb: 1 }}
            height={compact ? 20 : 30}
            animation="wave"
          />
        ))}
      </Box>
    );
  }

  if (variant === 'dots') {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
          p: compact ? 2 : 4
        }}
      >
        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            animate={{
              y: [0, -10, 0]
            }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: index * 0.2
            }}
          >
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: 'primary.main'
              }}
            />
          </motion.div>
        ))}
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: compact ? 2 : 4,
        minHeight: compact ? 100 : 200
      }}
    >
      <CircularProgress
        size={compact ? 30 : 40}
        thickness={4}
        sx={{ mb: 2 }}
      />
      {message && (
        <Typography
          variant={compact ? 'body2' : 'body1'}
          color="text.secondary"
        >
          {message}
        </Typography>
      )}
    </Box>
  );
};

export default LoadingState;