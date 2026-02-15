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
          color: 'hsl(240, 3.8%, 46.1%)'
        }
      },
      tooltip: {
        backgroundColor: 'hsl(240, 10%, 3.9%)',
        titleColor: 'hsl(0, 0%, 98%)',
        bodyColor: 'hsl(0, 0%, 98%)',
        borderColor: 'hsl(240, 3.7%, 15.9%)',
        borderWidth: 1
      }
    },
    scales: (type === 'line' || type === 'bar') ? {
      x: {
        ticks: {
          color: 'hsl(240, 3.8%, 46.1%)'
        },
        grid: {
          color: 'hsl(240, 5.9%, 90%)'
        }
      },
      y: {
        ticks: {
          color: 'hsl(240, 3.8%, 46.1%)'
        },
        grid: {
          color: 'hsl(240, 5.9%, 90%)'
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
