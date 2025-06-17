import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Speed as SpeedIcon,
  Storage as StorageIcon,
  Sync as SyncIcon,
  CloudDownload as CloudDownloadIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';
import { usePrefetch, useRoutePrefetch } from '@/hooks/api/usePrefetch';
import { api } from '@/services/api';
import { batchHelpers } from '@/services/api/optimizations';

/**
 * Example component demonstrating API optimization features
 */
export const ApiOptimizationExample: React.FC = () => {
  const [loading, setLoading] = useState<string | null>(null);
  const [results, setResults] = useState<any[]>([]);

  // Example 1: Prefetching on hover
  const portfolioPrefetch = usePrefetch(
    '/api/portfolio/holdings',
    { page: 0, size: 20 },
    { onHover: true, delay: 200 }
  );

  // Example 2: Route-based prefetching
  useRoutePrefetch([
    {
      path: '/dashboard',
      prefetch: [
        '/api/portfolio/portfolios',
        '/api/portfolio/performance',
        '/api/esg/impact'
      ]
    },
    {
      path: '/portfolio',
      prefetch: [
        '/api/portfolio/holdings',
        '/api/portfolio/allocation'
      ]
    }
  ]);

  // Example 3: Request deduplication demo
  const testDeduplication = async () => {
    setLoading('deduplication');
    setResults([]);

    // Fire 5 identical requests simultaneously
    const promises = Array(5).fill(null).map((_, i) => 
      api.get('/api/portfolio/portfolios/123')
        .then(data => ({ request: i + 1, data, cached: false }))
        .catch(err => ({ request: i + 1, error: err.message }))
    );

    const results = await Promise.all(promises);
    setResults(results);
    setLoading(null);
  };

  // Example 4: Batch requests demo
  const testBatching = async () => {
    setLoading('batching');
    setResults([]);

    // Request multiple stock quotes in a batch
    const symbols = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA'];
    
    try {
      const quotes = await batchHelpers.market.getQuotes(symbols);
      setResults(quotes.map((quote, i) => ({
        symbol: symbols[i],
        data: quote
      })));
    } catch (error) {
      setResults([{ error: 'Batch request failed' }]);
    }

    setLoading(null);
  };

  // Example 5: Cache demonstration
  const testCaching = async () => {
    setLoading('caching');
    setResults([]);

    // First request - will hit the server
    const start1 = performance.now();
    const data1 = await api.get('/api/esg/companies');
    const time1 = performance.now() - start1;

    // Second request - should be cached
    const start2 = performance.now();
    const data2 = await api.get('/api/esg/companies');
    const time2 = performance.now() - start2;

    setResults([
      { request: 'First request', time: `${time1.toFixed(2)}ms`, cached: false },
      { request: 'Second request', time: `${time2.toFixed(2)}ms`, cached: true }
    ]);

    setLoading(null);
  };

  // Example 6: Performance monitoring
  const getPerformanceStats = () => {
    const stats = api.getStats();
    const endpointStats = api.getEndpointStats();
    
    setResults([
      {
        type: 'Overall Stats',
        data: {
          totalRequests: stats.totalRequests,
          avgResponseTime: `${stats.averageResponseTime.toFixed(2)}ms`,
          cacheHitRate: `${stats.cacheHitRate.toFixed(1)}%`,
          errorRate: `${stats.errorRate.toFixed(1)}%`
        }
      },
      {
        type: 'Top Endpoints',
        data: endpointStats.slice(0, 5)
      }
    ]);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        API Optimization Examples
      </Typography>
      
      <Grid container spacing={3}>
        {/* Deduplication Example */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SyncIcon /> Request Deduplication
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Prevents duplicate simultaneous requests to the same endpoint.
                Try firing multiple identical requests - only one will actually hit the server.
              </Typography>
              <Divider sx={{ my: 2 }} />
              {loading === 'deduplication' && <CircularProgress size={24} />}
              {results.length > 0 && loading !== 'deduplication' && (
                <List dense>
                  {results.map((result, i) => (
                    <ListItem key={i}>
                      <ListItemText
                        primary={`Request ${result.request}`}
                        secondary={result.error || 'Success - Same response'}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
            <CardActions>
              <Button 
                size="small" 
                onClick={testDeduplication}
                disabled={loading === 'deduplication'}
              >
                Test Deduplication
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* Caching Example */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <StorageIcon /> Response Caching
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Caches API responses with configurable TTLs. The second request
                will be served from cache, significantly faster.
              </Typography>
              <Divider sx={{ my: 2 }} />
              {loading === 'caching' && <CircularProgress size={24} />}
              {results.length > 0 && loading !== 'caching' && (
                <List dense>
                  {results.map((result, i) => (
                    <ListItem key={i}>
                      <ListItemText
                        primary={result.request}
                        secondary={result.time}
                      />
                      {result.cached && (
                        <Chip label="Cached" size="small" color="success" />
                      )}
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
            <CardActions>
              <Button 
                size="small" 
                onClick={testCaching}
                disabled={loading === 'caching'}
              >
                Test Caching
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* Batching Example */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TimelineIcon /> Request Batching
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Batches multiple API calls into a single request. Instead of 5 separate
                requests for stock quotes, they're combined into one.
              </Typography>
              <Divider sx={{ my: 2 }} />
              {loading === 'batching' && <CircularProgress size={24} />}
              {results.length > 0 && loading !== 'batching' && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  {results.length} stock quotes fetched in a single batch request
                </Alert>
              )}
            </CardContent>
            <CardActions>
              <Button 
                size="small" 
                onClick={testBatching}
                disabled={loading === 'batching'}
              >
                Test Batching
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* Prefetching Example */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CloudDownloadIcon /> Smart Prefetching
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Intelligently prefetches data based on user behavior. Hover over
                the button below to prefetch portfolio data.
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ mt: 2 }}>
                <Button
                  ref={portfolioPrefetch.ref}
                  variant="outlined"
                  fullWidth
                >
                  Hover to Prefetch Portfolio Data
                </Button>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Data will be prefetched after 200ms hover
                </Typography>
              </Box>
            </CardContent>
            <CardActions>
              <Button 
                size="small" 
                onClick={() => portfolioPrefetch.prefetch()}
              >
                Prefetch Now
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* Performance Monitoring */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SpeedIcon /> Performance Monitoring
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Real-time monitoring of API performance metrics and endpoint statistics.
              </Typography>
              <Divider sx={{ my: 2 }} />
              {results.length > 0 && results[0]?.type === 'Overall Stats' && (
                <Grid container spacing={2}>
                  {Object.entries(results[0].data).map(([key, value]) => (
                    <Grid item xs={3} key={key}>
                      <Typography variant="caption" color="text.secondary">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </Typography>
                      <Typography variant="h6">{value as string}</Typography>
                    </Grid>
                  ))}
                </Grid>
              )}
            </CardContent>
            <CardActions>
              <Button size="small" onClick={getPerformanceStats}>
                Get Performance Stats
              </Button>
              <Button size="small" onClick={() => api.clearCache('/')}>
                Clear All Caches
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};