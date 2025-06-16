import React, { useState } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Button,
  Tabs,
  Tab,
  Avatar,
  LinearProgress
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Info,
  Add,
  Refresh,
  Download,
  PieChart,
  ShowChart,
  Assessment
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { Doughnut, Line } from 'react-chartjs-2';
import { useTheme } from '@mui/material/styles';
import '@utils/chartConfig'; // Import Chart.js configuration
import PerformanceAnalysis from '@components/Portfolio/PerformanceAnalysis';
import PortfolioAnalysis from '@components/Portfolio/PortfolioAnalysis';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const Portfolio: React.FC = () => {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);

  // Mock data
  const holdings = [
    {
      symbol: 'VTI',
      name: 'Vanguard Total Stock Market ETF',
      shares: 15.234,
      avgCost: 200.50,
      currentPrice: 225.30,
      value: 3432.42,
      gain: 378.12,
      gainPercent: 12.37,
      esgScore: 82,
      allocation: 10.2
    },
    {
      symbol: 'ICLN',
      name: 'iShares Global Clean Energy ETF',
      shares: 45.678,
      avgCost: 18.25,
      currentPrice: 21.80,
      value: 995.78,
      gain: 162.03,
      gainPercent: 19.44,
      esgScore: 95,
      allocation: 3.0
    },
    {
      symbol: 'AAPL',
      name: 'Apple Inc.',
      shares: 5.5,
      avgCost: 150.00,
      currentPrice: 195.50,
      value: 1075.25,
      gain: 250.25,
      gainPercent: 30.33,
      esgScore: 87,
      allocation: 3.2
    },
    {
      symbol: 'MSFT',
      name: 'Microsoft Corporation',
      shares: 8.25,
      avgCost: 300.00,
      currentPrice: 415.25,
      value: 3425.81,
      gain: 950.81,
      gainPercent: 38.42,
      esgScore: 92,
      allocation: 10.2
    },
    {
      symbol: 'TSLA',
      name: 'Tesla Inc.',
      shares: 2.1,
      avgCost: 800.00,
      currentPrice: 245.30,
      value: 515.13,
      gain: -1164.87,
      gainPercent: -69.35,
      esgScore: 78,
      allocation: 1.5
    },
    {
      symbol: 'GOOGL',
      name: 'Alphabet Inc.',
      shares: 3.75,
      avgCost: 140.00,
      currentPrice: 175.35,
      value: 657.56,
      gain: 132.56,
      gainPercent: 25.25,
      esgScore: 88,
      allocation: 2.0
    },
    {
      symbol: 'JNJ',
      name: 'Johnson & Johnson',
      shares: 12.5,
      avgCost: 155.00,
      currentPrice: 148.90,
      value: 1861.25,
      gain: -76.25,
      gainPercent: -3.94,
      esgScore: 91,
      allocation: 5.5
    },
    {
      symbol: 'VOO',
      name: 'Vanguard S&P 500 ETF',
      shares: 10.0,
      avgCost: 380.00,
      currentPrice: 435.50,
      value: 4355.00,
      gain: 555.00,
      gainPercent: 14.61,
      esgScore: 84,
      allocation: 13.0
    },
    {
      symbol: 'AMZN',
      name: 'Amazon.com Inc.',
      shares: 4.8,
      avgCost: 165.00,
      currentPrice: 178.90,
      value: 858.72,
      gain: 66.72,
      gainPercent: 8.42,
      esgScore: 79,
      allocation: 2.6
    },
    {
      symbol: 'BRK.B',
      name: 'Berkshire Hathaway Inc.',
      shares: 6.0,
      avgCost: 320.00,
      currentPrice: 368.40,
      value: 2210.40,
      gain: 290.40,
      gainPercent: 15.13,
      esgScore: 83,
      allocation: 6.6
    },
    {
      symbol: 'NVDA',
      name: 'NVIDIA Corporation',
      shares: 1.5,
      avgCost: 450.00,
      currentPrice: 890.50,
      value: 1335.75,
      gain: 660.75,
      gainPercent: 97.89,
      esgScore: 85,
      allocation: 4.0
    },
    {
      symbol: 'META',
      name: 'Meta Platforms Inc.',
      shares: 2.25,
      avgCost: 320.00,
      currentPrice: 467.80,
      value: 1052.55,
      gain: 332.55,
      gainPercent: 46.19,
      esgScore: 75,
      allocation: 3.1
    },
    {
      symbol: 'PG',
      name: 'Procter & Gamble Co.',
      shares: 8.0,
      avgCost: 145.00,
      currentPrice: 152.30,
      value: 1218.40,
      gain: 58.40,
      gainPercent: 5.03,
      esgScore: 88,
      allocation: 3.6
    },
    {
      symbol: 'DIS',
      name: 'Walt Disney Company',
      shares: 7.5,
      avgCost: 110.00,
      currentPrice: 105.20,
      value: 789.00,
      gain: -36.00,
      gainPercent: -4.36,
      esgScore: 86,
      allocation: 2.4
    },
    {
      symbol: 'VZ',
      name: 'Verizon Communications',
      shares: 25.0,
      avgCost: 42.00,
      currentPrice: 39.85,
      value: 996.25,
      gain: -53.75,
      gainPercent: -5.12,
      esgScore: 81,
      allocation: 3.0
    },
    {
      symbol: 'QCLN',
      name: 'First Trust NASDAQ Clean Edge ETF',
      shares: 18.5,
      avgCost: 52.00,
      currentPrice: 58.75,
      value: 1086.88,
      gain: 124.88,
      gainPercent: 12.99,
      esgScore: 93,
      allocation: 3.2
    },
    {
      symbol: 'TAN',
      name: 'Invesco Solar ETF',
      shares: 12.0,
      avgCost: 78.00,
      currentPrice: 85.40,
      value: 1024.80,
      gain: 88.80,
      gainPercent: 9.49,
      esgScore: 96,
      allocation: 3.1
    },
    {
      symbol: 'XOM',
      name: 'Exxon Mobil Corporation',
      shares: 10.0,
      avgCost: 95.00,
      currentPrice: 112.50,
      value: 1125.00,
      gain: 175.00,
      gainPercent: 18.42,
      esgScore: 65,
      allocation: 3.4
    },
    {
      symbol: 'BAC',
      name: 'Bank of America Corp.',
      shares: 30.0,
      avgCost: 32.00,
      currentPrice: 35.60,
      value: 1068.00,
      gain: 108.00,
      gainPercent: 11.25,
      esgScore: 80,
      allocation: 3.2
    },
    {
      symbol: 'V',
      name: 'Visa Inc.',
      shares: 3.5,
      avgCost: 220.00,
      currentPrice: 268.90,
      value: 941.15,
      gain: 171.15,
      gainPercent: 22.22,
      esgScore: 86,
      allocation: 2.8
    }
  ];

  const allocationData = {
    labels: ['Stocks', 'ETFs', 'Bonds', 'Cash', 'Crypto'],
    datasets: [
      {
        data: [45, 30, 15, 8, 2],
        backgroundColor: [
          theme.palette.primary.main,
          theme.palette.secondary.main,
          theme.palette.warning.main,
          theme.palette.info.main,
          theme.palette.error.main
        ],
        borderWidth: 0
      }
    ]
  };

  const performanceData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: 'Portfolio Value',
        data: [28000, 28500, 29200, 28800, 30500, 31543, 32100, 31800, 33200, 33800, 34500, 33542],
        borderColor: theme.palette.primary.main,
        backgroundColor: theme.palette.primary.main + '20',
        tension: 0.4,
        fill: true
      },
      {
        label: 'S&P 500 Benchmark',
        data: [28000, 28300, 28900, 29100, 29800, 30200, 30500, 30300, 31000, 31200, 31800, 31500],
        borderColor: theme.palette.grey[500],
        backgroundColor: theme.palette.grey[500] + '20',
        tension: 0.4,
        borderDash: [5, 5]
      }
    ]
  };

  return (
    <Box>
      <Box display="flex" justifyContent="flex-end" mb={3}>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
          >
            Add Investment
          </Button>
        </Box>
      </Box>

      {/* Portfolio Summary */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Portfolio Performance
              </Typography>
              <Box height={300}>
                <Line
                  data={performanceData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { 
                        display: true,
                        position: 'bottom'
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: false,
                        ticks: {
                          callback: function(value) {
                            return '$' + value.toLocaleString();
                          }
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
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Asset Allocation
              </Typography>
              <Box height={250}>
                <Doughnut
                  data={allocationData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom'
                      }
                    }
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Holdings Table */}
      <Paper sx={{ width: '100%', mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab label="Holdings" icon={<PieChart />} iconPosition="start" />
            <Tab label="Performance" icon={<ShowChart />} iconPosition="start" />
            <Tab label="Analysis" icon={<Assessment />} iconPosition="start" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Symbol</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell align="right">Shares</TableCell>
                  <TableCell align="right">Avg Cost</TableCell>
                  <TableCell align="right">Current Price</TableCell>
                  <TableCell align="right">Market Value</TableCell>
                  <TableCell align="right">Gain/Loss</TableCell>
                  <TableCell align="center">ESG Score</TableCell>
                  <TableCell align="right">Allocation</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {holdings.map((holding) => (
                  <motion.tr
                    key={holding.symbol}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <TableCell>
                      <Chip label={holding.symbol} size="small" />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Avatar sx={{ width: 24, height: 24 }}>
                          {holding.symbol[0]}
                        </Avatar>
                        {holding.name}
                      </Box>
                    </TableCell>
                    <TableCell align="right">{holding.shares}</TableCell>
                    <TableCell align="right">${holding.avgCost.toFixed(2)}</TableCell>
                    <TableCell align="right">${holding.currentPrice.toFixed(2)}</TableCell>
                    <TableCell align="right">${holding.value.toFixed(2)}</TableCell>
                    <TableCell align="right">
                      <Box display="flex" alignItems="center" justifyContent="flex-end" gap={0.5}>
                        {holding.gain >= 0 ? (
                          <TrendingUp sx={{ color: theme.palette.success.main, fontSize: 20 }} />
                        ) : (
                          <TrendingDown sx={{ color: theme.palette.error.main, fontSize: 20 }} />
                        )}
                        <Box>
                          <Typography
                            variant="body2"
                            color={holding.gain >= 0 ? 'success.main' : 'error.main'}
                          >
                            ${Math.abs(holding.gain).toFixed(2)}
                          </Typography>
                          <Typography
                            variant="caption"
                            color={holding.gain >= 0 ? 'success.main' : 'error.main'}
                          >
                            {holding.gainPercent >= 0 ? '+' : ''}{holding.gainPercent.toFixed(2)}%
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={holding.esgScore}
                        size="small"
                        color={holding.esgScore >= 80 ? 'success' : 'warning'}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Box>
                        <Typography variant="body2">{holding.allocation}%</Typography>
                        <LinearProgress
                          variant="determinate"
                          value={holding.allocation}
                          sx={{
                            height: 4,
                            borderRadius: 2,
                            bgcolor: theme.palette.grey[200],
                            '& .MuiLinearProgress-bar': {
                              bgcolor: theme.palette.primary.main
                            }
                          }}
                        />
                      </Box>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <PerformanceAnalysis />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <PortfolioAnalysis />
        </TabPanel>
      </Paper>

      {/* Action Buttons */}
      <Box display="flex" justifyContent="flex-end" gap={2}>
        <Button
          variant="outlined"
          startIcon={<Download />}
        >
          Export Report
        </Button>
        <Button
          variant="contained"
          color="secondary"
        >
          Rebalance Portfolio
        </Button>
      </Box>
    </Box>
  );
};

export default Portfolio;