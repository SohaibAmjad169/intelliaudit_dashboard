import React from 'react';
import { Building } from 'lucide-react';

interface Equipment {
  id: string;
  type: string;
  manufacturer?: string;
  model?: string;
  location?: string;
  annual_kwh?: number;
  energy_cost?: number;
}

interface EquipmentInventoryProps {
  equipment: Equipment[];
  equipmentAnalysis: string;
  formatNumber: (value?: number) => string;
  formatCurrency: (value?: number) => string;
}

export const EquipmentInventory: React.FC<EquipmentInventoryProps> = ({
  equipment,
  equipmentAnalysis,
  formatNumber,
  formatCurrency
}) => {
  return (
    <div>
      <h3 className="text-lg font-medium mb-4 flex items-center print:page-break-before">
        <Building className="h-5 w-5 mr-2" />
        Equipment Inventory
      </h3>
      
      <div className="overflow-x-auto mb-6">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-muted/50">
              <th className="text-left p-2 border">Type</th>
              <th className="text-left p-2 border">Manufacturer</th>
              <th className="text-left p-2 border">Model</th>
              <th className="text-left p-2 border">Location</th>
              <th className="text-right p-2 border">Annual kWh</th>
              <th className="text-right p-2 border">Annual Cost</th>
            </tr>
          </thead>
          <tbody>
            {equipment.length > 0 ? (
              equipment.map((item, index) => (
                <tr key={index} className="border-b">
                  <td className="p-2 border">{item.type || 'N/A'}</td>
                  <td className="p-2 border">{item.manufacturer || 'N/A'}</td>
                  <td className="p-2 border">{item.model || 'N/A'}</td>
                  <td className="p-2 border">{item.location || 'N/A'}</td>
                  <td className="text-right p-2 border">{formatNumber(item.annual_kwh)}</td>
                  <td className="text-right p-2 border">{formatCurrency(item.energy_cost)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="p-4 text-center text-muted-foreground">
                  No equipment data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <div className="mb-6">
        <h4 className="font-medium mb-3">Equipment Observations</h4>
        <div className="bg-muted/20 p-4 rounded-md">
          <p>
            {equipmentAnalysis || 
             'The equipment inventory reveals opportunities for efficiency improvements through targeted replacements and maintenance. Several units are operating below optimal efficiency levels.'}
          </p>
        </div>
      </div>
    </div>
  );
};
