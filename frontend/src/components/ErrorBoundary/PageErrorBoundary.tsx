import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Home, ArrowBack } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import ErrorBoundary from './ErrorBoundary';

interface PageErrorBoundaryProps {
  children: React.ReactNode;
}

const PageErrorFallback: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '50vh',
        textAlign: 'center',
        p: 3
      }}
    >
      <Typography variant="h4" gutterBottom>
        Page Error
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        We encountered an error loading this page. Please try again.
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
        <Button
          variant="contained"
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
        >
          Go Back
        </Button>
        <Button
          variant="outlined"
          startIcon={<Home />}
          onClick={() => navigate('/')}
        >
          Go Home
        </Button>
      </Box>
    </Box>
  );
};

const PageErrorBoundary: React.FC<PageErrorBoundaryProps> = ({ children }) => {
  return (
    <ErrorBoundary fallback={<PageErrorFallback />}>
      {children}
    </ErrorBoundary>
  );
};

export default PageErrorBoundary;