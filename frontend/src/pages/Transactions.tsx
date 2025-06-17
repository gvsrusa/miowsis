import React, { useState, useMemo } from 'react';
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
  Alert,
  Skeleton,
  TableSortLabel
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
  ArrowDownward,
  NaturePeople
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { motion } from 'framer-motion';
import dayjs, { Dayjs } from 'dayjs';
import { useTransactions } from '@/hooks/api';
import { format } from 'date-fns';

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
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [customStartDate, setCustomStartDate] = useState<Dayjs | null>(null);
  const [customEndDate, setCustomEndDate] = useState<Dayjs | null>(null);

  // Prepare filters for API
  const apiFilters = useMemo(() => {
    const filters: any = {
      page,
      size: rowsPerPage
    };

    if (filterType.length > 0) {
      filters.type = filterType.join(',');
    }

    if (searchTerm) {
      filters.symbol = searchTerm;
    }

    return filters;
  }, [page, rowsPerPage, filterType, searchTerm]);

  // Fetch transactions data
  const { data: transactionsData, isLoading, error, refetch } = useTransactions(apiFilters);

  const transactions = transactionsData?.content || [];
  const totalCount = transactionsData?.totalElements || 0;

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    if (!transactions.length) {
      return {
        totalInvested: 0,
        totalGains: 0,
        totalFees: 0,
        transactionCount: 0
      };
    }

    return transactions.reduce((acc, transaction) => {
      if (transaction.type === 'BUY') {
        acc.totalInvested += transaction.amount;
      } else if (transaction.type === 'SELL') {
        acc.totalGains += transaction.amount;
      }
      acc.totalFees += transaction.fees || 0;
      acc.transactionCount += 1;
      return acc;
    }, {
      totalInvested: 0,
      totalGains: 0,
      totalFees: 0,
      transactionCount: 0
    });
  }, [transactions]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFilterTypeChange = (event: any) => {
    const value = event.target.value;
    setFilterType(typeof value === 'string' ? value.split(',') : value);
  };

  const getTransactionIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case 'BUY':
        return <TrendingUp />;
      case 'SELL':
        return <TrendingDown />;
      case 'DIVIDEND':
        return <AttachMoney />;
      case 'ROUND_UP':
      case 'ROUNDUP':
        return <NaturePeople />;
      case 'DEPOSIT':
        return <ArrowDownward />;
      case 'WITHDRAWAL':
        return <ArrowUpward />;
      default:
        return <SwapHoriz />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type.toUpperCase()) {
      case 'BUY':
      case 'DEPOSIT':
      case 'ROUND_UP':
      case 'ROUNDUP':
        return theme.palette.success.main;
      case 'SELL':
      case 'WITHDRAWAL':
        return theme.palette.error.main;
      case 'DIVIDEND':
        return theme.palette.info.main;
      default:
        return theme.palette.text.secondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'COMPLETED':
        return <CheckCircle sx={{ color: theme.palette.success.main }} />;
      case 'PENDING':
        return <Pending sx={{ color: theme.palette.warning.main }} />;
      case 'FAILED':
        return <Cancel sx={{ color: theme.palette.error.main }} />;
      default:
        return <Info />;
    }
  };

  const formatTransactionType = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Export transactions');
  };

  const handlePrint = () => {
    window.print();
  };

  if (error) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load transactions. Please try refreshing the page.
        </Alert>
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Typography variant="h4" fontWeight={600}>
            Transaction History
          </Typography>
          <Box display="flex" gap={2}>
            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={handleExport}
            >
              Export
            </Button>
            <Button
              variant="outlined"
              startIcon={<Print />}
              onClick={handlePrint}
            >
              Print
            </Button>
          </Box>
        </Box>

        {/* Summary Cards */}
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Total Invested
                </Typography>
                {isLoading ? (
                  <Skeleton variant="text" width={100} height={32} />
                ) : (
                  <Typography variant="h5" fontWeight={600}>
                    ${summaryStats.totalInvested.toFixed(2)}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Total Returns
                </Typography>
                {isLoading ? (
                  <Skeleton variant="text" width={100} height={32} />
                ) : (
                  <Typography variant="h5" fontWeight={600} color="success.main">
                    ${summaryStats.totalGains.toFixed(2)}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Total Fees
                </Typography>
                {isLoading ? (
                  <Skeleton variant="text" width={100} height={32} />
                ) : (
                  <Typography variant="h5" fontWeight={600}>
                    ${summaryStats.totalFees.toFixed(2)}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Total Transactions
                </Typography>
                {isLoading ? (
                  <Skeleton variant="text" width={100} height={32} />
                ) : (
                  <Typography variant="h5" fontWeight={600}>
                    {totalCount}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filters */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search by symbol..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Transaction Type</InputLabel>
                <Select
                  multiple
                  value={filterType}
                  onChange={handleFilterTypeChange}
                  input={<OutlinedInput label="Transaction Type" />}
                  renderValue={(selected) => selected.join(', ')}
                >
                  {['BUY', 'SELL', 'DIVIDEND', 'ROUND_UP', 'DEPOSIT', 'WITHDRAWAL'].map((type) => (
                    <MenuItem key={type} value={type}>
                      <Checkbox checked={filterType.indexOf(type) > -1} />
                      <ListItemText primary={formatTransactionType(type)} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Date Range</InputLabel>
                <Select
                  value={dateRange}
                  label="Date Range"
                  onChange={(e) => setDateRange(e.target.value)}
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
            <Grid item xs={12} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<FilterList />}
                onClick={() => refetch()}
              >
                Apply Filters
              </Button>
            </Grid>
          </Grid>

          {dateRange === 'custom' && (
            <Grid container spacing={2} mt={1}>
              <Grid item xs={12} md={6}>
                <DatePicker
                  label="Start Date"
                  value={customStartDate}
                  onChange={setCustomStartDate}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <DatePicker
                  label="End Date"
                  value={customEndDate}
                  onChange={setCustomEndDate}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
            </Grid>
          )}
        </Paper>

        {/* Transactions Table */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date & Time</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Symbol</TableCell>
                <TableCell>Details</TableCell>
                <TableCell align="right">
                  <TableSortLabel
                    active={sortBy === 'amount'}
                    direction={sortBy === 'amount' ? sortOrder : 'desc'}
                    onClick={() => {
                      setSortBy('amount');
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    }}
                  >
                    Amount
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right">Fees</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell align="center">ESG</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                [...Array(5)].map((_, index) => (
                  <TableRow key={index}>
                    {[...Array(10)].map((_, cellIndex) => (
                      <TableCell key={cellIndex}>
                        <Skeleton variant="text" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center">
                    <Typography color="textSecondary" py={4}>
                      No transactions found. Start investing to see your transaction history!
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((transaction, index) => (
                  <TableRow
                    key={transaction.id}
                    component={motion.tr}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    hover
                  >
                    <TableCell>
                      <Box>
                        <Typography variant="body2">
                          {format(new Date(transaction.transactionDate), 'MMM dd, yyyy')}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {format(new Date(transaction.transactionDate), 'HH:mm:ss')}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Avatar
                          sx={{
                            width: 32,
                            height: 32,
                            bgcolor: getTransactionColor(transaction.type) + '20'
                          }}
                        >
                          {React.cloneElement(getTransactionIcon(transaction.type) as React.ReactElement, {
                            sx: { fontSize: 18, color: getTransactionColor(transaction.type) }
                          })}
                        </Avatar>
                        <Typography variant="body2">
                          {formatTransactionType(transaction.type)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {transaction.symbol ? (
                        <Chip label={transaction.symbol} size="small" />
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">
                          {transaction.securityName || transaction.description || '-'}
                        </Typography>
                        {transaction.quantity && (
                          <Typography variant="caption" color="textSecondary">
                            {transaction.quantity} shares @ ${transaction.price?.toFixed(2)}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Typography
                        variant="body2"
                        fontWeight={500}
                        color={transaction.type === 'SELL' || transaction.type === 'WITHDRAWAL' ? 'error.main' : 'success.main'}
                      >
                        {transaction.type === 'SELL' || transaction.type === 'WITHDRAWAL' ? '-' : '+'}
                        ${Math.abs(transaction.amount).toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        ${(transaction.fees || 0).toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={500}>
                        ${Math.abs(transaction.totalAmount || transaction.amount).toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      {transaction.esgScore ? (
                        <Chip
                          label={Math.round(transaction.esgScore)}
                          size="small"
                          color={
                            transaction.esgScore >= 80 ? 'success' :
                            transaction.esgScore >= 60 ? 'warning' : 'error'
                          }
                        />
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title={transaction.status || 'Completed'}>
                        {getStatusIcon(transaction.status || 'COMPLETED')}
                      </Tooltip>
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          setSelectedTransaction(transaction);
                          setDetailsOpen(true);
                        }}
                      >
                        <Info />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {!isLoading && transactions.length > 0 && (
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={totalCount}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          )}
        </TableContainer>

        {/* Transaction Details Dialog */}
        <Dialog
          open={detailsOpen}
          onClose={() => setDetailsOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          {selectedTransaction && (
            <>
              <DialogTitle>
                <Box display="flex" alignItems="center" gap={2}>
                  <Avatar
                    sx={{
                      bgcolor: getTransactionColor(selectedTransaction.type) + '20'
                    }}
                  >
                    {React.cloneElement(getTransactionIcon(selectedTransaction.type) as React.ReactElement, {
                      sx: { color: getTransactionColor(selectedTransaction.type) }
                    })}
                  </Avatar>
                  <Box>
                    <Typography variant="h6">
                      {formatTransactionType(selectedTransaction.type)} Transaction
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      ID: {selectedTransaction.id}
                    </Typography>
                  </Box>
                </Box>
              </DialogTitle>
              <DialogContent dividers>
                <Stack spacing={2}>
                  <Box display="flex" justifyContent="space-between">
                    <Typography color="textSecondary">Date & Time:</Typography>
                    <Typography>
                      {format(new Date(selectedTransaction.transactionDate), 'PPpp')}
                    </Typography>
                  </Box>
                  {selectedTransaction.symbol && (
                    <Box display="flex" justifyContent="space-between">
                      <Typography color="textSecondary">Symbol:</Typography>
                      <Typography>{selectedTransaction.symbol}</Typography>
                    </Box>
                  )}
                  {selectedTransaction.securityName && (
                    <Box display="flex" justifyContent="space-between">
                      <Typography color="textSecondary">Security:</Typography>
                      <Typography>{selectedTransaction.securityName}</Typography>
                    </Box>
                  )}
                  {selectedTransaction.quantity && (
                    <Box display="flex" justifyContent="space-between">
                      <Typography color="textSecondary">Quantity:</Typography>
                      <Typography>{selectedTransaction.quantity} shares</Typography>
                    </Box>
                  )}
                  {selectedTransaction.price && (
                    <Box display="flex" justifyContent="space-between">
                      <Typography color="textSecondary">Price per Share:</Typography>
                      <Typography>${selectedTransaction.price.toFixed(2)}</Typography>
                    </Box>
                  )}
                  <Divider />
                  <Box display="flex" justifyContent="space-between">
                    <Typography color="textSecondary">Amount:</Typography>
                    <Typography fontWeight={500}>
                      ${Math.abs(selectedTransaction.amount).toFixed(2)}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography color="textSecondary">Fees:</Typography>
                    <Typography>${(selectedTransaction.fees || 0).toFixed(2)}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography color="textSecondary">Total:</Typography>
                    <Typography fontWeight={600}>
                      ${Math.abs(selectedTransaction.totalAmount || selectedTransaction.amount).toFixed(2)}
                    </Typography>
                  </Box>
                  {selectedTransaction.esgScore && (
                    <>
                      <Divider />
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography color="textSecondary">ESG Score:</Typography>
                        <Chip
                          label={Math.round(selectedTransaction.esgScore)}
                          color={
                            selectedTransaction.esgScore >= 80 ? 'success' :
                            selectedTransaction.esgScore >= 60 ? 'warning' : 'error'
                          }
                        />
                      </Box>
                    </>
                  )}
                  {selectedTransaction.notes && (
                    <>
                      <Divider />
                      <Box>
                        <Typography color="textSecondary" gutterBottom>Notes:</Typography>
                        <Typography variant="body2">{selectedTransaction.notes}</Typography>
                      </Box>
                    </>
                  )}
                </Stack>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setDetailsOpen(false)}>Close</Button>
                <Button
                  variant="contained"
                  startIcon={<Receipt />}
                  onClick={() => {
                    // TODO: Implement receipt download
                    console.log('Download receipt');
                  }}
                >
                  Download Receipt
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default Transactions;