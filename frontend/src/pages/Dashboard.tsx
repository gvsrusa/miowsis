import React, { useState, useMemo } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  IconButton,
  Button,
  Chip,
  useTheme,
  Skeleton,
  Alert
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Add,
  MoreVert,
  NaturePeople,
  AccountBalance,
  ShowChart,
  Timeline
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import PortfolioChart from '@components/Dashboard/PortfolioChart';
import ESGScoreWidget from '@components/Dashboard/ESGScoreWidget';
import RecentTransactions from '@components/Dashboard/RecentTransactions';
import MarketNews from '@components/Dashboard/MarketNews';
import QuickActions from '@components/Dashboard/QuickActions';
import { usePortfolio, usePortfolioPerformance, useESGScore } from '@/hooks/api';

interface DashboardMetric {
  title: string;
  value: string;
  change: number;
  changeLabel: string;
  icon: React.ReactNode;
  color: string;
  isLoading?: boolean;
}

const Dashboard: React.FC = () => {
  const theme = useTheme();
  const [timeRange, setTimeRange] = useState('1W');

  // Fetch data using React Query hooks
  const { data: portfolio, isLoading: portfolioLoading, error: portfolioError } = usePortfolio();
  const { data: performance, isLoading: performanceLoading } = usePortfolioPerformance(timeRange);
  const { data: esgScore, isLoading: esgLoading } = useESGScore();

  // Calculate metrics from real data
  const metrics: DashboardMetric[] = useMemo(() => {
    const totalValue = portfolio?.totalValue || 0;
    const dailyChangeValue = performance?.dailyChange || { amount: 0, percentage: 0 };
    const monthlyReturnValue = performance?.monthlyReturn || { amount: 0, percentage: 0 };
    const dailyChange = typeof dailyChangeValue === 'number' ? { amount: dailyChangeValue, percentage: 0 } : dailyChangeValue;
    const monthlyReturn = typeof monthlyReturnValue === 'number' ? { amount: monthlyReturnValue, percentage: 0 } : monthlyReturnValue;
    const esgValue = esgScore?.totalScore || 0;
    const esgChange = esgScore?.monthlyChange || 0;

    return [
      {
        title: 'Total Portfolio Value',
        value: portfolioLoading ? '...' : `$${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        change: dailyChange.percentage,
        changeLabel: `${dailyChange.amount >= 0 ? '+' : ''}$${Math.abs(dailyChange.amount).toFixed(2)}`,
        icon: <AccountBalance />,
        color: theme.palette.primary.main,
        isLoading: portfolioLoading
      },
      {
        title: 'Today\'s Gain/Loss',
        value: performanceLoading ? '...' : `${dailyChange.amount >= 0 ? '+' : ''}$${Math.abs(dailyChange.amount).toFixed(2)}`,
        change: dailyChange.percentage,
        changeLabel: `${dailyChange.percentage >= 0 ? '+' : ''}${dailyChange.percentage.toFixed(2)}%`,
        icon: <ShowChart />,
        color: dailyChange.amount >= 0 ? theme.palette.success.main : theme.palette.error.main,
        isLoading: performanceLoading
      },
      {
        title: 'ESG Impact Score',
        value: esgLoading ? '...' : `${Math.round(esgValue)}/100`,
        change: esgChange,
        changeLabel: `${esgChange >= 0 ? '+' : ''}${esgChange} points`,
        icon: <NaturePeople />,
        color: theme.palette.secondary.main,
        isLoading: esgLoading
      },
      {
        title: 'Monthly Returns',
        value: performanceLoading ? '...' : `${monthlyReturn.percentage >= 0 ? '+' : ''}${monthlyReturn.percentage.toFixed(2)}%`,
        change: monthlyReturn.percentage,
        changeLabel: `${monthlyReturn.amount >= 0 ? '+' : ''}$${Math.abs(monthlyReturn.amount).toFixed(2)}`,
        icon: <Timeline />,
        color: monthlyReturn.percentage >= 0 ? theme.palette.success.main : theme.palette.error.main,
        isLoading: performanceLoading
      }
    ];
  }, [portfolio, performance, esgScore, portfolioLoading, performanceLoading, esgLoading, theme]);

  const timeRanges = ['1D', '1W', '1M', '3M', '1Y', 'ALL'];

  // Show error alert if there's a critical error
  if (portfolioError) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load portfolio data. Please try refreshing the page.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="flex-end" alignItems="center" mb={4}>
        <Button
          variant="contained"
          startIcon={<Add />}
          color="primary"
        >
          Invest Now
        </Button>
      </Box>

      {/* Metrics Cards */}
      <Grid container spacing={3} mb={4}>
        {metrics.map((metric, index) => (
          <Grid item xs={12} sm={6} lg={3} key={index}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card
                sx={{
                  height: '100%',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)'
                  }
                }}
              >
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                      <Typography color="textSecondary" gutterBottom variant="body2">
                        {metric.title}
                      </Typography>
                      {metric.isLoading ? (
                        <Skeleton variant="text" width={120} height={32} />
                      ) : (
                        <Typography variant="h5" component="div" fontWeight={600}>
                          {metric.value}
                        </Typography>
                      )}
                      <Box display="flex" alignItems="center" mt={1}>
                        {metric.isLoading ? (
                          <Skeleton variant="text" width={80} height={20} />
                        ) : (
                          <>
                            {metric.change >= 0 ? (
                              <TrendingUp sx={{ color: theme.palette.success.main, fontSize: 20 }} />
                            ) : (
                              <TrendingDown sx={{ color: theme.palette.error.main, fontSize: 20 }} />
                            )}
                            <Typography
                              variant="body2"
                              sx={{
                                color: metric.change >= 0 ? theme.palette.success.main : theme.palette.error.main,
                                ml: 0.5
                              }}
                            >
                              {metric.changeLabel}
                            </Typography>
                          </>
                        )}
                      </Box>
                    </Box>
                    <Box
                      sx={{
                        backgroundColor: metric.color + '20',
                        borderRadius: 2,
                        p: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {React.cloneElement(metric.icon as React.ReactElement, {
                        sx: { color: metric.color, fontSize: 24 }
                      })}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      {/* Main Content Grid */}
      <Grid container spacing={3}>
        {/* Portfolio Chart */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight={500}>
                Portfolio Performance
              </Typography>
              <Box display="flex" gap={1}>
                {timeRanges.map((range) => (
                  <Chip
                    key={range}
                    label={range}
                    onClick={() => setTimeRange(range)}
                    color={timeRange === range ? 'primary' : 'default'}
                    variant={timeRange === range ? 'filled' : 'outlined'}
                    size="small"
                  />
                ))}
              </Box>
            </Box>
            <PortfolioChart timeRange={timeRange} />
          </Paper>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" fontWeight={500} mb={2}>
              Quick Actions
            </Typography>
            <QuickActions />
          </Paper>
        </Grid>

        {/* ESG Score Widget */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight={500}>
                ESG Impact Score
              </Typography>
              <IconButton size="small">
                <MoreVert />
              </IconButton>
            </Box>
            <ESGScoreWidget />
          </Paper>
        </Grid>

        {/* Recent Transactions */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight={500}>
                Recent Transactions
              </Typography>
              <Button size="small">View All</Button>
            </Box>
            <RecentTransactions />
          </Paper>
        </Grid>

        {/* Market News */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight={500}>
                ESG Market News
              </Typography>
              <Button size="small">View All</Button>
            </Box>
            <MarketNews />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;