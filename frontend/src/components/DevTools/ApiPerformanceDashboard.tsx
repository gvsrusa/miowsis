import React, { useState, useEffect } from 'react';
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
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  Collapse,
  LinearProgress,
  Button,
  Tooltip
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Speed as SpeedIcon,
  Storage as StorageIcon,
  Timeline as TimelineIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { performanceMonitor, getOptimizationStats, clearOptimizations } from '@/services/api/optimizations';

interface PerformanceStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  totalDataTransferred: number;
  cacheHitRate: number;
  errorRate: number;
  requestsPerMinute: number;
}

interface EndpointStats {
  endpoint: string;
  count: number;
  averageTime: number;
  errorCount: number;
  cacheHitCount: number;
}

export const ApiPerformanceDashboard: React.FC = () => {
  const [stats, setStats] = useState<PerformanceStats | null>(null);
  const [endpointStats, setEndpointStats] = useState<EndpointStats[]>([]);
  const [optimizationStats, setOptimizationStats] = useState<any>(null);
  const [expanded, setExpanded] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    const updateStats = () => {
      setStats(performanceMonitor.getStats());
      setEndpointStats(performanceMonitor.getEndpointStats());
      setOptimizationStats(getOptimizationStats());
    };

    updateStats();

    if (autoRefresh) {
      const interval = setInterval(updateStats, 2000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  if (!stats || !optimizationStats) {
    return <LinearProgress />;
  }

  return (
    <Box sx={{ position: 'fixed', bottom: 16, right: 16, zIndex: 9999, maxWidth: 800 }}>
      <Paper elevation={4}>
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SpeedIcon /> API Performance Monitor
          </Typography>
          <Box>
            <Tooltip title="Auto-refresh">
              <IconButton 
                size="small" 
                onClick={() => setAutoRefresh(!autoRefresh)}
                color={autoRefresh ? 'primary' : 'default'}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Clear all caches">
              <IconButton size="small" onClick={() => {
                clearOptimizations();
                window.location.reload();
              }}>
                <ClearIcon />
              </IconButton>
            </Tooltip>
            <IconButton size="small" onClick={() => setExpanded(!expanded)}>
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
        </Box>

        <Collapse in={expanded}>
          <Box sx={{ p: 2, pt: 0 }}>
            {/* Summary Stats */}
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={3}>
                <Card variant="outlined">
                  <CardContent sx={{ p: 2 }}>
                    <Typography color="text.secondary" variant="caption">
                      Total Requests
                    </Typography>
                    <Typography variant="h5">{stats.totalRequests}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {stats.requestsPerMinute.toFixed(1)} req/min
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={3}>
                <Card variant="outlined">
                  <CardContent sx={{ p: 2 }}>
                    <Typography color="text.secondary" variant="caption">
                      Avg Response Time
                    </Typography>
                    <Typography variant="h5">{formatTime(stats.averageResponseTime)}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      P95: {formatTime(stats.p95ResponseTime)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={3}>
                <Card variant="outlined">
                  <CardContent sx={{ p: 2 }}>
                    <Typography color="text.secondary" variant="caption">
                      Cache Hit Rate
                    </Typography>
                    <Typography variant="h5" color="success.main">
                      {stats.cacheHitRate.toFixed(1)}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatBytes(stats.totalDataTransferred)} saved
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={3}>
                <Card variant="outlined">
                  <CardContent sx={{ p: 2 }}>
                    <Typography color="text.secondary" variant="caption">
                      Error Rate
                    </Typography>
                    <Typography 
                      variant="h5" 
                      color={stats.errorRate > 5 ? 'error.main' : 'text.primary'}
                    >
                      {stats.errorRate.toFixed(1)}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {stats.failedRequests} failed
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Optimization Stats */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Optimization Status
              </Typography>
              <Grid container spacing={1}>
                <Grid item>
                  <Chip
                    icon={<CheckCircleIcon />}
                    label={`Dedup: ${optimizationStats.deduplication.pendingCount} pending`}
                    size="small"
                    color="success"
                    variant="outlined"
                  />
                </Grid>
                <Grid item>
                  <Chip
                    icon={<StorageIcon />}
                    label={`Cache: ${optimizationStats.cache.default.size} entries`}
                    size="small"
                    color="success"
                    variant="outlined"
                  />
                </Grid>
                <Grid item>
                  <Chip
                    icon={<TimelineIcon />}
                    label={`Batch: ${optimizationStats.batching.totalPending} queued`}
                    size="small"
                    color="success"
                    variant="outlined"
                  />
                </Grid>
                <Grid item>
                  <Chip
                    label={`Prefetch: ${optimizationStats.prefetching.queueSize} active`}
                    size="small"
                    color="success"
                    variant="outlined"
                  />
                </Grid>
              </Grid>
            </Box>

            {/* Endpoint Stats */}
            <TableContainer sx={{ maxHeight: 300 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Endpoint</TableCell>
                    <TableCell align="right">Calls</TableCell>
                    <TableCell align="right">Avg Time</TableCell>
                    <TableCell align="right">Cache Hits</TableCell>
                    <TableCell align="right">Errors</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {endpointStats.slice(0, 10).map((endpoint) => (
                    <TableRow key={endpoint.endpoint}>
                      <TableCell component="th" scope="row">
                        <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                          {endpoint.endpoint}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">{endpoint.count}</TableCell>
                      <TableCell align="right">{formatTime(endpoint.averageTime)}</TableCell>
                      <TableCell align="right">
                        {endpoint.cacheHitCount > 0 && (
                          <Chip 
                            label={endpoint.cacheHitCount} 
                            size="small" 
                            color="success"
                            variant="outlined"
                          />
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {endpoint.errorCount > 0 && (
                          <Chip 
                            label={endpoint.errorCount} 
                            size="small" 
                            color="error"
                            icon={<ErrorIcon />}
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Collapse>
      </Paper>
    </Box>
  );
};