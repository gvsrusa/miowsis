import React from 'react';
import { Box, useTheme } from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface PortfolioChartProps {
  timeRange: string;
}

const PortfolioChart: React.FC<PortfolioChartProps> = ({ timeRange }) => {
  const theme = useTheme();

  // Generate mock data based on time range
  const generateData = () => {
    const dataPoints = timeRange === '1D' ? 24 : timeRange === '1W' ? 7 : 30;
    const labels = Array.from({ length: dataPoints }, (_, i) => {
      if (timeRange === '1D') return `${i}:00`;
      if (timeRange === '1W') return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i];
      return `Day ${i + 1}`;
    });

    const baseValue = 10000;
    const data = Array.from({ length: dataPoints }, (_, i) => {
      const randomChange = (Math.random() - 0.3) * 200;
      return baseValue + (i * 50) + randomChange;
    });

    return { labels, data };
  };

  const { labels, data } = generateData();

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Portfolio Value',
        data,
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

  return (
    <Box sx={{ height: 400, position: 'relative' }}>
      <Line data={chartData} options={options} />
    </Box>
  );
};

export default PortfolioChart;