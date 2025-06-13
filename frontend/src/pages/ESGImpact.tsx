import React, { useState } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Chip,
  IconButton,
  Button,
  LinearProgress,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemAvatar,
  Divider,
  useTheme,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  CircularProgress,
  Rating,
  Stack,
  Alert,
  AlertTitle,
  Tab,
  Tabs
} from '@mui/material';
import {
  NaturePeople,
  Forest,
  WaterDrop,
  Co2,
  Groups,
  HealthAndSafety,
  School,
  Work,
  AccountBalance,
  Gavel,
  Business,
  Diversity3,
  TrendingUp,
  TrendingDown,
  Info,
  Share,
  Download,
  EmojiEvents,
  LocalFlorist,
  PublicOutlined
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { Doughnut, Bar, Line, Radar } from 'react-chartjs-2';
import '@utils/chartConfig';

interface ESGMetric {
  category: string;
  score: number;
  change: number;
  impact: string;
  icon: React.ReactNode;
  color: string;
}

interface ImpactProject {
  id: string;
  title: string;
  organization: string;
  category: 'environmental' | 'social' | 'governance';
  impact: string;
  funded: number;
  goal: number;
  supporters: number;
  image?: string;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  date: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

const ESGImpact: React.FC = () => {
  const theme = useTheme();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [timeRange, setTimeRange] = useState('YTD');
  const [tabValue, setTabValue] = useState(0);

  // ESG Metrics
  const esgMetrics: ESGMetric[] = [
    {
      category: 'Environmental',
      score: 92,
      change: 5,
      impact: '2.5 tons CO2 offset',
      icon: <NaturePeople />,
      color: theme.palette.success.main
    },
    {
      category: 'Social',
      score: 85,
      change: 3,
      impact: '156 jobs supported',
      icon: <Groups />,
      color: theme.palette.info.main
    },
    {
      category: 'Governance',
      score: 78,
      change: -2,
      impact: '89% board diversity',
      icon: <AccountBalance />,
      color: theme.palette.warning.main
    }
  ];

  // Overall ESG Score calculation
  const overallESGScore = Math.round(
    esgMetrics.reduce((sum, metric) => sum + metric.score, 0) / esgMetrics.length
  );

  // Impact projects data
  const impactProjects: ImpactProject[] = [
    {
      id: '1',
      title: 'Solar Panel Installation in Rural Schools',
      organization: 'Green Energy Foundation',
      category: 'environmental',
      impact: 'Providing clean energy to 50 schools',
      funded: 75000,
      goal: 100000,
      supporters: 234
    },
    {
      id: '2',
      title: 'Women in Tech Training Program',
      organization: 'TechForAll Initiative',
      category: 'social',
      impact: 'Training 500 women in software development',
      funded: 45000,
      goal: 60000,
      supporters: 189
    },
    {
      id: '3',
      title: 'Corporate Transparency Initiative',
      organization: 'Fair Business Alliance',
      category: 'governance',
      impact: 'Promoting ethical business practices',
      funded: 30000,
      goal: 50000,
      supporters: 145
    }
  ];

  // Achievements data
  const achievements: Achievement[] = [
    {
      id: '1',
      title: 'Climate Champion',
      description: 'Offset 1 ton of CO2 emissions',
      icon: <LocalFlorist />,
      date: '2024-05-15',
      rarity: 'rare'
    },
    {
      id: '2',
      title: 'Social Impact Hero',
      description: 'Supported 100 jobs through investments',
      icon: <Groups />,
      date: '2024-04-20',
      rarity: 'epic'
    },
    {
      id: '3',
      title: 'Governance Guardian',
      description: 'Invested in 10 highly transparent companies',
      icon: <Gavel />,
      date: '2024-03-10',
      rarity: 'common'
    }
  ];

  // Environmental breakdown data
  const environmentalBreakdown = {
    labels: ['Renewable Energy', 'Clean Water', 'Waste Reduction', 'Biodiversity', 'Carbon Capture'],
    datasets: [
      {
        label: 'Impact Score',
        data: [85, 78, 92, 71, 88],
        backgroundColor: [
          theme.palette.success.light,
          theme.palette.info.light,
          theme.palette.warning.light,
          theme.palette.error.light,
          theme.palette.primary.light
        ]
      }
    ]
  };

  // ESG trend data
  const esgTrendData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Environmental',
        data: [82, 84, 86, 88, 90, 92],
        borderColor: theme.palette.success.main,
        backgroundColor: theme.palette.success.main + '20',
        tension: 0.4
      },
      {
        label: 'Social',
        data: [78, 80, 82, 83, 84, 85],
        borderColor: theme.palette.info.main,
        backgroundColor: theme.palette.info.main + '20',
        tension: 0.4
      },
      {
        label: 'Governance',
        data: [75, 76, 77, 78, 79, 78],
        borderColor: theme.palette.warning.main,
        backgroundColor: theme.palette.warning.main + '20',
        tension: 0.4
      }
    ]
  };

  // Company ESG comparison
  const companyComparison = {
    labels: ['Environmental', 'Social', 'Governance', 'Transparency', 'Innovation', 'Leadership'],
    datasets: [
      {
        label: 'Your Portfolio',
        data: [92, 85, 78, 88, 82, 90],
        borderColor: theme.palette.primary.main,
        backgroundColor: theme.palette.primary.main + '40',
        pointBackgroundColor: theme.palette.primary.main
      },
      {
        label: 'Market Average',
        data: [75, 72, 80, 70, 75, 78],
        borderColor: theme.palette.grey[500],
        backgroundColor: theme.palette.grey[500] + '20',
        pointBackgroundColor: theme.palette.grey[500]
      }
    ]
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return theme.palette.grey[600];
      case 'rare': return theme.palette.info.main;
      case 'epic': return theme.palette.secondary.main;
      case 'legendary': return theme.palette.warning.main;
      default: return theme.palette.grey[600];
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'environmental': return <Forest />;
      case 'social': return <Groups />;
      case 'governance': return <AccountBalance />;
      default: return <NaturePeople />;
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" fontWeight={600}>
          ESG Impact Dashboard
        </Typography>
        <Box display="flex" gap={2}>
          <Button variant="outlined" startIcon={<Share />}>
            Share Impact
          </Button>
          <Button variant="contained" startIcon={<Download />}>
            Download Report
          </Button>
        </Box>
      </Box>

      {/* Overall ESG Score Card */}
      <Card sx={{ mb: 4, background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)` }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={4}>
              <Box display="flex" alignItems="center" gap={3}>
                <Box position="relative" display="inline-flex">
                  <CircularProgress
                    variant="determinate"
                    value={overallESGScore}
                    size={120}
                    thickness={6}
                    sx={{
                      color: 'white',
                      '& .MuiCircularProgress-circle': {
                        strokeLinecap: 'round'
                      }
                    }}
                  />
                  <Box
                    sx={{
                      top: 0,
                      left: 0,
                      bottom: 0,
                      right: 0,
                      position: 'absolute',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Box textAlign="center">
                      <Typography variant="h2" fontWeight={700} color="white">
                        {overallESGScore}
                      </Typography>
                      <Typography variant="caption" color="white">
                        ESG Score
                      </Typography>
                    </Box>
                  </Box>
                </Box>
                <Box>
                  <Typography variant="h5" color="white" fontWeight={600}>
                    Excellent Impact
                  </Typography>
                  <Typography variant="body2" color="white" sx={{ opacity: 0.9 }}>
                    Top 10% of sustainable investors
                  </Typography>
                  <Rating value={4.5} readOnly size="small" sx={{ mt: 1 }} />
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={8}>
              <Grid container spacing={2}>
                {esgMetrics.map((metric) => (
                  <Grid item xs={12} sm={4} key={metric.category}>
                    <Paper sx={{ p: 2, bgcolor: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)' }}>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <Avatar sx={{ bgcolor: 'white', color: metric.color, width: 32, height: 32 }}>
                          {metric.icon}
                        </Avatar>
                        <Typography variant="subtitle2" color="white">
                          {metric.category}
                        </Typography>
                      </Box>
                      <Typography variant="h4" color="white" fontWeight={600}>
                        {metric.score}
                      </Typography>
                      <Box display="flex" alignItems="center" gap={0.5}>
                        {metric.change >= 0 ? (
                          <TrendingUp sx={{ color: 'white', fontSize: 16 }} />
                        ) : (
                          <TrendingDown sx={{ color: 'white', fontSize: 16 }} />
                        )}
                        <Typography variant="caption" color="white">
                          {metric.change >= 0 ? '+' : ''}{metric.change}% this month
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="white" sx={{ display: 'block', mt: 1, opacity: 0.9 }}>
                        {metric.impact}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs for different views */}
      <Paper sx={{ mb: 4 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="Impact Overview" />
          <Tab label="Environmental" icon={<Forest />} iconPosition="start" />
          <Tab label="Social" icon={<Groups />} iconPosition="start" />
          <Tab label="Governance" icon={<AccountBalance />} iconPosition="start" />
          <Tab label="Achievements" icon={<EmojiEvents />} iconPosition="start" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {tabValue === 0 && (
        <Grid container spacing={3}>
          {/* ESG Trend Chart */}
          <Grid item xs={12} lg={8}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                  <Typography variant="h6">ESG Score Trends</Typography>
                  <ToggleButtonGroup
                    value={timeRange}
                    exclusive
                    onChange={(e, value) => value && setTimeRange(value)}
                    size="small"
                  >
                    <ToggleButton value="1M">1M</ToggleButton>
                    <ToggleButton value="3M">3M</ToggleButton>
                    <ToggleButton value="YTD">YTD</ToggleButton>
                    <ToggleButton value="1Y">1Y</ToggleButton>
                  </ToggleButtonGroup>
                </Box>
                <Box height={300}>
                  <Line
                    data={esgTrendData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom'
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: false,
                          min: 70,
                          max: 100
                        }
                      }
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Impact Summary */}
          <Grid item xs={12} lg={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Your Impact Summary
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <Co2 color="success" />
                    </ListItemIcon>
                    <ListItemText
                      primary="2.5 tons CO2 offset"
                      secondary="Equivalent to planting 125 trees"
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemIcon>
                      <WaterDrop color="info" />
                    </ListItemIcon>
                    <ListItemText
                      primary="50,000 gallons water saved"
                      secondary="Through water-efficient companies"
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemIcon>
                      <Work color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="156 jobs supported"
                      secondary="In underserved communities"
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemIcon>
                      <School color="secondary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="23 students educated"
                      secondary="Through education initiatives"
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Impact Projects */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                  <Typography variant="h6">Featured Impact Projects</Typography>
                  <ToggleButtonGroup
                    value={selectedCategory}
                    exclusive
                    onChange={(e, value) => value && setSelectedCategory(value)}
                    size="small"
                  >
                    <ToggleButton value="all">All</ToggleButton>
                    <ToggleButton value="environmental">Environmental</ToggleButton>
                    <ToggleButton value="social">Social</ToggleButton>
                    <ToggleButton value="governance">Governance</ToggleButton>
                  </ToggleButtonGroup>
                </Box>
                
                <Grid container spacing={3}>
                  {impactProjects
                    .filter(project => selectedCategory === 'all' || project.category === selectedCategory)
                    .map((project) => (
                      <Grid item xs={12} md={4} key={project.id}>
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <Paper variant="outlined" sx={{ p: 3, height: '100%' }}>
                            <Box display="flex" alignItems="center" gap={1} mb={2}>
                              <Avatar sx={{ bgcolor: theme.palette.primary.main + '20', color: theme.palette.primary.main }}>
                                {getCategoryIcon(project.category)}
                              </Avatar>
                              <Box flex={1}>
                                <Typography variant="subtitle1" fontWeight={600}>
                                  {project.title}
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                  by {project.organization}
                                </Typography>
                              </Box>
                            </Box>
                            
                            <Typography variant="body2" color="textSecondary" mb={2}>
                              {project.impact}
                            </Typography>
                            
                            <Box mb={2}>
                              <Box display="flex" justifyContent="space-between" mb={1}>
                                <Typography variant="caption">
                                  ${project.funded.toLocaleString()} raised
                                </Typography>
                                <Typography variant="caption">
                                  {Math.round((project.funded / project.goal) * 100)}%
                                </Typography>
                              </Box>
                              <LinearProgress
                                variant="determinate"
                                value={(project.funded / project.goal) * 100}
                                sx={{
                                  height: 8,
                                  borderRadius: 4,
                                  bgcolor: theme.palette.grey[200],
                                  '& .MuiLinearProgress-bar': {
                                    borderRadius: 4,
                                    bgcolor: theme.palette.primary.main
                                  }
                                }}
                              />
                              <Box display="flex" justifyContent="space-between" mt={1}>
                                <Typography variant="caption" color="textSecondary">
                                  Goal: ${project.goal.toLocaleString()}
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                  {project.supporters} supporters
                                </Typography>
                              </Box>
                            </Box>
                            
                            <Button variant="contained" fullWidth size="small">
                              Support This Project
                            </Button>
                          </Paper>
                        </motion.div>
                      </Grid>
                    ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {tabValue === 1 && (
        <Grid container spacing={3}>
          {/* Environmental Breakdown */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Environmental Impact Breakdown
                </Typography>
                <Box height={300}>
                  <Doughnut
                    data={environmentalBreakdown}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom'
                        }
                      }
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Carbon Footprint */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Carbon Footprint Analysis
                </Typography>
                <Alert severity="success" sx={{ mb: 2 }}>
                  <AlertTitle>Carbon Negative Portfolio!</AlertTitle>
                  Your investments offset more CO2 than they produce.
                </Alert>
                <List>
                  <ListItem>
                    <ListItemText
                      primary="Portfolio Carbon Emissions"
                      secondary="-2.5 tons CO2e/year"
                    />
                    <Chip label="Negative" color="success" />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Renewable Energy Exposure"
                      secondary="45% of portfolio"
                    />
                    <Chip label="High" color="primary" />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Clean Tech Investments"
                      secondary="$3,450 invested"
                    />
                    <Chip label="Growing" color="info" />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {tabValue === 4 && (
        <Grid container spacing={3}>
          {/* Achievements */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Your ESG Achievements
                </Typography>
                <Grid container spacing={2}>
                  {achievements.map((achievement) => (
                    <Grid item xs={12} sm={6} md={4} key={achievement.id}>
                      <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Paper
                          variant="outlined"
                          sx={{
                            p: 3,
                            textAlign: 'center',
                            borderColor: getRarityColor(achievement.rarity),
                            borderWidth: 2,
                            position: 'relative',
                            overflow: 'hidden'
                          }}
                        >
                          <Box
                            sx={{
                              position: 'absolute',
                              top: 0,
                              right: 0,
                              width: 100,
                              height: 100,
                              background: `radial-gradient(circle at top right, ${getRarityColor(achievement.rarity)}20, transparent)`,
                              pointerEvents: 'none'
                            }}
                          />
                          <Avatar
                            sx={{
                              width: 80,
                              height: 80,
                              bgcolor: getRarityColor(achievement.rarity) + '20',
                              color: getRarityColor(achievement.rarity),
                              mx: 'auto',
                              mb: 2
                            }}
                          >
                            {achievement.icon}
                          </Avatar>
                          <Typography variant="h6" fontWeight={600} gutterBottom>
                            {achievement.title}
                          </Typography>
                          <Typography variant="body2" color="textSecondary" mb={2}>
                            {achievement.description}
                          </Typography>
                          <Chip
                            label={achievement.rarity.toUpperCase()}
                            size="small"
                            sx={{
                              bgcolor: getRarityColor(achievement.rarity) + '20',
                              color: getRarityColor(achievement.rarity),
                              fontWeight: 600
                            }}
                          />
                          <Typography variant="caption" display="block" mt={1} color="textSecondary">
                            Earned on {new Date(achievement.date).toLocaleDateString()}
                          </Typography>
                        </Paper>
                      </motion.div>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Progress to Next Achievement */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Next Achievements
                </Typography>
                <Stack spacing={2}>
                  <Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <PublicOutlined color="primary" />
                        <Typography variant="subtitle2">Global Impact Investor</Typography>
                      </Box>
                      <Typography variant="caption" color="textSecondary">
                        85/100 international companies
                      </Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={85} />
                  </Box>
                  <Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Forest color="success" />
                        <Typography variant="subtitle2">Carbon Neutral Champion</Typography>
                      </Box>
                      <Typography variant="caption" color="textSecondary">
                        4.2/5 tons CO2 offset
                      </Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={84} color="success" />
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Portfolio ESG Comparison */}
      <Card sx={{ mt: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Portfolio vs Market ESG Performance
          </Typography>
          <Box height={300}>
            <Radar
              data={companyComparison}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  r: {
                    beginAtZero: true,
                    max: 100
                  }
                },
                plugins: {
                  legend: {
                    position: 'bottom'
                  }
                }
              }}
            />
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ESGImpact;