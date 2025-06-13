import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Button,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  InputAdornment,
  Avatar,
  Tooltip,
  Menu,
  Checkbox,
  ListItemText,
  OutlinedInput,
  useTheme,
  Card,
  CardContent,
  Grid,
  Divider,
  ToggleButton,
  ToggleButtonGroup,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Alert
} from '@mui/material';
import {
  Search,
  FilterList,
  Download,
  Print,
  MoreVert,
  TrendingUp,
  TrendingDown,
  SwapHoriz,
  AttachMoney,
  CalendarToday,
  Receipt,
  CheckCircle,
  Pending,
  Cancel,
  Info,
  ArrowUpward,
  ArrowDownward
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { motion } from 'framer-motion';

interface Transaction {
  id: string;
  date: string;
  time: string;
  type: 'buy' | 'sell' | 'dividend' | 'deposit' | 'withdrawal' | 'roundup' | 'fee';
  status: 'completed' | 'pending' | 'failed';
  symbol?: string;
  company?: string;
  shares?: number;
  price?: number;
  amount: number;
  fees: number;
  total: number;
  esgScore?: number;
  paymentMethod?: string;
  notes?: string;
}

const Transactions: React.FC = () => {
  const theme = useTheme();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Mock transaction data
  const transactions: Transaction[] = [
    {
      id: '1',
      date: '2024-06-13',
      time: '09:30:00',
      type: 'buy',
      status: 'completed',
      symbol: 'AAPL',
      company: 'Apple Inc.',
      shares: 2.5,
      price: 195.50,
      amount: 488.75,
      fees: 1.00,
      total: 489.75,
      esgScore: 85,
      paymentMethod: 'Bank Account',
      notes: 'Monthly investment'
    },
    {
      id: '2',
      date: '2024-06-12',
      time: '14:15:00',
      type: 'roundup',
      status: 'completed',
      amount: 2.34,
      fees: 0,
      total: 2.34,
      paymentMethod: 'Debit Card',
      notes: 'Coffee purchase roundup'
    },
    {
      id: '3',
      date: '2024-06-10',
      time: '10:00:00',
      type: 'dividend',
      status: 'completed',
      symbol: 'VTI',
      company: 'Vanguard Total Stock Market ETF',
      amount: 15.67,
      fees: 0,
      total: 15.67,
      notes: 'Quarterly dividend'
    },
    {
      id: '4',
      date: '2024-06-08',
      time: '11:45:00',
      type: 'sell',
      status: 'pending',
      symbol: 'TSLA',
      company: 'Tesla Inc.',
      shares: 1,
      price: 245.30,
      amount: 245.30,
      fees: 1.00,
      total: 244.30,
      esgScore: 78,
      paymentMethod: 'Bank Account'
    },
    {
      id: '5',
      date: '2024-06-05',
      time: '16:00:00',
      type: 'deposit',
      status: 'completed',
      amount: 500.00,
      fees: 0,
      total: 500.00,
      paymentMethod: 'Bank Transfer',
      notes: 'Monthly deposit'
    },
    {
      id: '6',
      date: '2024-06-04',
      time: '13:22:00',
      type: 'buy',
      status: 'completed',
      symbol: 'MSFT',
      company: 'Microsoft Corporation',
      shares: 1.2,
      price: 415.25,
      amount: 498.30,
      fees: 1.00,
      total: 499.30,
      esgScore: 92,
      paymentMethod: 'Bank Account',
      notes: 'Tech sector allocation'
    },
    {
      id: '7',
      date: '2024-06-03',
      time: '09:45:00',
      type: 'roundup',
      status: 'completed',
      amount: 1.75,
      fees: 0,
      total: 1.75,
      paymentMethod: 'Debit Card',
      notes: 'Grocery shopping roundup'
    },
    {
      id: '8',
      date: '2024-06-01',
      time: '15:30:00',
      type: 'buy',
      status: 'completed',
      symbol: 'GOOGL',
      company: 'Alphabet Inc.',
      shares: 0.5,
      price: 175.35,
      amount: 87.68,
      fees: 0.50,
      total: 88.18,
      esgScore: 88,
      paymentMethod: 'Bank Account'
    },
    {
      id: '9',
      date: '2024-05-30',
      time: '10:15:00',
      type: 'dividend',
      status: 'completed',
      symbol: 'JNJ',
      company: 'Johnson & Johnson',
      amount: 22.40,
      fees: 0,
      total: 22.40,
      notes: 'Quarterly dividend payment'
    },
    {
      id: '10',
      date: '2024-05-28',
      time: '14:00:00',
      type: 'fee',
      status: 'completed',
      amount: 4.95,
      fees: 0,
      total: 4.95,
      notes: 'Monthly account fee'
    },
    {
      id: '11',
      date: '2024-05-25',
      time: '11:30:00',
      type: 'sell',
      status: 'completed',
      symbol: 'META',
      company: 'Meta Platforms Inc.',
      shares: 2,
      price: 467.80,
      amount: 935.60,
      fees: 1.00,
      total: 934.60,
      esgScore: 75,
      paymentMethod: 'Bank Account',
      notes: 'Profit taking'
    },
    {
      id: '12',
      date: '2024-05-22',
      time: '09:00:00',
      type: 'withdrawal',
      status: 'completed',
      amount: 250.00,
      fees: 0,
      total: 250.00,
      paymentMethod: 'Bank Transfer',
      notes: 'Emergency fund withdrawal'
    },
    {
      id: '13',
      date: '2024-05-20',
      time: '15:45:00',
      type: 'buy',
      status: 'completed',
      symbol: 'VZ',
      company: 'Verizon Communications',
      shares: 10,
      price: 39.85,
      amount: 398.50,
      fees: 1.00,
      total: 399.50,
      esgScore: 81,
      paymentMethod: 'Bank Account'
    },
    {
      id: '14',
      date: '2024-05-18',
      time: '12:30:00',
      type: 'roundup',
      status: 'completed',
      amount: 3.45,
      fees: 0,
      total: 3.45,
      paymentMethod: 'Debit Card',
      notes: 'Restaurant bill roundup'
    },
    {
      id: '15',
      date: '2024-05-15',
      time: '10:00:00',
      type: 'dividend',
      status: 'completed',
      symbol: 'AAPL',
      company: 'Apple Inc.',
      amount: 12.30,
      fees: 0,
      total: 12.30,
      notes: 'Quarterly dividend'
    },
    {
      id: '16',
      date: '2024-05-12',
      time: '14:20:00',
      type: 'buy',
      status: 'failed',
      symbol: 'NVDA',
      company: 'NVIDIA Corporation',
      shares: 0.5,
      price: 890.50,
      amount: 445.25,
      fees: 1.00,
      total: 446.25,
      esgScore: 83,
      paymentMethod: 'Bank Account',
      notes: 'Insufficient funds'
    },
    {
      id: '17',
      date: '2024-05-10',
      time: '16:00:00',
      type: 'deposit',
      status: 'completed',
      amount: 1000.00,
      fees: 0,
      total: 1000.00,
      paymentMethod: 'Bank Transfer',
      notes: 'Bonus deposit'
    },
    {
      id: '18',
      date: '2024-05-08',
      time: '11:15:00',
      type: 'buy',
      status: 'completed',
      symbol: 'DIS',
      company: 'Walt Disney Company',
      shares: 3,
      price: 105.20,
      amount: 315.60,
      fees: 1.00,
      total: 316.60,
      esgScore: 86,
      paymentMethod: 'Bank Account'
    },
    {
      id: '19',
      date: '2024-05-05',
      time: '09:30:00',
      type: 'roundup',
      status: 'completed',
      amount: 0.89,
      fees: 0,
      total: 0.89,
      paymentMethod: 'Debit Card',
      notes: 'Gas station roundup'
    },
    {
      id: '20',
      date: '2024-05-01',
      time: '15:00:00',
      type: 'buy',
      status: 'completed',
      symbol: 'AMZN',
      company: 'Amazon.com Inc.',
      shares: 0.8,
      price: 178.90,
      amount: 143.12,
      fees: 0.50,
      total: 143.62,
      esgScore: 79,
      paymentMethod: 'Bank Account',
      notes: 'Monthly DCA investment'
    }
  ];

  // Calculate summary statistics
  const totalDeposits = transactions
    .filter(t => t.type === 'deposit' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalInvested = transactions
    .filter(t => (t.type === 'buy' || t.type === 'roundup') && t.status === 'completed')
    .reduce((sum, t) => sum + t.total, 0);
  
  const totalReturns = transactions
    .filter(t => (t.type === 'sell' || t.type === 'dividend') && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalFees = transactions
    .filter(t => t.status === 'completed')
    .reduce((sum, t) => sum + t.fees, 0);

  // Filter and search logic
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = 
      transaction.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.symbol?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType.length === 0 || filterType.includes(transaction.type);
    const matchesStatus = filterStatus === 'all' || transaction.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'buy': return <ArrowDownward sx={{ color: theme.palette.success.main }} />;
      case 'sell': return <ArrowUpward sx={{ color: theme.palette.error.main }} />;
      case 'dividend': return <AttachMoney sx={{ color: theme.palette.info.main }} />;
      case 'deposit': return <ArrowDownward sx={{ color: theme.palette.primary.main }} />;
      case 'withdrawal': return <ArrowUpward sx={{ color: theme.palette.warning.main }} />;
      case 'roundup': return <SwapHoriz sx={{ color: theme.palette.secondary.main }} />;
      case 'fee': return <Receipt sx={{ color: theme.palette.grey[600] }} />;
      default: return <AttachMoney />;
    }
  };

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'completed':
        return <Chip label="Completed" size="small" color="success" icon={<CheckCircle />} />;
      case 'pending':
        return <Chip label="Pending" size="small" color="warning" icon={<Pending />} />;
      case 'failed':
        return <Chip label="Failed" size="small" color="error" icon={<Cancel />} />;
      default:
        return <Chip label={status} size="small" />;
    }
  };

  const handleViewDetails = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setDetailsOpen(true);
  };

  const handleExport = () => {
    // Export functionality
    console.log('Exporting transactions...');
  };

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" fontWeight={600}>
          Transactions
        </Typography>
        <Box display="flex" gap={2}>
          <Button variant="outlined" startIcon={<Print />}>
            Print
          </Button>
          <Button variant="contained" startIcon={<Download />} onClick={handleExport}>
            Export
          </Button>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="caption">
                    Total Deposits
                  </Typography>
                  <Typography variant="h5" fontWeight={600}>
                    ${totalDeposits.toFixed(2)}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: theme.palette.primary.main + '20', color: theme.palette.primary.main }}>
                  <ArrowDownward />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="caption">
                    Total Invested
                  </Typography>
                  <Typography variant="h5" fontWeight={600}>
                    ${totalInvested.toFixed(2)}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: theme.palette.success.main + '20', color: theme.palette.success.main }}>
                  <TrendingUp />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="caption">
                    Total Returns
                  </Typography>
                  <Typography variant="h5" fontWeight={600}>
                    ${totalReturns.toFixed(2)}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: theme.palette.info.main + '20', color: theme.palette.info.main }}>
                  <AttachMoney />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="caption">
                    Total Fees
                  </Typography>
                  <Typography variant="h5" fontWeight={600}>
                    ${totalFees.toFixed(2)}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: theme.palette.warning.main + '20', color: theme.palette.warning.main }}>
                  <Receipt />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters and Search */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                multiple
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as string[])}
                input={<OutlinedInput label="Type" />}
                renderValue={(selected) => `${selected.length} selected`}
              >
                {['buy', 'sell', 'dividend', 'deposit', 'withdrawal', 'roundup', 'fee'].map((type) => (
                  <MenuItem key={type} value={type}>
                    <Checkbox checked={filterType.indexOf(type) > -1} />
                    <ListItemText primary={type.charAt(0).toUpperCase() + type.slice(1)} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                label="Status"
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="failed">Failed</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Date Range</InputLabel>
              <Select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                label="Date Range"
              >
                <MenuItem value="all">All Time</MenuItem>
                <MenuItem value="today">Today</MenuItem>
                <MenuItem value="week">This Week</MenuItem>
                <MenuItem value="month">This Month</MenuItem>
                <MenuItem value="year">This Year</MenuItem>
                <MenuItem value="custom">Custom Range</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <ToggleButtonGroup
              value={sortOrder}
              exclusive
              onChange={(e, value) => value && setSortOrder(value)}
              size="small"
              fullWidth
            >
              <ToggleButton value="desc">
                <ArrowDownward /> Newest
              </ToggleButton>
              <ToggleButton value="asc">
                <ArrowUpward /> Oldest
              </ToggleButton>
            </ToggleButtonGroup>
          </Grid>
        </Grid>
      </Paper>

      {/* Transactions Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date & Time</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Description</TableCell>
                <TableCell align="right">Shares</TableCell>
                <TableCell align="right">Price</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell align="right">Fees</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTransactions
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((transaction) => (
                  <motion.tr
                    key={transaction.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <TableCell>
                      <Box>
                        <Typography variant="body2">
                          {new Date(transaction.date).toLocaleDateString()}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {transaction.time}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        {getTypeIcon(transaction.type)}
                        <Typography variant="body2" textTransform="capitalize">
                          {transaction.type}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        {transaction.company ? (
                          <>
                            <Typography variant="body2" fontWeight={500}>
                              {transaction.company}
                            </Typography>
                            <Box display="flex" alignItems="center" gap={1}>
                              <Chip label={transaction.symbol} size="small" />
                              {transaction.esgScore && (
                                <Chip
                                  label={`ESG: ${transaction.esgScore}`}
                                  size="small"
                                  color={transaction.esgScore >= 80 ? 'success' : 'warning'}
                                  variant="outlined"
                                />
                              )}
                            </Box>
                          </>
                        ) : (
                          <Typography variant="body2">
                            {transaction.notes || transaction.type}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      {transaction.shares ? transaction.shares.toFixed(4) : '-'}
                    </TableCell>
                    <TableCell align="right">
                      {transaction.price ? `$${transaction.price.toFixed(2)}` : '-'}
                    </TableCell>
                    <TableCell align="right">
                      <Typography
                        variant="body2"
                        color={
                          transaction.type === 'sell' || transaction.type === 'dividend'
                            ? 'success.main'
                            : 'text.primary'
                        }
                      >
                        ${transaction.amount.toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      {transaction.fees > 0 ? `$${transaction.fees.toFixed(2)}` : '-'}
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={600}>
                        ${transaction.total.toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      {getStatusChip(transaction.status)}
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => handleViewDetails(transaction)}
                        >
                          <Info />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </motion.tr>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredTransactions.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Transaction Details Dialog */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Transaction Details
          <IconButton
            aria-label="close"
            onClick={() => setDetailsOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <Cancel />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedTransaction && (
            <Stack spacing={2}>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2" color="textSecondary">Transaction ID</Typography>
                <Typography variant="body2" fontFamily="monospace">
                  #{selectedTransaction.id}
                </Typography>
              </Box>
              <Divider />
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2" color="textSecondary">Date & Time</Typography>
                <Typography variant="body2">
                  {new Date(selectedTransaction.date).toLocaleDateString()} {selectedTransaction.time}
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2" color="textSecondary">Type</Typography>
                <Box display="flex" alignItems="center" gap={1}>
                  {getTypeIcon(selectedTransaction.type)}
                  <Typography variant="body2" textTransform="capitalize">
                    {selectedTransaction.type}
                  </Typography>
                </Box>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2" color="textSecondary">Status</Typography>
                {getStatusChip(selectedTransaction.status)}
              </Box>
              {selectedTransaction.company && (
                <>
                  <Divider />
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="textSecondary">Company</Typography>
                    <Typography variant="body2">{selectedTransaction.company}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="textSecondary">Symbol</Typography>
                    <Chip label={selectedTransaction.symbol} size="small" />
                  </Box>
                  {selectedTransaction.shares && (
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2" color="textSecondary">Shares</Typography>
                      <Typography variant="body2">{selectedTransaction.shares.toFixed(4)}</Typography>
                    </Box>
                  )}
                  {selectedTransaction.price && (
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2" color="textSecondary">Price per Share</Typography>
                      <Typography variant="body2">${selectedTransaction.price.toFixed(2)}</Typography>
                    </Box>
                  )}
                </>
              )}
              <Divider />
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2" color="textSecondary">Amount</Typography>
                <Typography variant="body2">${selectedTransaction.amount.toFixed(2)}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2" color="textSecondary">Fees</Typography>
                <Typography variant="body2">${selectedTransaction.fees.toFixed(2)}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body1" fontWeight={600}>Total</Typography>
                <Typography variant="body1" fontWeight={600}>
                  ${selectedTransaction.total.toFixed(2)}
                </Typography>
              </Box>
              {selectedTransaction.paymentMethod && (
                <>
                  <Divider />
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="textSecondary">Payment Method</Typography>
                    <Typography variant="body2">{selectedTransaction.paymentMethod}</Typography>
                  </Box>
                </>
              )}
              {selectedTransaction.notes && (
                <>
                  <Divider />
                  <Box>
                    <Typography variant="body2" color="textSecondary" gutterBottom>Notes</Typography>
                    <Typography variant="body2">{selectedTransaction.notes}</Typography>
                  </Box>
                </>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
          {selectedTransaction?.status === 'pending' && (
            <Button variant="contained" color="error">Cancel Transaction</Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Transactions;