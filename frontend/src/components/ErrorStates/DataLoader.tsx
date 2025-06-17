import React, { ReactNode } from 'react';
import { Box } from '@mui/material';
import ErrorState, { ErrorType } from './ErrorState';
import LoadingState from './LoadingState';
import EmptyState, { EmptyType } from './EmptyState';
import { ApiError } from '@/services/api/apiClient';
import { getErrorMessage } from '@/utils/errorMessages';

interface DataLoaderProps {
  loading: boolean;
  error?: Error | ApiError | null;
  empty?: boolean;
  children: ReactNode;
  
  // Loading props
  loadingMessage?: string;
  loadingVariant?: 'spinner' | 'skeleton' | 'dots';
  skeletonRows?: number;
  
  // Error props
  errorType?: ErrorType;
  errorTitle?: string;
  errorMessage?: string;
  onRetry?: () => void;
  errorAction?: {
    label: string;
    onClick: () => void;
  };
  
  // Empty props
  emptyType?: EmptyType;
  emptyTitle?: string;
  emptyMessage?: string;
  emptyAction?: {
    label: string;
    onClick: () => void;
    icon?: ReactNode;
  };
  
  // General props
  compact?: boolean;
  minHeight?: number | string;
}

const DataLoader: React.FC<DataLoaderProps> = ({
  loading,
  error,
  empty = false,
  children,
  
  // Loading props
  loadingMessage,
  loadingVariant = 'spinner',
  skeletonRows = 3,
  
  // Error props
  errorType,
  errorTitle,
  errorMessage,
  onRetry,
  errorAction,
  
  // Empty props
  emptyType = 'noData',
  emptyTitle,
  emptyMessage,
  emptyAction,
  
  // General props
  compact = false,
  minHeight
}) => {
  // Determine error type based on error
  const determineErrorType = (): ErrorType => {
    if (errorType) return errorType;
    
    if (error instanceof ApiError) {
      if (error.status === 0 || error.code === 'NETWORK_ERROR') {
        return 'network';
      }
      if (error.status >= 500) {
        return 'server';
      }
      if (error.status === 404) {
        return 'notFound';
      }
      if (error.status === 403) {
        return 'permission';
      }
    }
    
    return 'generic';
  };

  const wrapper = (content: ReactNode) => {
    if (minHeight) {
      return (
        <Box sx={{ minHeight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {content}
        </Box>
      );
    }
    return <>{content}</>;
  };

  // Loading state
  if (loading) {
    return wrapper(
      <LoadingState
        message={loadingMessage}
        variant={loadingVariant}
        rows={skeletonRows}
        compact={compact}
      />
    );
  }

  // Error state
  if (error) {
    return wrapper(
      <ErrorState
        type={determineErrorType()}
        title={errorTitle}
        message={errorMessage || getErrorMessage(error)}
        onRetry={onRetry}
        action={errorAction}
        compact={compact}
      />
    );
  }

  // Empty state
  if (empty) {
    return wrapper(
      <EmptyState
        type={emptyType}
        title={emptyTitle}
        message={emptyMessage}
        action={emptyAction}
        compact={compact}
      />
    );
  }

  // Success state - render children
  return <>{children}</>;
};

export default DataLoader;