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

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div hidden={value !== index} {...other}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
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
      allocation: 28.5
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
      allocation: 8.3
    },
    {
      symbol: 'AAPL',
      name: 'Apple Inc.',
      shares: 5.5,
      avgCost: 150.00,
      currentPrice: 180.50,
      value: 992.75,
      gain: 167.75,
      gainPercent: 20.33,
      esgScore: 87,
      allocation: 8.2
    },
    {
      symbol: 'MSFT',
      name: 'Microsoft Corporation',
      shares: 8.25,
      avgCost: 300.00,
      currentPrice: 380.00,
      value: 3135.00,
      gain: 660.00,
      gainPercent: 26.67,
      esgScore: 89,
      allocation: 26.0
    },
    {
      symbol: 'TSLA',
      name: 'Tesla Inc.',
      shares: 2.1,
      avgCost: 800.00,
      currentPrice: 250.00,
      value: 525.00,
      gain: -1155.00,
      gainPercent: -68.75,
      esgScore: 91,
      allocation: 4.4
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
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Portfolio Value',
        data: [10000, 10500, 11200, 10800, 11500, 12543],
        borderColor: theme.palette.primary.main,
        backgroundColor: theme.palette.primary.main + '20',
        tension: 0.4
      }
    ]
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight={600}>
          Portfolio
        </Typography>
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
                      legend: { display: false }
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
          <Typography variant="h6" gutterBottom>
            Performance Analysis
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" color="textSecondary">
                    1 Day Return
                  </Typography>
                  <Typography variant="h5" color="success.main">
                    +1.02%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" color="textSecondary">
                    1 Month Return
                  </Typography>
                  <Typography variant="h5" color="success.main">
                    +5.23%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" color="textSecondary">
                    YTD Return
                  </Typography>
                  <Typography variant="h5" color="success.main">
                    +25.43%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            Portfolio Analysis
          </Typography>
          <Typography variant="body1" color="textSecondary">
            AI-powered portfolio analysis and recommendations coming soon...
          </Typography>
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