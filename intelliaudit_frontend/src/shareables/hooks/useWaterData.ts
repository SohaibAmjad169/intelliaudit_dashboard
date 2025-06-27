import { useState, useEffect } from 'react';
import { fetchTotalUtilityCost, fetchTotalUtilityUsage, fetchMonthlyUtilityData } from '@/services/energy-analysis';
import axiosInstance from '@/services/common/axios-config';

export function useWaterData(projectId: string | undefined) {
  const [waterData, setWaterData] = useState({
    waterUsage: 0,
    waterCost: 0,
    waterUseIntensity: '--',
    buildingArea: 0,
    isLoading: true,
    error: null as string | null,
  });

  useEffect(() => {
    async function loadWaterData() {
      if (!projectId) return;
      
      try {
        setWaterData(prev => ({ ...prev, isLoading: true, error: null }));
        
        const [costData, usageData, projectResponse, monthlyWaterData] = await Promise.all([
          fetchTotalUtilityCost(projectId),
          fetchTotalUtilityUsage(projectId),
          axiosInstance.get(`/api/projects/${projectId}`),
          fetchMonthlyUtilityData(projectId, 'water')
        ]);
        
        // Get the project data
        const projectData = projectResponse.data || {};
        const buildingArea = projectData.property_gross_floor_area || 0;
        
        // Check for water data in costByType and usageByType
        let waterCost = 0;
        let waterUsage = 0;
        
        // Try to get water cost from costByType
        if (costData.costByType) {
          // First try the specific water meter type
          if (costData.costByType['Municipally Supplied Potable Water - Mixed Indoor/Outdoor']?.total) {
            waterCost = Number(costData.costByType['Municipally Supplied Potable Water - Mixed Indoor/Outdoor'].total);
          } 
          // Then try the generic 'Water' type
          else if (costData.costByType['Water']?.total) {
            waterCost = Number(costData.costByType['Water'].total);
          }
        }
        
        // Use the waterCost from the top-level property if we couldn't get it from costByType
        if (waterCost === 0 && costData.waterCost) {
          waterCost = Number(costData.waterCost);
        }
        
        // Try to get water usage from usageByType
        if (usageData.usageByType) {
          // First try the specific water meter type
          if (usageData.usageByType['Municipally Supplied Potable Water - Mixed Indoor/Outdoor']?.total) {
            waterUsage = Number(usageData.usageByType['Municipally Supplied Potable Water - Mixed Indoor/Outdoor'].total);
          } 
          // Then try the generic 'Water' type
          else if (usageData.usageByType['Water']?.total) {
            waterUsage = Number(usageData.usageByType['Water'].total);
          }
        }
        
        // Use the waterUsage from the top-level property if we couldn't get it from usageByType
        if (waterUsage === 0 && usageData.waterUsage) {
          waterUsage = Number(usageData.waterUsage);
        }
        
        // As a fallback, calculate totals from the monthly data
        if (waterUsage === 0 || waterCost === 0) {
          const totalMonthlyUsage = monthlyWaterData.reduce((sum: number, month: any) => sum + Number(month.usage || 0), 0);
          const totalMonthlyCost = monthlyWaterData.reduce((sum: number, month: any) => sum + Number(month.cost || 0), 0);
          
          if (waterUsage === 0 && totalMonthlyUsage > 0) {
            waterUsage = totalMonthlyUsage;
          }
          
          if (waterCost === 0 && totalMonthlyCost > 0) {
            waterCost = totalMonthlyCost;
          }
        }
        
        // Calculate water use intensity
        const waterUseIntensity = (buildingArea && waterUsage) 
          ? (waterUsage / buildingArea).toFixed(4)
          : '--';
        
        setWaterData({
          waterUsage,
          waterCost,
          waterUseIntensity,
          buildingArea,
          isLoading: false,
          error: null,
        });
        
      } catch (error) {
        console.error('Failed to load water data:', error);
        setWaterData(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to fetch water data'
        }));
      }
    }
    
    loadWaterData();
  }, [projectId]);

  return waterData;
} 