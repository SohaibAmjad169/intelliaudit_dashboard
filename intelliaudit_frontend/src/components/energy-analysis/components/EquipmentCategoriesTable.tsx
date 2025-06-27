import React, { useState, useMemo } from 'react';
import { EquipmentItem, BuildingInfo } from '../types/energyAnalysis.types';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Filter } from 'lucide-react';

interface EquipmentCategoriesTableProps {
  equipment: EquipmentItem[];
  buildingInfo: BuildingInfo;
}

export const EquipmentCategoriesTable: React.FC<EquipmentCategoriesTableProps> = ({
  equipment,
  buildingInfo
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  
  // Get unique categories
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(equipment.map(item => item.category || 'Uncategorized'))];
    return ['all', ...uniqueCategories.sort()];
  }, [equipment]);
  
  // Filter and sort equipment
  const filteredEquipment = useMemo(() => {
    return equipment
      .filter(item => {
        // Apply category filter
        if (categoryFilter !== 'all' && item.category !== categoryFilter) {
          return false;
        }
        
        // Apply search filter
        if (searchTerm) {
          const search = searchTerm.toLowerCase();
          return (
            (item.equipment_type?.toLowerCase().includes(search)) ||
            (item.category?.toLowerCase().includes(search)) ||
            (item.manufacturer?.toLowerCase().includes(search)) ||
            (item.location?.toString().toLowerCase().includes(search))
          );
        }
        
        return true;
      })
      .sort((a, b) => {
        // Sort by category first, then by equipment type
        if (a.category !== b.category) {
          return (a.category || '').localeCompare(b.category || '');
        }
        return (a.equipment_type || '').localeCompare(b.equipment_type || '');
      });
  }, [equipment, categoryFilter, searchTerm]);
  
  // Calculate total energy usage
  const totalEnergyUsage = useMemo(() => {
    return filteredEquipment.reduce((sum, item) => {
      let itemKwh = item.annual_kwh || 0;
      
      // Multiply by units if it's a per-unit item
      if (item.is_per_unit) {
        itemKwh *= buildingInfo.totalUnits;
      }
      
      return sum + itemKwh;
    }, 0);
  }, [filteredEquipment, buildingInfo.totalUnits]);
  
  // Helper function to get the effective quantity
  const getEffectiveQuantity = (item: EquipmentItem) => {
    const baseQuantity = item.quantity || 1;
    return item.is_per_unit ? `${baseQuantity} × ${buildingInfo.totalUnits}` : baseQuantity;
  };
  
  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search equipment..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Equipment Type</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Location</TableHead>
              <TableHead className="text-center">Quantity</TableHead>
              <TableHead className="text-center">Wattage</TableHead>
              <TableHead className="text-right">Annual kWh</TableHead>
              <TableHead className="text-right">Total kWh</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEquipment.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No equipment found.
                </TableCell>
              </TableRow>
            ) : (
              filteredEquipment.map((item) => {
                // Calculate total energy consumption
                const unitKwh = item.annual_kwh || 0;
                const totalKwh = item.is_per_unit 
                  ? unitKwh * buildingInfo.totalUnits 
                  : unitKwh;
                
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="font-medium">{item.equipment_type}</div>
                      {item.manufacturer && (
                        <div className="text-xs text-muted-foreground">
                          {item.manufacturer} {item.model && `(${item.model})`}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {item.category || 'Uncategorized'}
                      {item.subcategory && (
                        <span className="text-xs text-muted-foreground block">
                          {item.subcategory}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {typeof item.location === 'string' 
                        ? item.location
                        : item.location 
                          ? `${item.location.room || ''} ${item.location.floor ? `(Floor ${item.location.floor})` : ''}`
                          : '-'
                      }
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center">
                        <span>{getEffectiveQuantity(item)}</span>
                        {item.is_per_unit && (
                          <Badge variant="outline" className="text-xs mt-1">Per Unit</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {item.wattage 
                        ? `${item.wattage}W` 
                        : item.capacity 
                          ? item.capacity.toString()
                          : '-'
                      }
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {unitKwh ? Math.round(unitKwh).toLocaleString() : '-'}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {totalKwh ? Math.round(totalKwh).toLocaleString() : '-'}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
          <TableRow className="bg-muted/50 font-bold">
            <TableCell colSpan={6} className="text-right">Total Annual Energy Usage</TableCell>
            <TableCell className="text-right">
              {Math.round(totalEnergyUsage).toLocaleString()} kWh
            </TableCell>
          </TableRow>
        </Table>
      </div>
      
      <div className="mt-4 text-sm text-muted-foreground">
        <p>Showing {filteredEquipment.length} of {equipment.length} equipment items.</p>
      </div>
    </div>
  );
}; 