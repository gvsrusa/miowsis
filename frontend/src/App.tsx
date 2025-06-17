import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from './hooks/useAuth';
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';
import PageErrorBoundary from './components/ErrorBoundary/PageErrorBoundary';
import NotificationStack from './components/Notifications/NotificationStack';

// Lazy load pages for better performance
const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Auth/Login'));
const Register = lazy(() => import('./pages/Auth/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Portfolio = lazy(() => import('./pages/Portfolio'));
const ESGImpact = lazy(() => import('./pages/ESGImpact'));
const Transactions = lazy(() => import('./pages/Transactions'));
const Settings = lazy(() => import('./pages/Settings'));
const Onboarding = lazy(() => import('./pages/Onboarding'));

const LoadingFallback = () => (
  <Box
    display="flex"
    justifyContent="center"
    alignItems="center"
    minHeight="100vh"
  >
    <CircularProgress size={60} thickness={4} />
  </Box>
);

function App() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingFallback />;
  }

  return (
    <ErrorBoundary>
      <NotificationStack />
      <AnimatePresence mode="wait">
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<PageErrorBoundary><Landing /></PageErrorBoundary>} />
            <Route path="/login" element={<PageErrorBoundary><Login /></PageErrorBoundary>} />
            <Route path="/register" element={<PageErrorBoundary><Register /></PageErrorBoundary>} />

            {/* Protected routes */}
            <Route
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<PageErrorBoundary><Dashboard /></PageErrorBoundary>} />
              <Route path="/portfolio" element={<PageErrorBoundary><Portfolio /></PageErrorBoundary>} />
              <Route path="/impact" element={<PageErrorBoundary><ESGImpact /></PageErrorBoundary>} />
              <Route path="/transactions" element={<PageErrorBoundary><Transactions /></PageErrorBoundary>} />
              <Route path="/settings" element={<PageErrorBoundary><Settings /></PageErrorBoundary>} />
              <Route path="/onboarding" element={<PageErrorBoundary><Onboarding /></PageErrorBoundary>} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AnimatePresence>
    </ErrorBoundary>
  );
}

export default App;