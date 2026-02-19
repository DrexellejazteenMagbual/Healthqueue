import React, { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
  BarElement
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
  BarElement
);

interface ChartProps {
  type: 'line' | 'doughnut' | 'bar';
  data: any;
}

const Chart: React.FC<ChartProps> = ({ type, data }) => {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: 'hsl(215, 15%, 45%)'
        }
      },
      tooltip: {
        backgroundColor: 'hsl(220, 18%, 16%)',
        titleColor: 'hsl(210, 15%, 92%)',
        bodyColor: 'hsl(210, 15%, 92%)',
        borderColor: 'hsl(215, 15%, 24%)',
        borderWidth: 1
      }
    },
    scales: (type === 'line' || type === 'bar') ? {
      x: {
        ticks: {
          color: 'hsl(215, 15%, 45%)'
        },
        grid: {
          color: 'hsl(210, 20%, 88%)'
        }
      },
      y: {
        ticks: {
          color: 'hsl(215, 15%, 45%)'
        },
        grid: {
          color: 'hsl(210, 20%, 88%)'
        }
      }
    } : undefined
  };

  return (
    <div className="h-64">
      {type === 'line' ? (
        <Line data={data} options={options} />
      ) : type === 'bar' ? (
        <Bar data={data} options={options} />
      ) : (
        <Doughnut data={data} options={options} />
      )}
    </div>
  );
};

export default Chart;
