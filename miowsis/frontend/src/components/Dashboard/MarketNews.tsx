import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Grid,
  Link,
  Avatar
} from '@mui/material';
import { Eco, TrendingUp, Article } from '@mui/icons-material';
import { motion } from 'framer-motion';

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  time: string;
  category: 'esg' | 'market' | 'company';
  impact: 'positive' | 'negative' | 'neutral';
  imageUrl?: string;
}

const MarketNews: React.FC = () => {
  const newsItems: NewsItem[] = [
    {
      id: '1',
      title: 'Tesla Achieves Record ESG Score with New Solar Initiative',
      summary: 'Tesla\'s latest sustainability report shows significant improvements in environmental metrics...',
      source: 'ESG Today',
      time: '2 hours ago',
      category: 'esg',
      impact: 'positive',
      imageUrl: '/news/tesla-solar.jpg'
    },
    {
      id: '2',
      title: 'Microsoft Commits $1B to Carbon Removal Technology',
      summary: 'Tech giant announces major investment in direct air capture and other carbon removal solutions...',
      source: 'GreenTech News',
      time: '5 hours ago',
      category: 'esg',
      impact: 'positive',
      imageUrl: '/news/microsoft-carbon.jpg'
    },
    {
      id: '3',
      title: 'Sustainable ETFs See Record Inflows in Q2 2025',
      summary: 'Investor demand for ESG-focused funds continues to surge, with $50B in new investments...',
      source: 'Financial Times',
      time: '1 day ago',
      category: 'market',
      impact: 'positive',
      imageUrl: '/news/etf-growth.jpg'
    },
    {
      id: '4',
      title: 'Apple Faces Scrutiny Over Supply Chain Labor Practices',
      summary: 'New report raises concerns about working conditions at key supplier facilities...',
      source: 'Reuters',
      time: '1 day ago',
      category: 'company',
      impact: 'negative',
      imageUrl: '/news/apple-supply.jpg'
    }
  ];

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'esg':
        return <Eco />;
      case 'market':
        return <TrendingUp />;
      default:
        return <Article />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'positive':
        return 'success';
      case 'negative':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Grid container spacing={3}>
      {newsItems.map((item, index) => (
        <Grid item xs={12} md={6} key={item.id}>
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
                        bgcolor: `${getImpactColor(item.impact)}.light`
                      }}
                    >
                      {React.cloneElement(getCategoryIcon(item.category) as React.ReactElement, {
                        sx: { fontSize: 18, color: `${getImpactColor(item.impact)}.main` }
                      })}
                    </Avatar>
                    <Box>
                      <Typography variant="caption" color="textSecondary">
                        {item.source}
                      </Typography>
                      <Typography variant="caption" color="textSecondary" display="block">
                        {item.time}
                      </Typography>
                    </Box>
                  </Box>
                  <Chip
                    label={item.category.toUpperCase()}
                    size="small"
                    color={getImpactColor(item.impact) as any}
                    variant="outlined"
                  />
                </Box>

                <Link
                  href="#"
                  underline="none"
                  color="inherit"
                  onClick={(e) => e.preventDefault()}
                >
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    {item.title}
                  </Typography>
                </Link>

                <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                  {item.summary}
                </Typography>

                <Box display="flex" alignItems="center" gap={1}>
                  <Chip
                    label={`${item.impact === 'positive' ? '+' : item.impact === 'negative' ? '-' : ''}ESG Impact`}
                    size="small"
                    color={getImpactColor(item.impact) as any}
                  />
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