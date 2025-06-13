import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  RadialLinearScale,
  ScriptableContext
} from 'chart.js';

// Register all required Chart.js components
ChartJS.register(
  ArcElement,        // For Pie and Doughnut charts
  CategoryScale,     // For category axes
  LinearScale,       // For linear axes
  RadialLinearScale, // For Radar and PolarArea charts
  PointElement,      // For line and scatter charts
  LineElement,       // For line charts
  BarElement,        // For bar charts
  Title,            // For chart titles
  Tooltip,          // For tooltips
  Legend,           // For legends
  Filler            // For area charts
);

// Export configured ChartJS
export default ChartJS;