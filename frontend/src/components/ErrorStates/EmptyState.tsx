import React from 'react';
import { Box, Typography, Button, SvgIcon } from '@mui/material';
import { Add, Search, FolderOpen, AssignmentTurnedIn } from '@mui/icons-material';
import { motion } from 'framer-motion';

export type EmptyType = 'noData' | 'noResults' | 'noItems' | 'allDone';

interface EmptyStateProps {
  type?: EmptyType;
  title?: string;
  message?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  compact?: boolean;
  illustration?: React.ReactNode;
}

const emptyConfigs: Record<EmptyType, {
  icon: typeof SvgIcon;
  defaultTitle: string;
  defaultMessage: string;
  color: string;
}> = {
  noData: {
    icon: FolderOpen,
    defaultTitle: 'No Data Yet',
    defaultMessage: 'Start by adding some data to see it here.',
    color: 'info.main'
  },
  noResults: {
    icon: Search,
    defaultTitle: 'No Results Found',
    defaultMessage: 'Try adjusting your search or filters.',
    color: 'warning.main'
  },
  noItems: {
    icon: FolderOpen,
    defaultTitle: 'No Items',
    defaultMessage: 'You don\'t have any items yet.',
    color: 'info.main'
  },
  allDone: {
    icon: AssignmentTurnedIn,
    defaultTitle: 'All Done!',
    defaultMessage: 'You\'ve completed all tasks.',
    color: 'success.main'
  }
};

const EmptyState: React.FC<EmptyStateProps> = ({
  type = 'noData',
  title,
  message,
  action,
  compact = false,
  illustration
}) => {
  const config = emptyConfigs[type];
  const Icon = config.icon;

  if (compact) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: 3,
          textAlign: 'center'
        }}
      >
        <Icon sx={{ fontSize: 32, color: 'text.secondary', mb: 1 }} />
        <Typography variant="body2" color="text.secondary">
          {title || config.defaultTitle}
        </Typography>
        {action && (
          <Button
            size="small"
            onClick={action.onClick}
            startIcon={action.icon || <Add />}
            sx={{ mt: 1 }}
          >
            {action.label}
          </Button>
        )}
      </Box>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
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
        {illustration || (
          <Box
            sx={{
              mb: 3,
              p: 3,
              borderRadius: '50%',
              backgroundColor: config.color + '10',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Icon sx={{ fontSize: 64, color: config.color }} />
          </Box>
        )}
        
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
        
        {action && (
          <Button
            variant="contained"
            onClick={action.onClick}
            startIcon={action.icon || <Add />}
            size="large"
          >
            {action.label}
          </Button>
        )}
      </Box>
    </motion.div>
  );
};

export default EmptyState;