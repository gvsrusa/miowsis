import React from 'react';
import { Box, Typography, Avatar, Grid } from '@mui/material';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  NaturePeople,
  Security,
  Psychology
} from '@mui/icons-material';
import Lottie from 'lottie-react';

const features = [
  {
    icon: <TrendingUp />,
    title: 'Smart Investing',
    description: 'Start with as little as $1 and watch your wealth grow'
  },
  {
    icon: <NaturePeople />,
    title: 'ESG Focused',
    description: 'Invest in companies that align with your values'
  },
  {
    icon: <Security />,
    title: 'Bank-Level Security',
    description: 'Your data and investments are protected 24/7'
  },
  {
    icon: <Psychology />,
    title: 'AI-Powered Insights',
    description: 'Get personalized recommendations based on your goals'
  }
];

const WelcomeStep: React.FC = () => {
  return (
    <Box textAlign="center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, type: 'spring' }}
      >
        <Box
          sx={{
            width: 200,
            height: 200,
            margin: '0 auto',
            mb: 4,
            background: 'linear-gradient(135deg, #4CAF50 0%, #2196F3 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Typography variant="h1" sx={{ color: 'white', fontSize: '4rem' }}>
            👋
          </Typography>
        </Box>
      </motion.div>

      <Typography variant="h4" gutterBottom fontWeight={600}>
        Welcome to Your Financial Future
      </Typography>
      <Typography variant="body1" color="textSecondary" sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}>
        Let&apos;s get you started on your investment journey. This quick setup will help us personalize
        your experience and build a portfolio that matches your goals and values.
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {features.map((feature, index) => (
          <Grid item xs={12} sm={6} key={index}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Box
                sx={{
                  p: 3,
                  borderRadius: 2,
                  backgroundColor: 'rgba(76, 175, 80, 0.1)',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)'
                  }
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: 'primary.main',
                    mb: 2,
                    mx: 'auto'
                  }}
                >
                  {feature.icon}
                </Avatar>
                <Typography variant="h6" gutterBottom>
                  {feature.title}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {feature.description}
                </Typography>
              </Box>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      <Typography variant="caption" color="textSecondary" sx={{ mt: 4, display: 'block' }}>
        This process takes about 5 minutes to complete
      </Typography>
    </Box>
  );
};

export default WelcomeStep;