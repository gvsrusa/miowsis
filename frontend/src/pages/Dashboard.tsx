import React, { useState } from 'react';
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
  useTheme
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

interface DashboardMetric {
  title: string;
  value: string;
  change: number;
  changeLabel: string;
  icon: React.ReactNode;
  color: string;
}

const Dashboard: React.FC = () => {
  const theme = useTheme();
  const [timeRange, setTimeRange] = useState('1W');

  const metrics: DashboardMetric[] = [
    {
      title: 'Total Portfolio Value',
      value: '$12,543.67',
      change: 5.23,
      changeLabel: '+$612.34',
      icon: <AccountBalance />,
      color: theme.palette.primary.main
    },
    {
      title: 'Today\'s Gain/Loss',
      value: '+$123.45',
      change: 1.02,
      changeLabel: '+1.02%',
      icon: <ShowChart />,
      color: theme.palette.success.main
    },
    {
      title: 'ESG Impact Score',
      value: '87/100',
      change: 3,
      changeLabel: '+3 points',
      icon: <NaturePeople />,
      color: theme.palette.secondary.main
    },
    {
      title: 'Monthly Returns',
      value: '+8.34%',
      change: 8.34,
      changeLabel: '+$982.12',
      icon: <Timeline />,
      color: theme.palette.info.main
    }
  ];

  const timeRanges = ['1D', '1W', '1M', '3M', '1Y', 'ALL'];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" fontWeight={600}>
          Dashboard
        </Typography>
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
                      <Typography variant="h5" component="div" fontWeight={600}>
                        {metric.value}
                      </Typography>
                      <Box display="flex" alignItems="center" mt={1}>
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