import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';

interface UtilityComparisonCardProps {
  estimatedUsage: number;
  actualUsage: number;
  difference: number;
  differencePercentage: number;
}

export const UtilityComparisonCard: React.FC<UtilityComparisonCardProps> = ({
  estimatedUsage,
  actualUsage,
  difference,
  differencePercentage
}) => {
  const isOverestimated = difference < 0;
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center text-lg">
          <Zap className="w-5 h-5 mr-2" />
          Energy Usage Comparison
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-9 gap-4 items-center">
          <div className="md:col-span-3 bg-muted/50 p-4 rounded-md">
            <div className="text-muted-foreground text-sm">Estimated Usage</div>
            <div className="text-2xl font-bold">{estimatedUsage.toLocaleString()} kWh</div>
            <div className="text-xs text-muted-foreground mt-1">From equipment analysis</div>
          </div>
          
          <div className="hidden md:flex md:col-span-1 justify-center">
            <ArrowRight className="w-6 h-6 text-muted-foreground" />
          </div>
          
          <div className="md:col-span-3 bg-muted/50 p-4 rounded-md">
            <div className="text-muted-foreground text-sm">Actual Usage</div>
            <div className="text-2xl font-bold">{actualUsage.toLocaleString()} kWh</div>
            <div className="text-xs text-muted-foreground mt-1">From utility bills</div>
          </div>
          
          <div className="md:col-span-2 bg-muted/50 p-4 rounded-md">
            <div className="text-muted-foreground text-sm">Difference</div>
            <div className={`text-xl font-bold flex items-center ${isOverestimated ? 'text-red-500' : 'text-green-500'}`}>
              {isOverestimated ? <TrendingDown className="w-4 h-4 mr-1" /> : <TrendingUp className="w-4 h-4 mr-1" />}
              {Math.abs(difference).toLocaleString()} kWh
            </div>
            <div className={`text-sm ${isOverestimated ? 'text-red-500' : 'text-green-500'}`}>
              {isOverestimated ? 'Overestimated' : 'Underestimated'} by {Math.abs(differencePercentage).toFixed(1)}%
            </div>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t text-sm text-muted-foreground">
          <div className="flex items-start">
            <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 mr-2"></div>
            <p>
              {isOverestimated 
                ? 'Your estimated energy usage is lower than actual utility bills. Some equipment may be missing or operating hours might need adjustment.'
                : 'Your estimated energy usage is higher than actual utility bills. Consider scaling back some equipment operating hours or adjusting occupancy assumptions.'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 