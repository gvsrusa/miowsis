import React, { useState, useMemo } from 'react';
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
  LinearProgress,
  Skeleton,
  Alert,
  TablePagination
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
import { usePortfolio, useHoldings, usePortfolioAllocation } from '@/hooks/api';

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
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Fetch data using React Query hooks
  const { data: portfolio, isLoading: portfolioLoading, error: portfolioError } = usePortfolio();
  const { data: holdingsData, isLoading: holdingsLoading, refetch: refetchHoldings } = useHoldings(page, rowsPerPage);
  const { data: allocation, isLoading: allocationLoading } = usePortfolioAllocation();

  const holdings = holdingsData?.content || [];
  const totalCount = holdingsData?.totalElements || 0;

  // Calculate portfolio metrics
  const portfolioMetrics = useMemo(() => {
    if (!portfolio) {
      return {
        totalValue: 0,
        totalGain: 0,
        totalGainPercent: 0,
        dayGain: 0,
        dayGainPercent: 0
      };
    }

    const totalCost = portfolio.totalCost || 0;
    const totalValue = portfolio.totalValue || 0;
    const totalGain = totalValue - totalCost;
    const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;
    const dayGain = portfolio.dayChange || 0;
    const dayGainPercent = portfolio.dayChangePercentage || 0;

    return {
      totalValue,
      totalGain,
      totalGainPercent,
      dayGain,
      dayGainPercent
    };
  }, [portfolio]);

  // Prepare allocation data for Doughnut chart
  const allocationChartData = useMemo(() => {
    if (!allocation || !allocation.bySector) {
      return {
        labels: [],
        datasets: [{
          data: [],
          backgroundColor: [],
          borderColor: [],
          borderWidth: 1
        }]
      };
    }

    // Use bySector data for allocation chart
    const sortedAllocations = [...allocation.bySector]
      .sort((a: any, b: any) => b.percentage - a.percentage)
      .slice(0, 8); // Top 8 sectors

    const others = allocation.bySector
      .slice(8)
      .reduce((sum: number, item: any) => sum + item.percentage, 0);

    if (others > 0) {
      sortedAllocations.push({
        sector: 'Others',
        percentage: others,
        value: allocation.bySector.slice(8).reduce((sum: number, item: any) => sum + item.value, 0)
      } as any);
    }

    const colors = [
      theme.palette.primary.main,
      theme.palette.secondary.main,
      theme.palette.success.main,
      theme.palette.info.main,
      theme.palette.warning.main,
      theme.palette.error.main,
      '#9c27b0',
      '#ff5722',
      theme.palette.grey[500]
    ];

    return {
      labels: sortedAllocations.map((item: any) => item.sector || item.symbol),
      datasets: [{
        data: sortedAllocations.map((item: any) => item.percentage),
        backgroundColor: colors.map(color => color + '20'),
        borderColor: colors,
        borderWidth: 1
      }]
    };
  }, [allocation, theme]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

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
      {/* Header Section */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" fontWeight={600}>
          My Portfolio
        </Typography>
        <Box display="flex" gap={2}>
          <IconButton onClick={() => refetchHoldings()} color="primary">
            <Refresh />
          </IconButton>
          <Button variant="outlined" startIcon={<Download />}>
            Export
          </Button>
          <Button variant="contained" startIcon={<Add />}>
            Add Investment
          </Button>
        </Box>
      </Box>

      {/* Portfolio Summary Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Value
              </Typography>
              {portfolioLoading ? (
                <Skeleton variant="text" width={120} height={32} />
              ) : (
                <Typography variant="h5" fontWeight={600}>
                  ${portfolioMetrics.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Gain/Loss
              </Typography>
              {portfolioLoading ? (
                <Skeleton variant="text" width={120} height={32} />
              ) : (
                <>
                  <Typography 
                    variant="h5" 
                    fontWeight={600} 
                    color={portfolioMetrics.totalGain >= 0 ? 'success.main' : 'error.main'}
                  >
                    {portfolioMetrics.totalGain >= 0 ? '+' : ''}${Math.abs(portfolioMetrics.totalGain).toFixed(2)}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color={portfolioMetrics.totalGainPercent >= 0 ? 'success.main' : 'error.main'}
                  >
                    {portfolioMetrics.totalGainPercent >= 0 ? '+' : ''}{portfolioMetrics.totalGainPercent.toFixed(2)}%
                  </Typography>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Day Gain/Loss
              </Typography>
              {portfolioLoading ? (
                <Skeleton variant="text" width={120} height={32} />
              ) : (
                <>
                  <Typography 
                    variant="h5" 
                    fontWeight={600} 
                    color={portfolioMetrics.dayGain >= 0 ? 'success.main' : 'error.main'}
                  >
                    {portfolioMetrics.dayGain >= 0 ? '+' : ''}${Math.abs(portfolioMetrics.dayGain).toFixed(2)}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color={portfolioMetrics.dayGainPercent >= 0 ? 'success.main' : 'error.main'}
                  >
                    {portfolioMetrics.dayGainPercent >= 0 ? '+' : ''}{portfolioMetrics.dayGainPercent.toFixed(2)}%
                  </Typography>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                ESG Score
              </Typography>
              {portfolioLoading ? (
                <Skeleton variant="text" width={120} height={32} />
              ) : (
                <>
                  <Typography variant="h5" fontWeight={600} color="secondary.main">
                    {portfolio?.averageEsgScore?.toFixed(0) || 0}/100
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={portfolio?.averageEsgScore || 0} 
                    sx={{ 
                      mt: 1, 
                      height: 8, 
                      borderRadius: 4,
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: theme.palette.secondary.main
                      }
                    }} 
                  />
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs Section */}
      <Paper sx={{ width: '100%', mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={(e, newValue) => setTabValue(newValue)}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab icon={<ShowChart />} iconPosition="start" label="Holdings" />
          <Tab icon={<PieChart />} iconPosition="start" label="Allocation" />
          <Tab icon={<Assessment />} iconPosition="start" label="Performance" />
          <Tab icon={<TrendingUp />} iconPosition="start" label="Analysis" />
        </Tabs>
      </Paper>

      {/* Holdings Tab */}
      <TabPanel value={tabValue} index={0}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Symbol</TableCell>
                <TableCell>Name</TableCell>
                <TableCell align="right">Shares</TableCell>
                <TableCell align="right">Avg Cost</TableCell>
                <TableCell align="right">Current Price</TableCell>
                <TableCell align="right">Value</TableCell>
                <TableCell align="right">Gain/Loss</TableCell>
                <TableCell align="center">ESG Score</TableCell>
                <TableCell align="right">Allocation</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {holdingsLoading ? (
                [...Array(5)].map((_, index) => (
                  <TableRow key={index}>
                    {[...Array(9)].map((_, cellIndex) => (
                      <TableCell key={cellIndex}>
                        <Skeleton variant="text" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : holdings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <Typography color="textSecondary" py={4}>
                      No holdings yet. Start investing to see your portfolio here!
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                holdings.map((holding, index) => {
                  const currentValue = holding.currentValue || 0;
                  const totalCost = holding.totalCost || 0;
                  const gain = currentValue - totalCost;
                  const gainPercent = totalCost > 0 ? (gain / totalCost) * 100 : 0;
                  
                  return (
                    <TableRow
                      key={holding.id}
                      component={motion.tr}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: theme.palette.primary.light }}>
                            {holding.symbol.charAt(0)}
                          </Avatar>
                          <Typography fontWeight={600}>{holding.symbol}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{holding.securityName}</TableCell>
                      <TableCell align="right">{holding.quantity.toFixed(3)}</TableCell>
                      <TableCell align="right">${holding.averageCost.toFixed(2)}</TableCell>
                      <TableCell align="right">${holding.currentPrice.toFixed(2)}</TableCell>
                      <TableCell align="right">${currentValue.toFixed(2)}</TableCell>
                      <TableCell align="right">
                        <Box display="flex" alignItems="center" justifyContent="flex-end" gap={0.5}>
                          {gain >= 0 ? (
                            <TrendingUp sx={{ fontSize: 16, color: theme.palette.success.main }} />
                          ) : (
                            <TrendingDown sx={{ fontSize: 16, color: theme.palette.error.main }} />
                          )}
                          <Typography 
                            variant="body2" 
                            color={gain >= 0 ? 'success.main' : 'error.main'}
                            fontWeight={500}
                          >
                            {gain >= 0 ? '+' : ''}${Math.abs(gain).toFixed(2)}
                          </Typography>
                          <Typography 
                            variant="caption" 
                            color={gainPercent >= 0 ? 'success.main' : 'error.main'}
                          >
                            ({gainPercent >= 0 ? '+' : ''}{gainPercent.toFixed(2)}%)
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Chip 
                          label={holding.esgScore?.toFixed(0) || 'N/A'} 
                          size="small"
                          color={
                            !holding.esgScore ? 'default' :
                            holding.esgScore >= 80 ? 'success' : 
                            holding.esgScore >= 60 ? 'warning' : 'error'
                          }
                        />
                      </TableCell>
                      <TableCell align="right">
                        {((currentValue / portfolioMetrics.totalValue) * 100).toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
          {!holdingsLoading && holdings.length > 0 && (
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={totalCount}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          )}
        </TableContainer>
      </TabPanel>

      {/* Allocation Tab */}
      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Portfolio Allocation
              </Typography>
              {allocationLoading ? (
                <Skeleton variant="circular" width={300} height={300} sx={{ margin: '0 auto' }} />
              ) : (
                <Box sx={{ height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <Doughnut 
                    data={allocationChartData} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'right' as const,
                        },
                        tooltip: {
                          callbacks: {
                            label: (context) => {
                              return `${context.label}: ${context.parsed.toFixed(1)}%`;
                            }
                          }
                        }
                      }
                    }}
                  />
                </Box>
              )}
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Sector Breakdown
              </Typography>
              {allocationLoading ? (
                <Box>
                  {[1, 2, 3, 4].map((i) => (
                    <Box key={i} mb={2}>
                      <Skeleton variant="text" width="60%" />
                      <Skeleton variant="rectangular" height={8} sx={{ borderRadius: 4 }} />
                    </Box>
                  ))}
                </Box>
              ) : (
                <Box>
                  {allocation?.sectorBreakdown?.map((sector, index) => (
                    <Box key={index} mb={2}>
                      <Box display="flex" justifyContent="space-between" mb={0.5}>
                        <Typography variant="body2">{sector.name}</Typography>
                        <Typography variant="body2" fontWeight={500}>
                          {sector.percentage.toFixed(1)}%
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={sector.percentage} 
                        sx={{ 
                          height: 8, 
                          borderRadius: 4,
                          backgroundColor: theme.palette.grey[200]
                        }} 
                      />
                    </Box>
                  ))}
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Performance Tab */}
      <TabPanel value={tabValue} index={2}>
        <PerformanceAnalysis />
      </TabPanel>

      {/* Analysis Tab */}
      <TabPanel value={tabValue} index={3}>
        <PortfolioAnalysis />
      </TabPanel>
    </Box>
  );
};

export default Portfolio;