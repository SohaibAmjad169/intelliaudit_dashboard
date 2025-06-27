import { Card, CardContent } from '@/components/ui/card';
import { Clock } from 'lucide-react';
import { EquipmentItem } from '../types';
import { getWattageAsNumber } from '@/features/energy/utils/equipment';

export interface StatsCardsProps {
  totalApartmentCount: number;
  actualElectricUsage?: number | undefined;
  equipment: EquipmentItem[];
  isApartmentEquipment: (item: EquipmentItem) => boolean;
  onShowBreakdown: () => void;
}

export const StatsCards: React.FC<StatsCardsProps> = ({
  totalApartmentCount,
  actualElectricUsage,
  equipment,
  isApartmentEquipment,
  onShowBreakdown
}) => {
  // Calculate equipment total using the same logic as EquipmentRow
  const calculateEquipmentTotal = () => {
    if (!equipment || equipment.length === 0) return 0;
    
    const total = equipment.reduce((sum, item) => {
      const isApartment = isApartmentEquipment(item);
      const quantity = item.quantity || 1;
      let itemKwh = 0;
      
      if (item.annual_kwh) {
        itemKwh = item.annual_kwh;
      } else {
        const wattage = getWattageAsNumber(item);
        itemKwh = (wattage * quantity * 40 * 52) / 1000;
      }
      
      // For apartment items, multiply by the number of apartments
      if (isApartment) {
        itemKwh *= totalApartmentCount;
      }
      
      return sum + itemKwh;
    }, 0);
    
    return Math.round(total);
  };

  const equipmentTotal = calculateEquipmentTotal();
  
  // Calculate variance if actual usage is available
  const variance = actualElectricUsage !== undefined ? 
    actualElectricUsage - equipmentTotal : undefined;
  
  const variancePercent = variance !== undefined && equipmentTotal > 0 ? 
    Math.abs(variance) / equipmentTotal * 100 : undefined;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Energy Overview Card */}
      <Card 
        className="bg-green-900/20 border-green-800/30 cursor-pointer hover:bg-green-900/30 transition-all" 
        onClick={onShowBreakdown}
      >
        <CardContent className="p-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Energy Overview</h3>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">
              {equipmentTotal.toLocaleString()} kWh
            </div>
            <div className="text-xs text-muted-foreground">
              Estimated annual electricity usage
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actual Usage Card (if available) */}
      {actualElectricUsage !== undefined && (
        <Card className="bg-blue-900/20 border-blue-800/30">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Actual Usage</h3>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold">
                {actualElectricUsage.toLocaleString()} kWh
              </div>
              <div className="text-xs text-muted-foreground">
                Based on utility bills
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Variance Card (if actual usage is available) */}
      {actualElectricUsage !== undefined && variance !== undefined && variancePercent !== undefined && (
        <Card className={`
          ${variancePercent > 25 ? 'bg-red-900/20 border-red-800/30' : 
            variancePercent > 10 ? 'bg-amber-900/20 border-amber-800/30' : 
            'bg-emerald-900/20 border-emerald-800/30'}
        `}>
          <CardContent className="p-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Variance Analysis</h3>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold">
                {Math.abs(variance).toLocaleString()} kWh
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Variance:</span>
                <div className="text-right">
                  <span className={`font-bold ${
                    variancePercent > 25 ? 'text-red-400' :
                    variancePercent > 10 ? 'text-amber-300' :
                    'text-green-300'
                  }`}>
                    {variance.toLocaleString()} kWh
                  </span>
                  <div className={`text-xs ${
                    variancePercent > 25 ? 'text-red-400' :
                    variancePercent > 10 ? 'text-amber-300' :
                    'text-green-300'
                  }`}>
                    {Math.round(variancePercent)}% ({
                      variancePercent > 25 ? 'High' :
                      variancePercent > 10 ? 'Medium' :
                      'Good'
                    })
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}; 