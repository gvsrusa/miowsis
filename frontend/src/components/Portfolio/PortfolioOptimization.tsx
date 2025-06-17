import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Slider,
  Switch,
  FormControlLabel,
  Button,
  Alert,
  AlertTitle,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  LinearProgress,
  Stack,
  Divider,
  useTheme,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Collapse,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import {
  AutoGraph,
  Timeline,
  TrendingUp,
  AccountBalance,
  ShowChart,
  PieChart,
  Info,
  PlayArrow,
  Refresh,
  Save,
  Download,
  ExpandMore,
  ExpandLess,
  Speed,
  Security,
  Nature,
  AttachMoney,
  Assessment,
  Warning,
  CheckCircle,
  ArrowUpward,
  ArrowDownward,
  Equalizer,
  BarChart
} from '@mui/icons-material';
import { Line, Scatter, Doughnut, Bar } from 'react-chartjs-2';
import { motion, AnimatePresence } from 'framer-motion';
import '@utils/chartConfig';

interface OptimizationScenario {
  name: string;
  expectedReturn: number;
  risk: number;
  sharpeRatio: number;
  allocation: {
    stocks: number;
    bonds: number;
    etfs: number;
    cash: number;
    alternatives: number;
  };
  esgScore: number;
  description: string;
}

interface RebalanceAction {
  symbol: string;
  name: string;
  currentAllocation: number;
  targetAllocation: number;
  action: 'buy' | 'sell' | 'hold';
  amount: number;
  impact: string;
}

