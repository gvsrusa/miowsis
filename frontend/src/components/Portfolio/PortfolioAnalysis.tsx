import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Paper,
  Rating,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
  Divider,
  Alert,
  AlertTitle,
  CircularProgress,
  useTheme,
  ToggleButton,
  ToggleButtonGroup,
  LinearProgress,
  Avatar,
  Stack
} from '@mui/material';
import {
  Lightbulb,
  Warning,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Info,
  AutoGraph,
  Psychology,
  Diversity3,
  BalanceOutlined,
  Security,
  LocalAtm,
  NaturePeople,
  Analytics,
  TipsAndUpdates,
  ArrowForward
} from '@mui/icons-material';
import { Radar, PolarArea, Doughnut } from 'react-chartjs-2';
import { motion } from 'framer-motion';
import '@utils/chartConfig';

interface RiskMetric {
  name: string;
  value: number;
  benchmark: number;
  status: 'good' | 'warning' | 'danger';
}

interface Recommendation {
  id: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  type: 'rebalance' | 'buy' | 'sell' | 'hold';
  action?: string;
  potentialReturn?: string;
}

interface PortfolioScore {
  category: string;
  score: number;
  maxScore: number;
  icon: React.ReactNode;
  description: string;
}

const PortfolioAnalysis: React.FC = () => {
  const theme = useTheme();
  const [analysisView, setAnalysisView] = useState('overview');

  // Portfolio health metrics
  const portfolioScores: PortfolioScore[] = [
    {
      category: 'Diversification',
      score: 85,
      maxScore: 100,
      icon: <Diversity3 />,
      description: 'Well-diversified across sectors and asset classes'
    },
    {
      category: 'Risk-Adjusted Return',
      score: 78,
      maxScore: 100,
      icon: <BalanceOutlined />,
      description: 'Good returns relative to risk taken'
    },
    {
      category: 'Cost Efficiency',
      score: 92,
      maxScore: 100,
      icon: <LocalAtm />,
      description: 'Low expense ratios and trading costs'
    },
    {
      category: 'ESG Alignment',
      score: 88,
      maxScore: 100,
      icon: <NaturePeople />,
      description: 'Strong environmental and social impact scores'
    }
  ];

  // Risk metrics
  const riskMetrics: RiskMetric[] = [
    { name: 'Portfolio Beta', value: 0.89, benchmark: 1.0, status: 'good' },
    { name: 'Value at Risk (95%)', value: -3.2, benchmark: -5.0, status: 'good' },
    { name: 'Concentration Risk', value: 18, benchmark: 25, status: 'good' },
    { name: 'Correlation Risk', value: 0.72, benchmark: 0.85, status: 'warning' }
  ];

  // AI-powered recommendations
  const recommendations: Recommendation[] = [
    {
      id: '1',
      title: 'Increase Technology Exposure',
      description: 'Your tech allocation is 5% below optimal. Consider adding QQQ or VGT to capture growth opportunities.',
      impact: 'high',
      type: 'buy',
      action: 'Add $500 to QQQ',
      potentialReturn: '+2.3% annual return'
    },
    {
      id: '2',
      title: 'Rebalance International Holdings',
      description: 'International exposure is overweighted. Consider reducing VXUS position by 10%.',
      impact: 'medium',
      type: 'rebalance',
      action: 'Sell 5 shares of VXUS',
      potentialReturn: 'Reduce volatility by 8%'
    },
    {
      id: '3',
      title: 'Add Defensive Assets',
      description: 'Portfolio lacks recession protection. Consider adding bonds or defensive stocks.',
      impact: 'medium',
      type: 'buy',
      action: 'Add BND or SCHD',
      potentialReturn: 'Improve Sharpe ratio by 0.15'
    },
    {
      id: '4',
      title: 'Harvest Tax Losses',
      description: 'You have $234 in unrealized losses in ARKK. Consider tax-loss harvesting.',
      impact: 'low',
      type: 'sell',
      action: 'Sell ARKK, buy similar ETF',
      potentialReturn: 'Save ~$70 in taxes'
    }
  ];

  // Radar chart data for portfolio analysis
  const radarData = {
    labels: ['Growth', 'Value', 'Quality', 'Momentum', 'Low Volatility', 'ESG'],
    datasets: [
      {
        label: 'Your Portfolio',
        data: [75, 60, 85, 70, 65, 88],
        borderColor: theme.palette.primary.main,
        backgroundColor: theme.palette.primary.main + '40',
        pointBackgroundColor: theme.palette.primary.main,
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: theme.palette.primary.main
      },
      {
        label: 'Optimal Portfolio',
        data: [70, 70, 80, 75, 70, 85],
        borderColor: theme.palette.secondary.main,
        backgroundColor: theme.palette.secondary.main + '20',
        pointBackgroundColor: theme.palette.secondary.main,
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: theme.palette.secondary.main
      }
    ]
  };

  // Efficient frontier data
  const efficientFrontierData = {
    labels: ['Conservative', 'Moderate', 'Balanced', 'Growth', 'Aggressive'],
    datasets: [
      {
        label: 'Risk Level',
        data: [15, 25, 35, 45, 60],
        backgroundColor: [
          theme.palette.success.main,
          theme.palette.info.main,
          theme.palette.warning.main,
          theme.palette.secondary.main,
          theme.palette.error.main
        ]
      }
    ]
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good': return <CheckCircle color="success" />;
      case 'warning': return <Warning color="warning" />;
      case 'danger': return <Warning color="error" />;
      default: return <Info />;
    }
  };

  return (
    <Box>
      {/* Analysis View Selector */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h6">AI-Powered Portfolio Analysis</Typography>
        <ToggleButtonGroup
          value={analysisView}
          exclusive
          onChange={(e, value) => value && setAnalysisView(value)}
          size="small"
        >
          <ToggleButton value="overview">Overview</ToggleButton>
          <ToggleButton value="risk">Risk Analysis</ToggleButton>
          <ToggleButton value="optimization">Optimization</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {analysisView === 'overview' && (
        <>
          {/* Portfolio Health Score */}
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6">Portfolio Health Score</Typography>
                <Box display="flex" alignItems="center" gap={1}>
                  <CircularProgress
                    variant="determinate"
                    value={86}
                    size={60}
                    thickness={5}
                    sx={{ color: theme.palette.success.main }}
                  />
                  <Box>
                    <Typography variant="h4" fontWeight={600}>86</Typography>
                    <Typography variant="caption" color="textSecondary">/100</Typography>
                  </Box>
                </Box>
              </Box>
              
              <Grid container spacing={3}>
                {portfolioScores.map((score, index) => (
                  <Grid item xs={12} sm={6} key={index}>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Avatar sx={{ bgcolor: theme.palette.primary.main + '20', color: theme.palette.primary.main }}>
                        {score.icon}
                      </Avatar>
                      <Box flex={1}>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="subtitle2">{score.category}</Typography>
                          <Typography variant="body2" fontWeight={600}>
                            {score.score}/{score.maxScore}
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={(score.score / score.maxScore) * 100}
                          sx={{
                            height: 6,
                            borderRadius: 3,
                            my: 1,
                            bgcolor: theme.palette.grey[200],
                            '& .MuiLinearProgress-bar': {
                              bgcolor: score.score >= 80 ? theme.palette.success.main : 
                                     score.score >= 60 ? theme.palette.warning.main : 
                                     theme.palette.error.main
                            }
                          }}
                        />
                        <Typography variant="caption" color="textSecondary">
                          {score.description}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>

          {/* AI Recommendations */}
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={3}>
                <Psychology color="primary" />
                <Typography variant="h6">AI Recommendations</Typography>
              </Box>
              
              <Stack spacing={2}>
                {recommendations.map((rec) => (
                  <motion.div
                    key={rec.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                        <Box flex={1}>
                          <Box display="flex" alignItems="center" gap={1} mb={1}>
                            <Typography variant="subtitle1" fontWeight={600}>
                              {rec.title}
                            </Typography>
                            <Chip
                              label={rec.impact}
                              size="small"
                              color={getImpactColor(rec.impact) as any}
                              variant="outlined"
                            />
                          </Box>
                          <Typography variant="body2" color="textSecondary" mb={2}>
                            {rec.description}
                          </Typography>
                          <Box display="flex" gap={2} alignItems="center">
                            {rec.action && (
                              <Chip
                                label={rec.action}
                                size="small"
                                icon={<Lightbulb />}
                                color="primary"
                                variant="filled"
                              />
                            )}
                            {rec.potentialReturn && (
                              <Typography variant="caption" color="success.main" fontWeight={500}>
                                {rec.potentialReturn}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                        <Button
                          variant="outlined"
                          size="small"
                          endIcon={<ArrowForward />}
                          sx={{ ml: 2 }}
                        >
                          Act Now
                        </Button>
                      </Box>
                    </Paper>
                  </motion.div>
                ))}
              </Stack>
            </CardContent>
          </Card>

          {/* Portfolio Characteristics */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Factor Exposure Analysis
                  </Typography>
                  <Box height={300}>
                    <Radar
                      data={radarData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                          r: {
                            beginAtZero: true,
                            max: 100,
                            ticks: {
                              stepSize: 20
                            }
                          }
                        },
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
            
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Risk Profile Distribution
                  </Typography>
                  <Box height={300}>
                    <PolarArea
                      data={efficientFrontierData}
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
        </>
      )}

      {analysisView === 'risk' && (
        <>
          {/* Risk Metrics Dashboard */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {riskMetrics.map((metric, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="subtitle2" color="textSecondary">
                        {metric.name}
                      </Typography>
                      {getStatusIcon(metric.status)}
                    </Box>
                    <Typography variant="h4" fontWeight={600} mb={1}>
                      {metric.value > 0 ? '+' : ''}{metric.value.toFixed(2)}
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="caption" color="textSecondary">
                        Benchmark: {metric.benchmark.toFixed(2)}
                      </Typography>
                      <Chip
                        label={metric.status}
                        size="small"
                        color={
                          metric.status === 'good' ? 'success' : 
                          metric.status === 'warning' ? 'warning' : 'error'
                        }
                        variant="outlined"
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Risk Analysis Alert */}
          <Alert severity="info" sx={{ mb: 4 }}>
            <AlertTitle>Risk Assessment Summary</AlertTitle>
            Your portfolio shows moderate risk levels with good diversification. Consider adding defensive assets to improve downside protection during market volatility.
          </Alert>
        </>
      )}

      {analysisView === 'optimization' && (
        <>
          {/* Optimization Opportunities */}
          <Alert severity="success" icon={<AutoGraph />} sx={{ mb: 4 }}>
            <AlertTitle>Optimization Potential Identified</AlertTitle>
            By implementing our recommendations, you could potentially improve your risk-adjusted returns by 15% and reduce portfolio volatility by 12%.
          </Alert>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Portfolio Optimization Simulator
              </Typography>
              <Typography variant="body2" color="textSecondary" mb={3}>
                See how different allocation strategies could improve your portfolio performance
              </Typography>
              
              <Box display="flex" justifyContent="center" alignItems="center" height={200}>
                <Typography color="textSecondary">
                  Interactive optimization tool coming soon...
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  );
};

export default PortfolioAnalysis;