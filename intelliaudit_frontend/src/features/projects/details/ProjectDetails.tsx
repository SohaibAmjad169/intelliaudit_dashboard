import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Project } from '../../../types/project';
import { Card } from '@/components/ui/card';
import axiosInstance from '@/services/common/axios-config';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Thermometer, Snowflake } from 'lucide-react';
import { safelyAccessArray, safelyAccessProperty } from '@/utils/response-helpers';

interface ProjectDetailsProps {
  project: Project;
}

// Month names for the X-axis
const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export const ProjectDetails: React.FC<ProjectDetailsProps> = ({ project }) => {
  const navigate = useNavigate();
  const [weatherData, setWeatherData] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'hdd' | 'cdd'>('hdd');
  const [isLoading, setIsLoading] = useState(false);

  // Fetch weather data when component mounts
  useEffect(() => {
    if (!project.id) return;

    const fetchWeatherData = async () => {
      setIsLoading(true);
      try {
        const response = await axiosInstance.get(`/api/weather/project?projectId=${project.id}`);
        const weatherDataArray = safelyAccessArray<any>(safelyAccessProperty(response, 'data', []));
        setWeatherData(weatherDataArray);
        console.log('Weather data loaded:', weatherDataArray);
      } catch (error) {
        console.error('Failed to load weather data:', error);
        setWeatherData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWeatherData();
  }, [project.id]);

  const handleViewReport = () => {
    navigate(`/projects/${project.id}/report`);
  };

  // Prepare chart data
  const prepareChartData = () => {
    if (!weatherData.length || !weatherData[0]?.monthly_data) return [];
    
    const monthlyData = weatherData[0].monthly_data.sort((a: any, b: any) => a.month - b.month);
    
    return monthlyData.map((item: any) => {
      const dataObj: any = {
        name: MONTH_NAMES[item.month - 1],
        month: item.month,
      };

      if (activeTab === 'hdd') {
        dataObj.baseYear = item.base_year_hdd;
        dataObj.comparisonYear = item.comparison_year_hdd;
        dataObj.delta = item.hdd_delta;
      } else {
        dataObj.baseYear = item.base_year_cdd;
        dataObj.comparisonYear = item.comparison_year_cdd;
        dataObj.delta = item.cdd_delta;
      }

      return dataObj;
    });
  };

  const chartData = prepareChartData();
  const currentYear = weatherData[0]?.monthly_data?.[0]?.base_year || new Date().getFullYear();
  const previousYear = weatherData[0]?.monthly_data?.[0]?.comparison_year || (currentYear - 1);

  // Weather chart help text
  const getHelpText = () => {
    if (activeTab === 'hdd') {
      return 'Heating Degree Days (HDD) - Higher values indicate greater heating needs.';
    }
    return 'Cooling Degree Days (CDD) - Higher values indicate greater cooling needs.';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{project.name}</h2>
        <button
          onClick={handleViewReport}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          View Energy Audit Report
        </button>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="text-lg font-semibold">Building Address</h3>
          <p>{project.building_address}</p>
        </div>
        <div>
          <h3 className="text-lg font-semibold">Description</h3>
          <p>{project.description || 'No description provided'}</p>
        </div>
      </div>
      
      {/* Monthly Energy Tracking Section */}
      <div className="relative rounded-xl transition-all duration-300 border border-emerald-500/0 p-4 md:p-6 bg-card mb-6">
        <div className="flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 md:mb-6 gap-3">
            <h3 className="text-xl font-semibold">Monthly Energy Tracking</h3>
            {/* Your existing tabs for Usage/Cost here */}
          </div>
          
          <div className="w-full h-[300px] md:h-[400px]">
            {/* Your existing energy tracking chart here */}
          </div>
          
          <div className="text-sm text-muted-foreground mt-4 text-center">
            Monthly usage tracking for electric (kWh) and natural gas (kWh equivalent) energy
          </div>
        </div>
      </div>
      
      {/* Weather Data Section */}
      <Card className="p-4 md:p-6">
        <div className="flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-blue-500/10 mr-3">
                {activeTab === 'hdd' ? 
                  <Thermometer className="w-4 h-4 text-blue-500" /> : 
                  <Snowflake className="w-4 h-4 text-blue-500" />
                }
              </div>
              <div>
                <h3 className="text-lg font-semibold">Weather Comparison</h3>
                <p className="text-xs text-muted-foreground">
                  ZIP Code: {(project as any).property_postal_code || weatherData[0]?.zip_code || 'Unknown'}
                </p>
              </div>
            </div>
            
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'hdd' | 'cdd')} className="w-auto">
              <TabsList>
                <TabsTrigger value="hdd">
                  <Thermometer className="w-4 h-4 mr-2" />
                  HDD
                </TabsTrigger>
                <TabsTrigger value="cdd">
                  <Snowflake className="w-4 h-4 mr-2" />
                  CDD
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          {isLoading ? (
            <div className="flex items-center justify-center h-[240px] md:h-[300px]">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500 mb-4"></div>
                <p className="text-muted-foreground">Loading weather data...</p>
              </div>
            </div>
          ) : !weatherData.length || !weatherData[0]?.monthly_data ? (
            <div className="flex items-center justify-center h-[240px] md:h-[300px]">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">No Weather Data Available</h3>
                <p className="text-muted-foreground">
                  Weather data isn't available for this project.
                </p>
              </div>
            </div>
          ) : (
            <div className="w-full h-[240px] md:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis 
                    dataKey="name" 
                    fontSize={12}
                    tick={{ fill: '#888888' }}
                  />
                  <YAxis 
                    fontSize={12}
                    tick={{ fill: '#888888' }}
                  />
                  <Tooltip 
                    formatter={(value: any) => [value, activeTab.toUpperCase()]}
                    labelFormatter={(label) => `${label}`}
                  />
                  <Legend />
                  <Bar 
                    name={`${currentYear}`} 
                    dataKey="baseYear" 
                    fill="#10b981" 
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    name={`${previousYear}`} 
                    dataKey="comparisonYear" 
                    fill="#3b82f6" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          
          <div className="text-xs text-muted-foreground mt-3 text-center">
            {getHelpText()}
          </div>
        </div>
      </Card>
    </div>
  );
};
