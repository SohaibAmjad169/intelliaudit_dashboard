import React from 'react';
import { EndUseBreakdown } from '@/services/energy-analysis';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

interface BaselineEndUseComparisonProps {
  data: EndUseBreakdown | null;
  height?: number;
  width?: number;
  className?: string;
}

// Sample baseline data (replace with actual data source later)
const sampleBaseline = {
  heating: 30,
  cooling: 25,
  ventilation: 10,
  lighting: 20,
  equipment: 10,
  other: 5,
};

export const BaselineEndUseComparison: React.FC<BaselineEndUseComparisonProps> = ({
  data,
  height = 250,
  width = 300,
  className = '',
}) => {
  const chartRef = React.useRef<HTMLCanvasElement>(null);
  const chartInstance = React.useRef<Chart | null>(null);

  // Colors for different end uses
  const colors = [
    '#4cd964', '#5ac8fa', '#007aff', '#ff2d55', '#ff9500',
  ];

  React.useEffect(() => {
    // Check for data and necessary properties before processing
    if (!chartRef.current || !data) return;

    // Extract current breakdown directly from data properties
    const currentBreakdown = {
      heating: data.heating,
      cooling: data.cooling,
      ventilation: data.ventilation,
      lighting: data.lighting,
      equipment: data.equipment,
      other: data.other,
    };

    // Filter out zero values and get top 5 end uses
    const currentData = Object.entries(currentBreakdown)
      .filter(([_, value]) => value > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Map baseline data using the sample baseline
    const baselineData = currentData.map(([key]) => 
      sampleBaseline[key as keyof typeof sampleBaseline] || 0
    );

    const labels = currentData.map(([key]) => 
      key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
    );
    
    const currentValues = currentData.map(([_, value]) => value);
    
    // Destroy previous chart instance if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    // Create chart
    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    chartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Current',
            data: currentValues,
            backgroundColor: colors.map(color => `${color}dd`),
            borderColor: colors,
            borderWidth: 1,
          },
          {
            label: 'Baseline',
            data: baselineData,
            backgroundColor: colors.map(color => `${color}55`),
            borderColor: colors,
            borderWidth: 1,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: {
          legend: {
            position: 'top',
            labels: {
              color: '#ffffff',
              font: {
                size: 11
              }
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const value = context.raw as number;
                const datasetLabel = context.dataset.label || '';
                return `${datasetLabel}: ${value}%`;
              }
            }
          }
        },
        scales: {
          x: {
            ticks: {
              color: '#ffffff99',
              callback: (value) => `${value}%`
            },
            grid: {
              color: '#ffffff22'
            }
          },
          y: {
            ticks: {
              color: '#ffffff99'
            },
            grid: {
              color: '#ffffff22'
            }
          }
        }
      }
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data]);

  if (!data) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        End-use breakdown data unavailable.
      </div>
    );
  }

  return (
    <div className={`${className}`} style={{ height, width }}>
      <canvas ref={chartRef} />
    </div>
  );
}; 