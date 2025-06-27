import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EquipmentTableProps } from '../../types';
import { RefreshCw, Plus, Edit, Trash } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '@/services/common/api-client';
import { flexRender } from '@tanstack/react-table';

export const EquipmentTable: React.FC<EquipmentTableProps> = ({ 
  equipment,
  columns,
  onRefresh,
  onEdit,
  onDelete
}) => {
  const [isCalculating, setIsCalculating] = useState(false);

  // Handle recalculating energy for all equipment
  const handleRecalculateEnergy = async () => {
    if (!equipment || equipment.length === 0) return;
    
    try {
      setIsCalculating(true);
      const projectId = equipment[0]?.project_id;
      
      if (!projectId) {
        toast.error('Project ID not found for equipment');
        return;
      }
      
      interface CalculationResult {
        success: boolean;
        count?: number;
        message?: string;
      }

      const result = await apiClient.post<CalculationResult>(`equipment/project/${projectId}/calculate-energy`);
      
      if (result.success) {
        toast.success(`Energy calculations updated for ${result.count || 0} items`);
      } else {
        toast.error(result.message || 'Error updating energy calculations');
      }
      
      // Call parent refresh handler if provided
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('Error recalculating energy:', error);
      toast.error('Failed to recalculate energy');
    } finally {
      setIsCalculating(false);
    }
  };

  // If there's no equipment, show a message
  if (!equipment || equipment.length === 0) {
    return <div className="text-center py-8">No equipment found</div>;
  }

  // Calculate total kWh from raw values
  const totalKwh = equipment.reduce((sum, item) => sum + (item.annual_kwh || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">
          Equipment Energy Usage: {totalKwh} kWh
        </h3>
        <div className="flex gap-2">
          <Button 
            onClick={handleRecalculateEnergy} 
            variant="outline" 
            size="sm"
            disabled={isCalculating}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isCalculating ? 'animate-spin' : ''}`} />
            {isCalculating ? 'Calculating...' : 'Recalculate Energy'}
          </Button>
          {onEdit && (
            <Button 
              onClick={() => onEdit(0)}
              variant="default" 
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Equipment
            </Button>
          )}
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.id}>
                {flexRender(column.header, {})}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {equipment.map((item) => (
            <TableRow key={item.id} className="border-0 hover:bg-muted/50">
              {columns.map((column) => (
                <TableCell key={column.id}>
                  {flexRender(column.cell, { row: { original: item } })}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="text-sm text-muted-foreground pt-2">
        <p>* Raw database values shown with no formatting or calculations.</p>
      </div>
    </div>
  );
}; 