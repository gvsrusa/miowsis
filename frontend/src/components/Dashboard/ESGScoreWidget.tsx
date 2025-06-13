import React from 'react';
import { Box, Typography, LinearProgress, Chip, useTheme } from '@mui/material';
import { NaturePeople, Groups, AccountBalance } from '@mui/icons-material';

interface ESGCategory {
  name: string;
  score: number;
  icon: React.ReactNode;
  color: string;
  description: string;
}

const ESGScoreWidget: React.FC = () => {
  const theme = useTheme();

  const categories: ESGCategory[] = [
    {
      name: 'Environmental',
      score: 92,
      icon: <NaturePeople />,
      color: theme.palette.success.main,
      description: 'Carbon footprint, renewable energy usage'
    },
    {
      name: 'Social',
      score: 85,
      icon: <Groups />,
      color: theme.palette.info.main,
      description: 'Employee welfare, community impact'
    },
    {
      name: 'Governance',
      score: 78,
      icon: <AccountBalance />,
      color: theme.palette.warning.main,
      description: 'Board diversity, ethical practices'
    }
  ];

  const overallScore = Math.round(
    categories.reduce((sum, cat) => sum + cat.score, 0) / categories.length
  );

  return (
    <Box>
      {/* Overall Score */}
      <Box textAlign="center" mb={4}>
        <Box
          sx={{
            width: 120,
            height: 120,
            borderRadius: '50%',
            background: `conic-gradient(${theme.palette.primary.main} ${overallScore * 3.6}deg, ${theme.palette.grey[200]} 0deg)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto',
            position: 'relative'
          }}
        >
          <Box
            sx={{
              width: 100,
              height: 100,
              borderRadius: '50%',
              backgroundColor: theme.palette.background.paper,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column'
            }}
          >
            <Typography variant="h4" fontWeight={600}>
              {overallScore}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              out of 100
            </Typography>
          </Box>
        </Box>
        <Typography variant="body2" color="textSecondary" mt={2}>
          Your portfolio has excellent ESG credentials
        </Typography>
      </Box>

      {/* Category Breakdown */}
      <Box>
        {categories.map((category, index) => (
          <Box key={index} mb={3}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
              <Box display="flex" alignItems="center" gap={1}>
                <Box
                  sx={{
                    backgroundColor: category.color + '20',
                    borderRadius: 1,
                    p: 0.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {React.cloneElement(category.icon as React.ReactElement, {
                    sx: { color: category.color, fontSize: 20 }
                  })}
                </Box>
                <Typography variant="body2" fontWeight={500}>
                  {category.name}
                </Typography>
              </Box>
              <Chip
                label={`${category.score}/100`}
                size="small"
                sx={{ bgcolor: category.color + '20', color: category.color }}
              />
            </Box>
            <LinearProgress
              variant="determinate"
              value={category.score}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: theme.palette.grey[200],
                '& .MuiLinearProgress-bar': {
                  backgroundColor: category.color,
                  borderRadius: 4
                }
              }}
            />
            <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5 }}>
              {category.description}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default ESGScoreWidget;