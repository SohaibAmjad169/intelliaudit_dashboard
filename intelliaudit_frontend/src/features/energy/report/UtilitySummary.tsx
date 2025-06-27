import React from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, Title, Tooltip, Legend, PointElement } from 'chart.js';
// These imports are commented out but kept in the file for future implementation
// import { Bar } from 'react-chartjs-2';
// import { Zap, Droplets, TrendingUp, AlertTriangle } from 'lucide-react';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend);

// This interface is exported for use in other components
export interface MonthlyUtilityData {
  month: string;
  electricity: number;
  gas: number;
  water: number;
  cost: number;
  demand?: number;
}

// This interface is exported for potential use in other components
export interface WaterUsageData {
  monthlyUsage: Array<{
    month: string;
    usage: number;
    cost: number;
  }>;
  totalAnnual: number;
  totalCost: number;
  benchmarkComparison?: {
    property: number;
    average: number;
    percentDifference: number;
  };
}

interface UtilitySummaryProps {
  utilityData: any;
  energyStarScore: number;
  waterUsage: any;
  formatNumber: (value?: number) => string;
  formatCurrency: (value?: number) => string;
  showWaterOnly?: boolean;
}

export const UtilitySummary: React.FC<UtilitySummaryProps> = ({
  utilityData,
  energyStarScore,
  waterUsage,
  formatNumber,
  formatCurrency,
  showWaterOnly = false
}) => {
  return (
    <div>
      <h2 className="text-xl font-bold mb-3">Utility Summary</h2>
      
      {!showWaterOnly && (
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">Energy Usage</h3>
          <div className="bg-muted/30 p-4 rounded-md">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Annual Electricity</p>
                <p className="font-medium">{formatNumber(utilityData.annualElectricity || 0)} kWh</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Annual Natural Gas</p>
                <p className="font-medium">{formatNumber(utilityData.annualNaturalGas || 0)} therms</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">ENERGY STAR Score</p>
                <p className="font-medium">{energyStarScore}</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Water Usage</h3>
        <div className="bg-muted/30 p-4 rounded-md">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Annual Water Usage</p>
              <p className="font-medium">{formatNumber(waterUsage.annualUsage || 0)} gallons</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Annual Water Cost</p>
              <p className="font-medium">{formatCurrency(waterUsage.annualCost || 0)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Water Use Intensity</p>
              <p className="font-medium">{formatNumber(waterUsage.wui || 0)} gal/sf</p>
            </div>
          </div>
        </div>
      </div>
      
      <p className="text-sm text-muted-foreground mt-4">
        Note: This utility summary is based on the available utility bill data and may not represent a complete 12-month cycle.
      </p>
    </div>
  );
}; 