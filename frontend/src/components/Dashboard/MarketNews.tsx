import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Grid,
  Link,
  Avatar,
  Skeleton,
  Alert
} from '@mui/material';
import { NaturePeople, TrendingUp, Article } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useMarketNews } from '@/hooks/api';
import { formatDistanceToNow } from 'date-fns';

const MarketNews: React.FC = () => {
  const { data: newsData, isLoading, error } = useMarketNews('esg');

  const getCategoryIcon = (category: string) => {
    const lowerCategory = category?.toLowerCase() || '';
    if (lowerCategory.includes('esg') || lowerCategory.includes('sustain')) {
      return <NaturePeople />;
    }
    if (lowerCategory.includes('market') || lowerCategory.includes('stock')) {
      return <TrendingUp />;
    }
    return <Article />;
  };

  const getImpactColor = (sentiment?: string) => {
    const lowerSentiment = sentiment?.toLowerCase() || '';
    if (lowerSentiment.includes('positive') || lowerSentiment.includes('bullish')) {
      return 'success';
    }
    if (lowerSentiment.includes('negative') || lowerSentiment.includes('bearish')) {
      return 'error';
    }
    return 'default';
  };

  const getCategoryFromTags = (tags?: string[]): string => {
    if (!tags || tags.length === 0) return 'news';
    
    const tagString = tags.join(' ').toLowerCase();
    if (tagString.includes('esg') || tagString.includes('sustain')) return 'ESG';
    if (tagString.includes('market') || tagString.includes('stock')) return 'Market';
    if (tagString.includes('company') || tagString.includes('earning')) return 'Company';
    return 'News';
  };

  if (isLoading) {
    return (
      <Grid container spacing={3}>
        {[1, 2, 3, 4].map((i) => (
          <Grid item xs={12} md={6} key={i}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Skeleton variant="circular" width={32} height={32} />
                    <Box>
                      <Skeleton variant="text" width={80} height={16} />
                      <Skeleton variant="text" width={60} height={16} />
                    </Box>
                  </Box>
                  <Skeleton variant="rectangular" width={60} height={22} sx={{ borderRadius: 1 }} />
                </Box>
                <Skeleton variant="text" width="90%" height={24} sx={{ mb: 1 }} />
                <Skeleton variant="text" width="100%" height={16} />
                <Skeleton variant="text" width="100%" height={16} />
                <Skeleton variant="text" width="80%" height={16} />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        Failed to load market news. Please try again later.
      </Alert>
    );
  }

  const newsItems = newsData?.articles || [];

  if (newsItems.length === 0) {
    return (
      <Box textAlign="center" py={4}>
        <Typography color="textSecondary">
          No ESG news available at the moment. Check back later!
        </Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={3}>
      {newsItems.slice(0, 4).map((item: any, index: number) => (
        <Grid item xs={12} md={6} key={item.id || index}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s',
                cursor: 'pointer',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 3
                }
              }}
            >
              <CardContent sx={{ flex: 1 }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        bgcolor: `${getImpactColor(item.sentiment)}.light`
                      }}
                    >
                      {React.cloneElement(getCategoryIcon(getCategoryFromTags(item.tags)) as React.ReactElement, {
                        sx: { fontSize: 18, color: `${getImpactColor(item.sentiment)}.main` }
                      })}
                    </Avatar>
                    <Box>
                      <Typography variant="caption" color="textSecondary">
                        {item.source || 'Market News'}
                      </Typography>
                      <Typography variant="caption" color="textSecondary" display="block">
                        {item.publishedAt ? formatDistanceToNow(new Date(item.publishedAt), { addSuffix: true }) : 'Recently'}
                      </Typography>
                    </Box>
                  </Box>
                  <Chip
                    label={getCategoryFromTags(item.tags)}
                    size="small"
                    color={getImpactColor(item.sentiment) as any}
                    variant="outlined"
                  />
                </Box>

                <Link
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  underline="none"
                  color="inherit"
                >
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    {item.title}
                  </Typography>
                </Link>

                <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                  {item.summary || item.description}
                </Typography>

                <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                  {item.sentiment && (
                    <Chip
                      label={`${item.sentiment === 'positive' ? '+' : item.sentiment === 'negative' ? '-' : ''}ESG Impact`}
                      size="small"
                      color={getImpactColor(item.sentiment) as any}
                    />
                  )}
                  {item.tags && item.tags.slice(0, 2).map((tag: string, tagIndex: number) => (
                    <Chip
                      key={tagIndex}
                      label={tag}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      ))}
    </Grid>
  );
};

export default MarketNews;