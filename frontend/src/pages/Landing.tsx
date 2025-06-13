import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Grid,
  Typography,
  Card,
  CardContent,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Eco,
  Security,
  Speed,
  AccountBalance,
  ShowChart
} from '@mui/icons-material';

const features = [
  {
    icon: <TrendingUp fontSize="large" />,
    title: 'Micro-Investments',
    description: 'Start investing with as little as $1. Round up your purchases automatically.'
  },
  {
    icon: <Eco fontSize="large" />,
    title: 'ESG Impact Scoring',
    description: 'See the real-world impact of your investments on environment and society.'
  },
  {
    icon: <Security fontSize="large" />,
    title: 'Bank-Level Security',
    description: 'Your data is protected with biometric authentication and encryption.'
  },
  {
    icon: <Speed fontSize="large" />,
    title: 'AI-Powered Insights',
    description: 'Get personalized investment recommendations based on your goals.'
  },
  {
    icon: <AccountBalance fontSize="large" />,
    title: 'Portfolio Optimization',
    description: 'Automatic rebalancing to maximize returns and minimize risk.'
  },
  {
    icon: <ShowChart fontSize="large" />,
    title: 'Real-Time Analytics',
    description: 'Track your portfolio performance with interactive visualizations.'
  }
];

const Landing: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #4CAF50 0%, #2196F3 100%)',
          color: 'white',
          py: 8,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Typography
                  variant="h1"
                  sx={{
                    fontSize: { xs: '2.5rem', md: '3.5rem' },
                    fontWeight: 700,
                    mb: 2
                  }}
                >
                  Invest Spare Change for a Better World
                </Typography>
                <Typography variant="h5" sx={{ mb: 4, opacity: 0.9 }}>
                  Micro-investments with macro impact. Build wealth while supporting sustainable companies.
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Button
                    component={RouterLink}
                    to="/register"
                    variant="contained"
                    size="large"
                    sx={{
                      bgcolor: 'white',
                      color: 'primary.main',
                      '&:hover': {
                        bgcolor: 'grey.100'
                      }
                    }}
                  >
                    Get Started
                  </Button>
                  <Button
                    component={RouterLink}
                    to="/login"
                    variant="outlined"
                    size="large"
                    sx={{
                      borderColor: 'white',
                      color: 'white',
                      '&:hover': {
                        borderColor: 'white',
                        bgcolor: 'rgba(255, 255, 255, 0.1)'
                      }
                    }}
                  >
                    Sign In
                  </Button>
                </Box>
              </motion.div>
            </Grid>
            <Grid item xs={12} md={6}>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Box
                  component="img"
                  src="/hero-illustration.svg"
                  alt="Investment illustration"
                  sx={{
                    width: '100%',
                    maxWidth: 500,
                    height: 'auto'
                  }}
                />
              </motion.div>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography
          variant="h2"
          align="center"
          sx={{ mb: 2, fontWeight: 600 }}
        >
          Why Choose MIOwSIS?
        </Typography>
        <Typography
          variant="h6"
          align="center"
          color="text.secondary"
          sx={{ mb: 6 }}
        >
          The smartest way to invest for your future and the planet
        </Typography>

        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card
                  sx={{
                    height: '100%',
                    transition: 'transform 0.3s',
                    '&:hover': {
                      transform: 'translateY(-8px)'
                    }
                  }}
                >
                  <CardContent sx={{ textAlign: 'center', p: 4 }}>
                    <Box
                      sx={{
                        color: 'primary.main',
                        mb: 2,
                        display: 'flex',
                        justifyContent: 'center'
                      }}
                    >
                      {feature.icon}
                    </Box>
                    <Typography variant="h6" gutterBottom>
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* CTA Section */}
      <Box sx={{ bgcolor: 'grey.100', py: 8 }}>
        <Container maxWidth="md">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Typography
              variant="h3"
              align="center"
              sx={{ mb: 3, fontWeight: 600 }}
            >
              Ready to Start Your Investment Journey?
            </Typography>
            <Typography
              variant="h6"
              align="center"
              color="text.secondary"
              sx={{ mb: 4 }}
            >
              Join thousands of investors making a difference with every dollar
            </Typography>
            <Box sx={{ textAlign: 'center' }}>
              <Button
                component={RouterLink}
                to="/register"
                variant="contained"
                size="large"
                color="primary"
              >
                Create Free Account
              </Button>
            </Box>
          </motion.div>
        </Container>
      </Box>
    </Box>
  );
};

export default Landing;