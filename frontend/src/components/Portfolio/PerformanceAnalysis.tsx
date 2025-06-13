import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  IconButton,
  Tooltip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
  Divider,
  LinearProgress,
  Avatar
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Info,
  CompareArrows,
  Timeline,
  Assessment,
  Speed,
  ShowChart,
  PieChart,
  AttachMoney
} from '@mui/icons-material';
import { Line, Bar, Radar } from 'react-chartjs-2';
import { motion } from 'framer-motion';
import '@utils/chartConfig';

interface PerformanceMetric {
  label: string;
  value: string;
  change: number;
  changePercent: number;
  description: string;
  icon: React.ReactNode;
  color: string;
}

interface BenchmarkData {
  name: string;
  symbol: string;
  performance: number;
}

const PerformanceAnalysis: React.FC = () => {
  const theme = useTheme();
  const [timeRange, setTimeRange] = useState('1M');
  const [comparison, setComparison] = useState('SP500');

  // Performance metrics
  const performanceMetrics: PerformanceMetric[] = [
    {
      label: 'Total Return',
      value: '$2,543.67',
      change: 543.67,
      changePercent: 25.43,
      description: 'Total portfolio gain/loss',
      icon: <AttachMoney />,
      color: theme.palette.success.main
    },
    {
      label: 'Daily Volatility',
      value: '1.23%',
      change: -0.12,
      changePercent: -8.89,
      description: 'Standard deviation of daily returns',
      icon: <Timeline />,
      color: theme.palette.info.main
    },
    {
      label: 'Sharpe Ratio',
      value: '1.85',
      change: 0.15,
      changePercent: 8.82,
      description: 'Risk-adjusted return metric',
      icon: <Speed />,
      color: theme.palette.primary.main
    },
    {
      label: 'Alpha',
      value: '3.21%',
      change: 0.45,
      changePercent: 16.30,
      description: 'Return above market benchmark',
      icon: <TrendingUp />,
      color: theme.palette.success.main
    },
    {
      label: 'Beta',
      value: '0.89',
      change: -0.05,
      changePercent: -5.32,
      description: 'Market correlation coefficient',
      icon: <CompareArrows />,
      color: theme.palette.warning.main
    },
    {
      label: 'Max Drawdown',
      value: '-5.67%',
      change: 1.23,
      changePercent: 17.84,
      description: 'Largest peak-to-trough decline',
      icon: <TrendingDown />,
      color: theme.palette.error.main
    }
  ];

  // Benchmark comparison data
  const benchmarks: BenchmarkData[] = [
    { name: 'S&P 500', symbol: 'SP500', performance: 18.25 },
    { name: 'NASDAQ', symbol: 'NASDAQ', performance: 22.15 },
    { name: 'Russell 2000', symbol: 'RUT', performance: 15.67 },
    { name: 'ESG Leaders', symbol: 'ESGL', performance: 20.34 }
  ];

  // Chart data for performance over time
  const performanceChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Portfolio',
        data: [0, 5.2, 8.3, 12.1, 18.7, 25.43],
        borderColor: theme.palette.primary.main,
        backgroundColor: theme.palette.primary.main + '20',
        fill: true,
        tension: 0.4
      },
      {
        label: comparison,
        data: [0, 3.5, 6.2, 9.8, 14.2, 18.25],
        borderColor: theme.palette.secondary.main,
        backgroundColor: theme.palette.secondary.main + '20',
        fill: true,
        tension: 0.4
      }
    ]
  };

  // Risk-return scatter data
  const riskReturnData = {
    labels: ['Portfolio', 'S&P 500', 'NASDAQ', 'Bonds', 'Gold', 'Real Estate'],
    datasets: [
      {
        label: 'Risk vs Return',
        data: [
          { x: 12.5, y: 25.43 },
          { x: 15.2, y: 18.25 },
          { x: 18.7, y: 22.15 },
          { x: 5.3, y: 4.8 },
          { x: 16.1, y: 8.2 },
          { x: 14.5, y: 12.3 }
        ],
        backgroundColor: [
          theme.palette.primary.main,
          theme.palette.secondary.main,
          theme.palette.info.main,
          theme.palette.warning.main,
          theme.palette.error.main,
          theme.palette.success.main
        ],
        pointRadius: 8,
        pointHoverRadius: 10
      }
    ]
  };

  // Attribution analysis data
  const attributionData = {
    labels: ['Stock Selection', 'Sector Allocation', 'Market Timing', 'Currency', 'Other'],
    datasets: [
      {
        label: 'Performance Attribution (%)',
        data: [8.5, 6.2, 4.8, 2.3, 3.63],
        backgroundColor: [
          theme.palette.primary.main,
          theme.palette.secondary.main,
          theme.palette.success.main,
          theme.palette.warning.main,
          theme.palette.info.main
        ]
      }
    ]
  };

  // Sector performance data
  const sectorPerformance = [
    { sector: 'Technology', weight: 35, return: 32.5, contribution: 11.38 },
    { sector: 'Healthcare', weight: 20, return: 18.2, contribution: 3.64 },
    { sector: 'Financials', weight: 15, return: 22.8, contribution: 3.42 },
    { sector: 'Energy', weight: 10, return: 45.6, contribution: 4.56 },
    { sector: 'Consumer', weight: 12, return: 15.3, contribution: 1.84 },
    { sector: 'Industrial', weight: 8, return: 8.5, contribution: 0.68 }
  ];

  return (
    <Box>
      {/* Time Range Selector */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">Performance Analysis</Typography>
        <Box display="flex" gap={2}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Benchmark</InputLabel>
            <Select
              value={comparison}
              label="Benchmark"
              onChange={(e) => setComparison(e.target.value)}
            >
              {benchmarks.map((benchmark) => (
                <MenuItem key={benchmark.symbol} value={benchmark.symbol}>
                  {benchmark.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <ToggleButtonGroup
            value={timeRange}
            exclusive
            onChange={(e, value) => value && setTimeRange(value)}
            size="small"
          >
            <ToggleButton value="1D">1D</ToggleButton>
            <ToggleButton value="1W">1W</ToggleButton>
            <ToggleButton value="1M">1M</ToggleButton>
            <ToggleButton value="3M">3M</ToggleButton>
            <ToggleButton value="YTD">YTD</ToggleButton>
            <ToggleButton value="1Y">1Y</ToggleButton>
            <ToggleButton value="ALL">ALL</ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>

      {/* Key Performance Metrics */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {performanceMetrics.map((metric, index) => (
          <Grid item xs={12} sm={6} md={4} key={metric.label}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="body2" color="textSecondary">
                          {metric.label}
                        </Typography>
                        <Tooltip title={metric.description}>
                          <IconButton size="small">
                            <Info fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                      <Typography variant="h5" fontWeight={600} sx={{ mt: 1 }}>
                        {metric.value}
                      </Typography>
                      <Box display="flex" alignItems="center" gap={0.5} sx={{ mt: 1 }}>
                        {metric.changePercent >= 0 ? (
                          <TrendingUp sx={{ color: theme.palette.success.main, fontSize: 16 }} />
                        ) : (
                          <TrendingDown sx={{ color: theme.palette.error.main, fontSize: 16 }} />
                        )}
                        <Typography
                          variant="caption"
                          color={metric.changePercent >= 0 ? 'success.main' : 'error.main'}
                        >
                          {metric.changePercent >= 0 ? '+' : ''}{metric.changePercent.toFixed(2)}%
                        </Typography>
                      </Box>
                    </Box>
                    <Avatar
                      sx={{
                        bgcolor: metric.color + '20',
                        color: metric.color,
                        width: 40,
                        height: 40
                      }}
                    >
                      {React.cloneElement(metric.icon as React.ReactElement, { fontSize: 'small' })}
                    </Avatar>
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      {/* Performance Charts */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Cumulative Performance Comparison
              </Typography>
              <Box height={300}>
                <Line
                  data={performanceChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top'
                      },
                      tooltip: {
                        mode: 'index',
                        intersect: false
                      }
                    },
                    scales: {
                      y: {
                        ticks: {
                          callback: (value) => value + '%'
                        }
                      }
                    }
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Performance Attribution
              </Typography>
              <Box height={300}>
                <Bar
                  data={attributionData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    indexAxis: 'y',
                    plugins: {
                      legend: {
                        display: false
                      }
                    },
                    scales: {
                      x: {
                        ticks: {
                          callback: (value) => value + '%'
                        }
                      }
                    }
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Sector Performance Table */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Sector Performance Breakdown
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Sector</TableCell>
                  <TableCell align="right">Weight</TableCell>
                  <TableCell align="right">Return</TableCell>
                  <TableCell align="right">Contribution</TableCell>
                  <TableCell align="center">Performance</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sectorPerformance.map((sector) => (
                  <TableRow key={sector.sector}>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <PieChart sx={{ fontSize: 20, color: theme.palette.primary.main }} />
                        {sector.sector}
                      </Box>
                    </TableCell>
                    <TableCell align="right">{sector.weight}%</TableCell>
                    <TableCell align="right">
                      <Typography
                        color={sector.return >= 0 ? 'success.main' : 'error.main'}
                        fontWeight={500}
                      >
                        {sector.return >= 0 ? '+' : ''}{sector.return.toFixed(1)}%
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography
                        color={sector.contribution >= 0 ? 'success.main' : 'error.main'}
                      >
                        {sector.contribution >= 0 ? '+' : ''}{sector.contribution.toFixed(2)}%
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ width: '100%' }}>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(Math.abs(sector.return), 100)}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            bgcolor: theme.palette.grey[200],
                            '& .MuiLinearProgress-bar': {
                              bgcolor: sector.return >= 0 ? theme.palette.success.main : theme.palette.error.main
                            }
                          }}
                        />
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Benchmark Comparison */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Benchmark Comparison
          </Typography>
          <Grid container spacing={2}>
            {benchmarks.map((benchmark) => (
              <Grid item xs={12} sm={6} md={3} key={benchmark.symbol}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    {benchmark.name}
                  </Typography>
                  <Typography variant="h6" fontWeight={600}>
                    {benchmark.performance.toFixed(2)}%
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1} sx={{ mt: 1 }}>
                    <Chip
                      label={
                        benchmark.performance < 25.43
                          ? `Outperformed by ${(25.43 - benchmark.performance).toFixed(2)}%`
                          : `Underperformed by ${(benchmark.performance - 25.43).toFixed(2)}%`
                      }
                      size="small"
                      color={benchmark.performance < 25.43 ? 'success' : 'error'}
                      variant="outlined"
                    />
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default PerformanceAnalysis;