import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Slider,
  Switch,
  FormControlLabel,
  Chip,
  Divider,
  Avatar
} from '@mui/material';
import { motion } from 'framer-motion';
import {
  NaturePeople,
  Groups,
  AccountBalance,
  LocalFlorist,
  WaterDrop,
  Factory
} from '@mui/icons-material';
import { RootState, AppDispatch } from '@/store';
import { updateData } from '@/store/slices/onboardingSlice';

interface ESGCategory {
  id: 'environmental' | 'social' | 'governance';
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  examples: string[];
  image: string;
}

const categories: ESGCategory[] = [
  {
    id: 'environmental',
    title: 'Environmental',
    description: 'Companies fighting climate change and protecting our planet',
    icon: <NaturePeople />,
    color: '#4CAF50',
    examples: ['Carbon reduction', 'Renewable energy', 'Sustainable practices'],
    image: '/esg/environmental.jpg'
  },
  {
    id: 'social',
    title: 'Social',
    description: 'Organizations promoting equality and community wellbeing',
    icon: <Groups />,
    color: '#2196F3',
    examples: ['Fair wages', 'Diversity & inclusion', 'Community support'],
    image: '/esg/social.jpg'
  },
  {
    id: 'governance',
    title: 'Governance',
    description: 'Businesses with ethical leadership and transparency',
    icon: <AccountBalance />,
    color: '#FF9800',
    examples: ['Board diversity', 'Anti-corruption', 'Shareholder rights'],
    image: '/esg/governance.jpg'
  }
];

const excludableSectors = [
  { id: 'tobacco', label: 'Tobacco', icon: '🚬' },
  { id: 'weapons', label: 'Weapons', icon: '🔫' },
  { id: 'gambling', label: 'Gambling', icon: '🎰' },
  { id: 'fossil_fuels', label: 'Fossil Fuels', icon: '⛽' },
  { id: 'alcohol', label: 'Alcohol', icon: '🍺' }
];

const ESGPreferencesStep: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { data } = useSelector((state: RootState) => state.onboarding);
  const [preferences, setPreferences] = useState(data.esgPreferences);
  const [excludedSectors, setExcludedSectors] = useState<string[]>([]);
  const [impactLevel, setImpactLevel] = useState(70);

  const handleCategoryToggle = (category: 'environmental' | 'social' | 'governance') => {
    const newPreferences = {
      ...preferences,
      [category]: !preferences[category]
    };
    setPreferences(newPreferences);
    dispatch(updateData({ esgPreferences: newPreferences }));
  };

  const handleSectorToggle = (sectorId: string) => {
    const newExcluded = excludedSectors.includes(sectorId)
      ? excludedSectors.filter(id => id !== sectorId)
      : [...excludedSectors, sectorId];
    setExcludedSectors(newExcluded);
  };

  const handleImpactLevelChange = (_: Event, value: number | number[]) => {
    setImpactLevel(value as number);
  };

  const getImpactLabel = (value: number) => {
    if (value < 30) return 'Low Impact';
    if (value < 70) return 'Balanced';
    return 'High Impact';
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom fontWeight={600} textAlign="center">
        Invest with Purpose
      </Typography>
      <Typography variant="body1" color="textSecondary" textAlign="center" sx={{ mb: 4 }}>
        Choose the causes that matter most to you. Your investments will support these values.
      </Typography>

      {/* ESG Categories */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {categories.map((category, index) => (
          <Grid item xs={12} md={4} key={category.id}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card
                sx={{
                  height: '100%',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.3s',
                  border: preferences[category.id] ? 3 : 1,
                  borderColor: preferences[category.id] ? category.color : 'divider',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4
                  }
                }}
                onClick={() => handleCategoryToggle(category.id)}
              >
                {preferences[category.id] && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 16,
                      right: 16,
                      bgcolor: category.color,
                      color: 'white',
                      borderRadius: '50%',
                      width: 32,
                      height: 32,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 1
                    }}
                  >
                    ✓
                  </Box>
                )}
                <CardMedia
                  component="div"
                  sx={{
                    height: 140,
                    background: `linear-gradient(135deg, ${category.color}40 0%, ${category.color}80 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Avatar sx={{ width: 64, height: 64, bgcolor: 'white', color: category.color }}>
                    {category.icon}
                  </Avatar>
                </CardMedia>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {category.title}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                    {category.description}
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {category.examples.map((example, i) => (
                      <Chip
                        key={i}
                        label={example}
                        size="small"
                        sx={{
                          bgcolor: preferences[category.id] ? `${category.color}20` : 'grey.200',
                          fontSize: '0.75rem'
                        }}
                      />
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      <Divider sx={{ my: 4 }} />

      {/* Impact Level Slider */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          ESG Impact Level
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
          How much weight should ESG factors have in your portfolio?
        </Typography>
        <Box sx={{ px: 2 }}>
          <Slider
            value={impactLevel}
            onChange={handleImpactLevelChange}
            valueLabelDisplay="on"
            valueLabelFormat={(value) => `${value}%`}
            marks={[
              { value: 0, label: 'Returns First' },
              { value: 50, label: 'Balanced' },
              { value: 100, label: 'Impact First' }
            ]}
            sx={{
              '& .MuiSlider-valueLabel': {
                backgroundColor: 'primary.main'
              }
            }}
          />
          <Typography variant="subtitle2" textAlign="center" color="primary">
            {getImpactLabel(impactLevel)}
          </Typography>
        </Box>
      </Box>

      {/* Excluded Sectors */}
      <Box>
        <Typography variant="h6" gutterBottom>
          Exclude Specific Sectors (Optional)
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
          Select industries you don't want to invest in
        </Typography>
        <Grid container spacing={2}>
          {excludableSectors.map((sector) => (
            <Grid item xs={6} sm={4} key={sector.id}>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Card
                  sx={{
                    p: 2,
                    cursor: 'pointer',
                    textAlign: 'center',
                    bgcolor: excludedSectors.includes(sector.id) ? 'error.light' : 'grey.100',
                    color: excludedSectors.includes(sector.id) ? 'white' : 'text.primary',
                    transition: 'all 0.2s'
                  }}
                  onClick={() => handleSectorToggle(sector.id)}
                >
                  <Typography variant="h4" sx={{ mb: 1 }}>
                    {sector.icon}
                  </Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {sector.label}
                  </Typography>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
};

export default ESGPreferencesStep;