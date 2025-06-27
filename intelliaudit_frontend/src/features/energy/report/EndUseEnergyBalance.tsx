import React from 'react';
import { PieChart, Zap, Flame, LineChart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Chart as ChartJS, 
  ArcElement, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend 
} from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface EndUseCategory {
  name: string;
  electricity: number; // kWh
  gas: number; // therms
  cost: number;
  percentOfTotal: number;
  color: string;
}

interface EndUseEnergyBalanceProps {
  endUseData: EndUseCategory[];
  totalEnergy: {
    electricity: number; // kWh
    gas: number; // therms
    cost: number;
  };
  buildingType: string;
  formatNumber: (value?: number) => string;
  formatCurrency: (value?: number) => string;
  formatPercent: (value?: number) => string;
}

export const EndUseEnergyBalance: React.FC<EndUseEnergyBalanceProps> = ({
  endUseData = [],
  totalEnergy = { electricity: 0, gas: 0, cost: 0 },
  buildingType = '',
  formatNumber,
  formatCurrency,
  formatPercent,
}) => {
  // Sort end use data by cost (highest first)
  const sortedData = endUseData && endUseData.length > 0 
    ? [...endUseData].sort((a, b) => b.cost - a.cost)
    : [];
  
  // Prepare data for pie chart (cost distribution)
  const pieChartData = {
    labels: sortedData.map(item => item.name),
    datasets: [
      {
        data: sortedData.map(item => item.cost),
        backgroundColor: sortedData.map(item => item.color),
        borderColor: sortedData.map(item => item.color),
        borderWidth: 1,
      },
    ],
  };
  
  // Prepare data for bar chart (electricity vs gas by end use)
  const barChartData = {
    labels: sortedData.map(item => item.name),
    datasets: [
      {
        label: 'Electricity (kWh)',
        data: sortedData.map(item => item.electricity),
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
      },
      {
        label: 'Natural Gas (therms)',
        data: sortedData.map(item => item.gas),
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      },
    ],
  };
  
  const pieOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right' as const,
        align: 'center' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.raw || 0;
            const percent = ((value / totalEnergy.cost) * 100).toFixed(1);
            return `${label}: ${formatCurrency(value)} (${percent}%)`;
          }
        }
      }
    },
  };
  
  const barOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      x: {
        stacked: false,
      },
      y: {
        stacked: false,
      },
    },
  };
  
  return (
    <div className="print:page-break-after">
      <h3 className="text-xl font-semibold mb-4 flex items-center">
        <PieChart className="h-6 w-6 mr-2" />
        End-Use Energy Balance
      </h3>
      
      <div className="mb-6">
        <p className="text-muted-foreground">
          The end-use energy balance breaks down energy consumption by system type, helping to identify the 
          largest energy consumers in the building. This analysis informs conservation efforts by targeting 
          the systems with the greatest savings potential.
        </p>
      </div>
      
      {(!endUseData || endUseData.length === 0) ? (
        <div className="mb-8 bg-muted/20 border-2 border-dashed border-muted p-8 rounded-md text-center">
          <PieChart className="h-10 w-10 mx-auto mb-4 text-muted" />
          <h4 className="text-lg font-medium mb-2">No End-Use Data Available</h4>
          <p className="text-muted-foreground max-w-md mx-auto">
            End-use energy breakdown data is not available yet. This section will be populated once energy analysis is complete.
          </p>
        </div>
      ) : (
        <>
          {/* Energy Distribution Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Electricity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold flex items-center">
                  <Zap className="h-5 w-5 mr-2 text-blue-500" />
                  {formatNumber(totalEnergy.electricity)} kWh
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Cost: {formatCurrency(totalEnergy.electricity * 0.12)}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Natural Gas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold flex items-center">
                  <Flame className="h-5 w-5 mr-2 text-red-500" />
                  {formatNumber(totalEnergy.gas)} therms
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Cost: {formatCurrency(totalEnergy.gas * 1.2)}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Energy Intensity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold flex items-center">
                  <LineChart className="h-5 w-5 mr-2" />
                  75.2 kBtu/ft²
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  vs. {buildingType} Median: 88.3 kBtu/ft²
                </p>
              </CardContent>
            </Card>
          </div>
          
          {/* Energy Cost Distribution Chart */}
          <div className="mb-8">
            <h4 className="text-lg font-medium mb-4">Energy Cost Distribution</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="h-64">
                    <Pie data={pieChartData} options={pieOptions} />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <h5 className="font-medium mb-3">Top Energy Consumers</h5>
                  <div className="space-y-3">
                    {sortedData.slice(0, 4).map((item, index) => (
                      <div key={index} className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-2" 
                          style={{ backgroundColor: item.color }}
                        ></div>
                        <div className="flex-1">
                          <div className="flex justify-between mb-1">
                            <span className="font-medium">{item.name}</span>
                            <span>{formatCurrency(item.cost)}</span>
                          </div>
                          <div className="w-full bg-muted/50 rounded-full h-2">
                            <div 
                              className="h-2 rounded-full" 
                              style={{ 
                                width: `${item.percentOfTotal}%`,
                                backgroundColor: item.color 
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t">
                    <h6 className="font-medium mb-2">Savings Opportunities</h6>
                    <p className="text-sm text-muted-foreground">
                      Based on this analysis, the greatest energy savings potential lies in 
                      {sortedData[0] && ` ${sortedData[0].name.toLowerCase()}`}
                      {sortedData[1] && ` and ${sortedData[1].name.toLowerCase()}`} systems, 
                      which account for {sortedData[0] && sortedData[1] ? 
                        formatPercent(sortedData[0].percentOfTotal + sortedData[1].percentOfTotal) : 
                        "a significant portion"} of total energy costs.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          
          {/* Electricity vs Gas by End Use */}
          <div className="mb-8">
            <h4 className="text-lg font-medium mb-4">Electricity vs Natural Gas by End Use</h4>
            <Card>
              <CardContent className="pt-6">
                <div className="h-72">
                  <Bar data={barChartData} options={barOptions} />
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Detailed End Use Table */}
          <div className="mb-6">
            <h4 className="text-lg font-medium mb-4">Detailed End Use Breakdown</h4>
            <div className="rounded-md border overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-2 text-left">End Use</th>
                    <th className="px-4 py-2 text-right">Electricity (kWh)</th>
                    <th className="px-4 py-2 text-right">Natural Gas (therms)</th>
                    <th className="px-4 py-2 text-right">Annual Cost</th>
                    <th className="px-4 py-2 text-right">% of Total</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedData.map((item, index) => (
                    <tr key={index} className="border-t">
                      <td className="px-4 py-2 flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-2" 
                          style={{ backgroundColor: item.color }}
                        ></div>
                        {item.name}
                      </td>
                      <td className="px-4 py-2 text-right">{formatNumber(item.electricity)}</td>
                      <td className="px-4 py-2 text-right">{formatNumber(item.gas)}</td>
                      <td className="px-4 py-2 text-right">{formatCurrency(item.cost)}</td>
                      <td className="px-4 py-2 text-right">{formatPercent(item.percentOfTotal)}</td>
                    </tr>
                  ))}
                  <tr className="border-t bg-muted/30 font-medium">
                    <td className="px-4 py-2">TOTAL</td>
                    <td className="px-4 py-2 text-right">{formatNumber(totalEnergy.electricity)}</td>
                    <td className="px-4 py-2 text-right">{formatNumber(totalEnergy.gas)}</td>
                    <td className="px-4 py-2 text-right">{formatCurrency(totalEnergy.cost)}</td>
                    <td className="px-4 py-2 text-right">100%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="bg-muted/30 p-4 rounded-lg mb-4">
            <h5 className="font-medium mb-2">Analysis Methodology</h5>
            <p className="text-sm text-muted-foreground">
              This end-use breakdown was developed using a combination of site observations, equipment 
              inventories, utility bill analysis, and industry standard energy modeling techniques. 
              Actual energy consumption may vary based on operational patterns and weather conditions.
            </p>
          </div>
        </>
      )}
    </div>
  );
}; 