import React, { useMemo } from 'react';
import { Box, Typography, LinearProgress, Chip, useTheme, Skeleton } from '@mui/material';
import { NaturePeople, Groups, AccountBalance } from '@mui/icons-material';
import { usePortfolioESG } from '@/hooks/api';

interface ESGCategory {
  name: string;
  score: number;
  icon: React.ReactNode;
  color: string;
  description: string;
}

const ESGScoreWidget: React.FC = () => {
  const theme = useTheme();
  const { data: esgData, isLoading } = usePortfolioESG();

  const categories: ESGCategory[] = useMemo(() => {
    if (!esgData) {
      return [
        {
          name: 'Environmental',
          score: 0,
          icon: <NaturePeople />,
          color: theme.palette.success.main,
          description: 'Loading...'
        },
        {
          name: 'Social',
          score: 0,
          icon: <Groups />,
          color: theme.palette.info.main,
          description: 'Loading...'
        },
        {
          name: 'Governance',
          score: 0,
          icon: <AccountBalance />,
          color: theme.palette.warning.main,
          description: 'Loading...'
        }
      ];
    }

    return [
      {
        name: 'Environmental',
        score: Math.round(esgData.environmentalScore || 0),
        icon: <NaturePeople />,
        color: theme.palette.success.main,
        description: esgData.environmentalDetails || 'Carbon footprint, renewable energy usage'
      },
      {
        name: 'Social',
        score: Math.round(esgData.socialScore || 0),
        icon: <Groups />,
        color: theme.palette.info.main,
        description: esgData.socialDetails || 'Employee welfare, community impact'
      },
      {
        name: 'Governance',
        score: Math.round(esgData.governanceScore || 0),
        icon: <AccountBalance />,
        color: theme.palette.warning.main,
        description: esgData.governanceDetails || 'Board diversity, ethical practices'
      }
    ];
  }, [esgData, theme]);

  const overallScore = useMemo(() => {
    if (!esgData) return 0;
    return Math.round(esgData.totalScore || 0);
  }, [esgData]);

  const getScoreDescription = (score: number) => {
    if (score >= 90) return 'Excellent ESG credentials';
    if (score >= 70) return 'Good ESG performance';
    if (score >= 50) return 'Moderate ESG rating';
    return 'ESG improvement needed';
  };

  if (isLoading) {
    return (
      <Box>
        <Box textAlign="center" mb={4}>
          <Skeleton variant="circular" width={120} height={120} sx={{ margin: '0 auto' }} />
          <Skeleton variant="text" width={200} sx={{ margin: '16px auto' }} />
        </Box>
        <Box>
          {[1, 2, 3].map((i) => (
            <Box key={i} mb={3}>
              <Skeleton variant="text" width="100%" height={30} />
              <Skeleton variant="rectangular" width="100%" height={8} sx={{ borderRadius: 4, mt: 1 }} />
              <Skeleton variant="text" width="60%" height={20} />
            </Box>
          ))}
        </Box>
      </Box>
    );
  }

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
          {getScoreDescription(overallScore)}
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

      {/* ESG Insights */}
      {esgData?.insights && esgData.insights.length > 0 && (
        <Box mt={3} p={2} bgcolor={theme.palette.grey[50]} borderRadius={2}>
          <Typography variant="body2" fontWeight={500} mb={1}>
            ESG Insights
          </Typography>
          {esgData.insights.map((insight: string, index: number) => (
            <Typography key={index} variant="caption" color="textSecondary" display="block" mb={0.5}>
              • {insight}
            </Typography>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default ESGScoreWidget;