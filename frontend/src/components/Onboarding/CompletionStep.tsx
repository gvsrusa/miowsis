import React from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
  Chip,
  Avatar
} from '@mui/material';
import {
  CheckCircle,
  TrendingUp,
  NaturePeople,
  Security,
  Speed,
  Celebration,
  AttachMoney,
  Loop
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import Lottie from 'lottie-react';
import { RootState } from '@/store';

const CompletionStep: React.FC = () => {
  const { data } = useSelector((state: RootState) => state.onboarding);

  const features = [
    {
      icon: <TrendingUp />,
      title: 'Smart Portfolio Built',
      description: `Your ${data.riskTolerance} portfolio is ready to grow`
    },
    {
      icon: <NaturePeople />,
      title: 'ESG Preferences Set',
      description: 'Investing in companies that match your values'
    },
    {
      icon: <Security />,
      title: 'Bank-Level Security',
      description: 'Your account is protected with advanced encryption'
    },
    {
      icon: <Speed />,
      title: 'AI Assistant Ready',
      description: 'Get personalized advice anytime you need it'
    }
  ];

  return (
    <Box textAlign="center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, type: 'spring' }}
      >
        <Box
          sx={{
            width: 120,
            height: 120,
            margin: '0 auto',
            mb: 3,
            background: 'linear-gradient(135deg, #4CAF50 0%, #2196F3 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Celebration sx={{ fontSize: 60, color: 'white' }} />
        </Box>
      </motion.div>

      <Typography variant="h4" gutterBottom fontWeight={600}>
        Congratulations! 🎉
      </Typography>
      <Typography variant="h6" color="textSecondary" sx={{ mb: 4 }}>
        Your MIOwSIS account is ready to start building wealth
      </Typography>

      {/* Summary Card */}
      <Card sx={{ mb: 4, textAlign: 'left' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Your Investment Profile
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={1} mb={3}>
            <Chip
              label={`Risk: ${data.riskTolerance}`}
              color="primary"
              icon={<TrendingUp />}
            />
            {data.monthlyInvestment > 0 && (
              <Chip
                label={`$${data.monthlyInvestment}/month`}
                color="secondary"
                icon={<AttachMoney />}
              />
            )}
            {data.roundUpsEnabled && (
              <Chip
                label="Round-ups Enabled"
                color="success"
                icon={<Loop />}
              />
            )}
          </Box>

          <List>
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <ListItem>
                  <ListItemIcon>
                    <Avatar
                      sx={{
                        bgcolor: 'primary.light',
                        color: 'primary.main'
                      }}
                    >
                      {feature.icon}
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary={feature.title}
                    secondary={feature.description}
                  />
                </ListItem>
              </motion.div>
            ))}
          </List>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card sx={{ mb: 4, bgcolor: 'primary.light' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            What happens next?
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            1. We'll process your initial deposit
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            2. Your portfolio will be automatically diversified across ESG-focused investments
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            3. Round-ups will start with your next purchase
          </Typography>
          <Typography variant="body2">
            4. Track your progress and impact on your personalized dashboard
          </Typography>
        </CardContent>
      </Card>

      {/* Fun Fact */}
      <Box
        sx={{
          p: 3,
          bgcolor: 'info.light',
          borderRadius: 2,
          mb: 4
        }}
      >
        <Typography variant="subtitle1" fontWeight={500} gutterBottom>
          Did you know?
        </Typography>
        <Typography variant="body2">
          If you invest $250/month starting at age 25, you could have over $1 million by retirement! 
          Time and compound interest are your best friends.
        </Typography>
      </Box>

      <Typography variant="h5" fontWeight={600} gutterBottom>
        Ready to see your dashboard?
      </Typography>
      <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
        Explore your portfolio, track performance, and watch your impact grow
      </Typography>

      <Button
        variant="contained"
        size="large"
        sx={{
          background: 'linear-gradient(90deg, #4CAF50 0%, #2196F3 100%)',
          color: 'white',
          px: 4,
          py: 1.5
        }}
      >
        Go to Dashboard
      </Button>
    </Box>
  );
};

export default CompletionStep;