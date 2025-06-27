import React, { useState, useEffect } from 'react';
import { fetchMonthlyUtilityData } from '@/services/energy-analysis';
import { MonthlyEnergyChart } from './MonthlyEnergyChart';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Box } from '@/components/ui/box';
import { DollarSign, Activity } from 'lucide-react';

interface MonthlyEnergyChartContainerProps {
  projectId: string;
  className?: string;
}

export const MonthlyEnergyChartContainer: React.FC<MonthlyEnergyChartContainerProps> = ({
  projectId,
  className = '',
}) => {
  const [electricData, setElectricData] = useState<any[]>([]);
  const [naturalGasData, setNaturalGasData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCost, setShowCost] = useState(false);
  const [activeTab, setActiveTab] = useState('usage');

  useEffect(() => {
    async function loadData() {
      if (!projectId) return;
      
      try {
        setIsLoading(true);
        
        // Fetch both electric and natural gas data
        const [electric, naturalGas] = await Promise.all([
          fetchMonthlyUtilityData(projectId, 'electric'),
          fetchMonthlyUtilityData(projectId, 'natural-gas')
        ]);
        
        // Ensure we have valid data arrays
        setElectricData(Array.isArray(electric) ? electric : []);
        setNaturalGasData(Array.isArray(naturalGas) ? naturalGas : []);
      } catch (error) {
        console.error('Failed to load monthly energy data:', error);
        setElectricData([]);
        setNaturalGasData([]);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadData();
  }, [projectId]);

  if (isLoading) {
    return (
      <Box intensity="subtle" className="flex items-center justify-center h-[400px] w-full bg-card">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mb-4"></div>
          <p className="text-muted-foreground">Loading energy data...</p>
        </div>
      </Box>
    );
  }

  if (!electricData.length && !naturalGasData.length) {
    return (
      <Box intensity="subtle" className="flex items-center justify-center h-[400px] w-full bg-card">
        <div className="text-center">
          <h3 className="text-xl font-semibold mb-2">No Energy Data Available</h3>
          <p className="text-muted-foreground">There is no monthly energy data available for this project.</p>
        </div>
      </Box>
    );
  }

  return (
    <Box intensity="subtle" className={`p-4 md:p-6 bg-card ${className}`}>
      <div className="flex flex-col">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 md:mb-6 gap-3">
          <h3 className="text-xl font-semibold">Monthly Energy Tracking</h3>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
            <TabsList>
              <TabsTrigger value="usage" onClick={() => setShowCost(false)}>
                <Activity className="w-4 h-4 mr-2" />
                Usage
              </TabsTrigger>
              <TabsTrigger value="cost" onClick={() => setShowCost(true)}>
                <DollarSign className="w-4 h-4 mr-2" />
                Cost
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        <div className="w-full h-[300px] md:h-[400px]">
          <MonthlyEnergyChart 
            electricData={electricData}
            naturalGasData={naturalGasData}
            showCost={showCost}
            height="100%"
            className="w-full"
          />
        </div>
        
        <div className="text-sm text-muted-foreground mt-4 text-center">
          {showCost 
            ? "Monthly cost breakdown for electric and natural gas energy sources" 
            : "Monthly usage tracking for electric (kWh) and natural gas (kWh equivalent) energy"}
        </div>
      </div>
    </Box>
  );
}; 