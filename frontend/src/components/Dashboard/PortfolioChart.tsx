import React, { useMemo } from 'react';
import { Box, useTheme, Skeleton } from '@mui/material';
import { Line } from 'react-chartjs-2';
import '@utils/chartConfig'; // Import centralized Chart.js configuration
import { usePortfolioPerformance } from '@/hooks/api';

interface PortfolioChartProps {
  timeRange: string;
}

const PortfolioChart: React.FC<PortfolioChartProps> = ({ timeRange }) => {
  const theme = useTheme();
  const { data: performance, isLoading } = usePortfolioPerformance(timeRange);

  // Process performance data for chart
  const chartDataAndLabels = useMemo(() => {
    if (!performance?.history || performance.history.length === 0) {
      // Return empty data if no performance data
      return { labels: [], data: [] };
    }

    const labels = performance.history.map((point: any) => {
      const date = new Date(point.date);
      if (timeRange === '1D') {
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      } else if (timeRange === '1W') {
        return date.toLocaleDateString('en-US', { weekday: 'short' });
      } else if (timeRange === '1M') {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
    });

    const data = performance.history.map((point: any) => point.value);

    return { labels, data };
  }, [performance, timeRange]);

  const chartData = {
    labels: chartDataAndLabels.labels,
    datasets: [
      {
        label: 'Portfolio Value',
        data: chartDataAndLabels.data,
        fill: true,
        borderColor: theme.palette.primary.main,
        backgroundColor: theme.palette.primary.main + '20',
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: theme.palette.primary.main,
        pointHoverBorderColor: theme.palette.background.paper,
        pointHoverBorderWidth: 2
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: theme.palette.background.paper,
        titleColor: theme.palette.text.primary,
        bodyColor: theme.palette.text.secondary,
        borderColor: theme.palette.divider,
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        callbacks: {
          label: (context: any) => {
            return `$${context.parsed.y.toFixed(2)}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: theme.palette.text.secondary
        }
      },
      y: {
        grid: {
          color: theme.palette.divider
        },
        ticks: {
          color: theme.palette.text.secondary,
          callback: (value: any) => `$${value.toLocaleString()}`
        }
      }
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ height: 400, position: 'relative' }}>
        <Skeleton variant="rectangular" width="100%" height={400} />
      </Box>
    );
  }

  return (
    <Box sx={{ height: 400, position: 'relative' }}>
      <Line data={chartData} options={options} />
    </Box>
  );
};

export default PortfolioChart;