const PortfolioOptimization: React.FC = () => {
  const theme = useTheme();
  const [riskTolerance, setRiskTolerance] = useState(50);
  const [esgPreference, setEsgPreference] = useState(70);
  const [timeHorizon, setTimeHorizon] = useState(5);
  const [rebalanceFrequency, setRebalanceFrequency] = useState('quarterly');
  const [includeAlternatives, setIncludeAlternatives] = useState(false);
  const [taxHarvesting, setTaxHarvesting] = useState(true);
  const [optimizationGoal, setOptimizationGoal] = useState('balanced');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationComplete, setOptimizationComplete] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<string>('current');

  // Optimization scenarios
  const scenarios: Record<string, OptimizationScenario> = {
    current: {
      name: 'Current Portfolio',
      expectedReturn: 8.2,
      risk: 14.5,
      sharpeRatio: 0.57,
      allocation: { stocks: 45, bonds: 15, etfs: 30, cash: 8, alternatives: 2 },
      esgScore: 75,
      description: 'Your existing portfolio allocation'
    },
    conservative: {
      name: 'Conservative Growth',
      expectedReturn: 6.5,
      risk: 8.2,
      sharpeRatio: 0.79,
      allocation: { stocks: 25, bonds: 40, etfs: 25, cash: 10, alternatives: 0 },
      esgScore: 82,
      description: 'Lower risk with stable returns, suitable for capital preservation'
    },
    balanced: {
      name: 'Balanced Optimization',
      expectedReturn: 9.8,
      risk: 12.3,
      sharpeRatio: 0.80,
      allocation: { stocks: 40, bonds: 25, etfs: 28, cash: 5, alternatives: 2 },
      esgScore: 85,
      description: 'Optimal risk-adjusted returns with ESG integration'
    },
    growth: {
      name: 'Growth Focused',
      expectedReturn: 12.5,
      risk: 18.7,
      sharpeRatio: 0.67,
      allocation: { stocks: 60, bonds: 10, etfs: 25, cash: 3, alternatives: 2 },
      esgScore: 78,
      description: 'Higher returns potential with increased volatility'
    },
    esg: {
      name: 'ESG Optimized',
      expectedReturn: 9.2,
      risk: 13.1,
      sharpeRatio: 0.70,
      allocation: { stocks: 35, bonds: 20, etfs: 38, cash: 5, alternatives: 2 },
      esgScore: 92,
      description: 'Maximizes ESG impact while maintaining competitive returns'
    }
  };

  // Rebalance actions based on optimization
  const rebalanceActions: RebalanceAction[] = [
    {
      symbol: 'VTI',
      name: 'Vanguard Total Stock Market ETF',
      currentAllocation: 10.2,
      targetAllocation: 8.5,
      action: 'sell',
      amount: 567.50,
      impact: 'Reduce US equity exposure'
    },
    {
      symbol: 'ICLN',
      name: 'iShares Global Clean Energy ETF',
      currentAllocation: 3.0,
      targetAllocation: 5.5,
      action: 'buy',
      amount: 837.25,
      impact: 'Increase ESG allocation'
    },
    {
      symbol: 'BND',
      name: 'Vanguard Total Bond Market ETF',
      currentAllocation: 0,
      targetAllocation: 3.2,
      action: 'buy',
      amount: 1070.00,
      impact: 'Add defensive assets'
    },
    {
      symbol: 'MSFT',
      name: 'Microsoft Corporation',
      currentAllocation: 10.2,
      targetAllocation: 10.2,
      action: 'hold',
      amount: 0,
      impact: 'Maintain tech leader position'
    },
    {
      symbol: 'TSLA',
      name: 'Tesla Inc.',
      currentAllocation: 1.5,
      targetAllocation: 0,
      action: 'sell',
      amount: 502.00,
      impact: 'Reduce volatility'
    }
  ];

  // Efficient frontier data
  const efficientFrontierData = {
    datasets: [
      {
        label: 'Efficient Frontier',
        data: Array.from({ length: 20 }, (_, i) => {
          const risk = 5 + i * 1;
          const return_ = 4 + risk * 0.4 + Math.sin(i * 0.3) * 1.5;
          return { x: risk, y: return_ };
        }),
        borderColor: theme.palette.primary.main,
        backgroundColor: theme.palette.primary.main + '20',
        showLine: true,
        pointRadius: 0,
        tension: 0.4
      },
      {
        label: 'Portfolio Scenarios',
        data: Object.entries(scenarios).map(([key, scenario]) => ({
          x: scenario.risk,
          y: scenario.expectedReturn,
          label: scenario.name
        })),
        backgroundColor: (context: any) => {
          const index = context.dataIndex;
          const keys = Object.keys(scenarios);
          return keys[index] === selectedScenario 
            ? theme.palette.secondary.main 
            : theme.palette.primary.main;
        },
        pointRadius: 8,
        pointHoverRadius: 10
      }
    ]
  };

  // Historical simulation data
  const historicalSimulationData = {
    labels: ['2020', '2021', '2022', '2023', '2024', '2025', '2026', '2027', '2028', '2029'],
    datasets: [
      {
        label: 'Optimized Portfolio',
        data: [100, 108, 104, 118, 125, 138, 152, 165, 182, 198],
        borderColor: theme.palette.primary.main,
        backgroundColor: theme.palette.primary.main + '20',
        tension: 0.4,
        fill: true
      },
      {
        label: 'Current Portfolio',
        data: [100, 106, 102, 112, 118, 127, 136, 145, 156, 168],
        borderColor: theme.palette.grey[500],
        backgroundColor: theme.palette.grey[500] + '20',
        tension: 0.4,
        borderDash: [5, 5]
      },
      {
        label: '95% Confidence Band',
        data: [100, 110, 108, 124, 134, 150, 170, 190, 215, 240],
        borderColor: theme.palette.success.main,
        backgroundColor: 'transparent',
        borderDash: [2, 2],
        pointRadius: 0
      },
      {
        label: '5% Confidence Band',
        data: [100, 105, 98, 108, 112, 120, 128, 135, 145, 155],
        borderColor: theme.palette.error.main,
        backgroundColor: 'transparent',
        borderDash: [2, 2],
        pointRadius: 0
      }
    ]
  };

  const handleOptimize = () => {
    setIsOptimizing(true);
    // Simulate optimization calculation
    setTimeout(() => {
      setIsOptimizing(false);
      setOptimizationComplete(true);
      setSelectedScenario('balanced');
    }, 2000);
  };

  const getRiskLabel = (value: number) => {
    if (value < 20) return 'Very Conservative';
    if (value < 40) return 'Conservative';
    if (value < 60) return 'Moderate';
    if (value < 80) return 'Aggressive';
    return 'Very Aggressive';
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'buy': return 'success';
      case 'sell': return 'error';
      case 'hold': return 'info';
      default: return 'default';
    }
  };

  return (
    <Box>
      {/* Optimization Parameters */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6">Optimization Parameters</Typography>
            <Button
              variant="text"
              onClick={() => setShowAdvanced(!showAdvanced)}
              endIcon={showAdvanced ? <ExpandLess /> : <ExpandMore />}
            >
              Advanced Settings
            </Button>
          </Box>

          <Grid container spacing={3}>
            {/* Risk Tolerance */}
            <Grid item xs={12} md={6}>
              <Typography gutterBottom>
                Risk Tolerance: <strong>{getRiskLabel(riskTolerance)}</strong>
              </Typography>
              <Box display="flex" alignItems="center" gap={2}>
                <Security color="primary" />
                <Slider
                  value={riskTolerance}
                  onChange={(e, value) => setRiskTolerance(value as number)}
                  marks={[
                    { value: 0, label: 'Low' },
                    { value: 50, label: 'Medium' },
                    { value: 100, label: 'High' }
                  ]}
                  sx={{ flex: 1 }}
                />
                <Speed color="error" />
              </Box>
            </Grid>

            {/* ESG Preference */}
            <Grid item xs={12} md={6}>
              <Typography gutterBottom>
                ESG Preference: <strong>{esgPreference}%</strong>
              </Typography>
              <Box display="flex" alignItems="center" gap={2}>
                <AttachMoney />
                <Slider
                  value={esgPreference}
                  onChange={(e, value) => setEsgPreference(value as number)}
                  marks={[
                    { value: 0, label: 'Returns Only' },
                    { value: 100, label: 'ESG Priority' }
                  ]}
                  sx={{ 
                    flex: 1,
                    '& .MuiSlider-track': {
                      background: `linear-gradient(to right, ${theme.palette.primary.main}, ${theme.palette.success.main})`
                    }
                  }}
                />
                <Nature color="success" />
              </Box>
            </Grid>

            {/* Time Horizon */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Investment Time Horizon"
                type="number"
                value={timeHorizon}
                onChange={(e) => setTimeHorizon(parseInt(e.target.value))}
                InputProps={{
                  endAdornment: <Typography variant="body2">years</Typography>
                }}
                helperText="Longer horizons allow for more aggressive strategies"
              />
            </Grid>

            {/* Optimization Goal */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Optimization Goal</InputLabel>
                <Select
                  value={optimizationGoal}
                  onChange={(e) => setOptimizationGoal(e.target.value)}
                  label="Optimization Goal"
                >
                  <MenuItem value="balanced">Balanced Risk-Return</MenuItem>
                  <MenuItem value="growth">Maximum Growth</MenuItem>
                  <MenuItem value="income">Income Generation</MenuItem>
                  <MenuItem value="preservation">Capital Preservation</MenuItem>
                  <MenuItem value="esg">ESG Impact</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {/* Advanced Settings */}
          <Collapse in={showAdvanced}>
            <Divider sx={{ my: 3 }} />
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Rebalance Frequency</InputLabel>
                  <Select
                    value={rebalanceFrequency}
                    onChange={(e) => setRebalanceFrequency(e.target.value)}
                    label="Rebalance Frequency"
                  >
                    <MenuItem value="monthly">Monthly</MenuItem>
                    <MenuItem value="quarterly">Quarterly</MenuItem>
                    <MenuItem value="semiannual">Semi-Annual</MenuItem>
                    <MenuItem value="annual">Annual</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={includeAlternatives}
                      onChange={(e) => setIncludeAlternatives(e.target.checked)}
                    />
                  }
                  label="Include Alternative Assets"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={taxHarvesting}
                      onChange={(e) => setTaxHarvesting(e.target.checked)}
                    />
                  }
                  label="Tax-Loss Harvesting"
                />
              </Grid>
            </Grid>
          </Collapse>

          {/* Action Button */}
          <Box display="flex" justifyContent="center" mt={4}>
            <Button
              variant="contained"
              size="large"
              startIcon={isOptimizing ? <Refresh /> : <AutoGraph />}
              onClick={handleOptimize}
              disabled={isOptimizing}
              sx={{ minWidth: 200 }}
            >
              {isOptimizing ? 'Optimizing...' : 'Run Optimization'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Optimization Results */}
      <AnimatePresence>
        {optimizationComplete && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            {/* Success Alert */}
            <Alert severity="success" icon={<CheckCircle />} sx={{ mb: 4 }}>
              <AlertTitle>Optimization Complete!</AlertTitle>
              Based on your parameters, we&apos;ve identified an optimal portfolio allocation that could improve your risk-adjusted returns by <strong>23%</strong> while increasing your ESG score to <strong>85/100</strong>.
            </Alert>

            {/* Scenario Comparison */}
            <Card sx={{ mb: 4 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Portfolio Scenarios
                </Typography>
                
                <ToggleButtonGroup
                  value={selectedScenario}
                  exclusive
                  onChange={(e, value) => value && setSelectedScenario(value)}
                  sx={{ mb: 3 }}
                >
                  {Object.entries(scenarios).map(([key, scenario]) => (
                    <ToggleButton key={key} value={key} size="small">
                      {scenario.name}
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>

                <Grid container spacing={3}>
                  {/* Scenario Details */}
                  <Grid item xs={12} md={4}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                        Selected Scenario
                      </Typography>
                      <Typography variant="h5" gutterBottom>
                        {scenarios[selectedScenario].name}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" paragraph>
                        {scenarios[selectedScenario].description}
                      </Typography>
                      
                      <Stack spacing={2}>
                        <Box>
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="body2">Expected Return</Typography>
                            <Chip
                              label={`${scenarios[selectedScenario].expectedReturn}%`}
                              size="small"
                              color="success"
                              icon={<TrendingUp />}
                            />
                          </Box>
                        </Box>
                        
                        <Box>
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="body2">Risk (Volatility)</Typography>
                            <Chip
                              label={`${scenarios[selectedScenario].risk}%`}
                              size="small"
                              color="warning"
                              icon={<ShowChart />}
                            />
                          </Box>
                        </Box>
                        
                        <Box>
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="body2">Sharpe Ratio</Typography>
                            <Chip
                              label={scenarios[selectedScenario].sharpeRatio.toFixed(2)}
                              size="small"
                              color="primary"
                              icon={<Assessment />}
                            />
                          </Box>
                        </Box>
                        
                        <Box>
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="body2">ESG Score</Typography>
                            <Chip
                              label={`${scenarios[selectedScenario].esgScore}/100`}
                              size="small"
                              color="success"
                              icon={<Nature />}
                            />
                          </Box>
                        </Box>
                      </Stack>
                    </Paper>
                  </Grid>

                  {/* Efficient Frontier Chart */}
                  <Grid item xs={12} md={8}>
                    <Box height={350}>
                      <Scatter
                        data={efficientFrontierData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              display: true,
                              position: 'bottom'
                            },
                            title: {
                              display: true,
                              text: 'Efficient Frontier Analysis'
                            },
                            tooltip: {
                              callbacks: {
                                label: (context) => {
                                  const point = context.raw as any;
                                  if (point.label) {
                                    return [
                                      point.label,
                                      `Risk: ${point.x.toFixed(1)}%`,
                                      `Return: ${point.y.toFixed(1)}%`
                                    ];
                                  }
                                  return `Risk: ${point.x.toFixed(1)}%, Return: ${point.y.toFixed(1)}%`;
                                }
                              }
                            }
                          },
                          scales: {
                            x: {
                              title: {
                                display: true,
                                text: 'Risk (Standard Deviation %)'
                              },
                              min: 0,
                              max: 25
                            },
                            y: {
                              title: {
                                display: true,
                                text: 'Expected Return %'
                              },
                              min: 0,
                              max: 15
                            }
                          }
                        }}
                      />
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Allocation Comparison */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Current Allocation
                    </Typography>
                    <Box height={250}>
                      <Doughnut
                        data={{
                          labels: ['Stocks', 'Bonds', 'ETFs', 'Cash', 'Alternatives'],
                          datasets: [{
                            data: Object.values(scenarios.current.allocation),
                            backgroundColor: [
                              theme.palette.primary.main,
                              theme.palette.secondary.main,
                              theme.palette.warning.main,
                              theme.palette.info.main,
                              theme.palette.error.main
                            ]
                          }]
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: { position: 'bottom' }
                          }
                        }}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Optimized Allocation
                    </Typography>
                    <Box height={250}>
                      <Doughnut
                        data={{
                          labels: ['Stocks', 'Bonds', 'ETFs', 'Cash', 'Alternatives'],
                          datasets: [{
                            data: Object.values(scenarios[selectedScenario].allocation),
                            backgroundColor: [
                              theme.palette.primary.main,
                              theme.palette.secondary.main,
                              theme.palette.warning.main,
                              theme.palette.info.main,
                              theme.palette.error.main
                            ]
                          }]
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: { position: 'bottom' }
                          }
                        }}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Historical Simulation */}
            <Card sx={{ mb: 4 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  10-Year Performance Projection
                </Typography>
                <Box height={300}>
                  <Line
                    data={historicalSimulationData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { position: 'bottom' },
                        title: {
                          display: true,
                          text: 'Monte Carlo Simulation (1000 runs)'
                        }
                      },
                      scales: {
                        y: {
                          title: {
                            display: true,
                            text: 'Portfolio Value ($10,000 initial)'
                          },
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

            {/* Rebalancing Actions */}
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                  <Typography variant="h6">Recommended Rebalancing Actions</Typography>
                  <Box display="flex" gap={2}>
                    <Button variant="outlined" startIcon={<Save />}>
                      Save Plan
                    </Button>
                    <Button variant="contained" startIcon={<PlayArrow />}>
                      Execute All
                    </Button>
                  </Box>
                </Box>

                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Asset</TableCell>
                        <TableCell align="center">Current %</TableCell>
                        <TableCell align="center">Target %</TableCell>
                        <TableCell align="center">Action</TableCell>
                        <TableCell align="right">Amount</TableCell>
                        <TableCell>Impact</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {rebalanceActions.map((action, index) => (
                        <motion.tr
                          key={action.symbol}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={1}>
                              <Avatar sx={{ width: 32, height: 32, fontSize: 14 }}>
                                {action.symbol.substring(0, 2)}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" fontWeight={600}>
                                  {action.symbol}
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                  {action.name}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2">{action.currentAllocation}%</Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Box display="flex" alignItems="center" justifyContent="center" gap={0.5}>
                              <Typography variant="body2">{action.targetAllocation}%</Typography>
                              {action.targetAllocation > action.currentAllocation ? (
                                <ArrowUpward sx={{ fontSize: 16, color: theme.palette.success.main }} />
                              ) : action.targetAllocation < action.currentAllocation ? (
                                <ArrowDownward sx={{ fontSize: 16, color: theme.palette.error.main }} />
                              ) : null}
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={action.action.toUpperCase()}
                              size="small"
                              color={getActionColor(action.action) as any}
                            />
                          </TableCell>
                          <TableCell align="right">
                            {action.amount > 0 && (
                              <Typography variant="body2" fontWeight={600}>
                                ${action.amount.toFixed(2)}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" color="textSecondary">
                              {action.impact}
                            </Typography>
                          </TableCell>
                        </motion.tr>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Summary */}
                <Box mt={3} p={2} bgcolor={theme.palette.grey[50]} borderRadius={1}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={3}>
                      <Typography variant="caption" color="textSecondary">Total Buy</Typography>
                      <Typography variant="h6" color="success.main">
                        $2,907.25
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Typography variant="caption" color="textSecondary">Total Sell</Typography>
                      <Typography variant="h6" color="error.main">
                        $1,069.50
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Typography variant="caption" color="textSecondary">Net Cash Needed</Typography>
                      <Typography variant="h6">
                        $1,837.75
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Typography variant="caption" color="textSecondary">Est. Tax Impact</Typography>
                      <Typography variant="h6" color="warning.main">
                        -$127.45
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
};

export default PortfolioOptimization;