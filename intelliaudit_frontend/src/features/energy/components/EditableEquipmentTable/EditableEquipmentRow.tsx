import React, { useState, useEffect } from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { EquipmentItem } from '../../types';

interface EditableEquipmentRowProps {
  item: EquipmentItem;
  isApartment: boolean;
  onChange: (updatedItem: EquipmentItem) => void;
  onDelete: () => void;
}

export const EditableEquipmentRow: React.FC<EditableEquipmentRowProps> = ({
  item,
  isApartment,
  onChange,
  onDelete,
}) => {
  // Local state for the edited item
  const [editedItem, setEditedItem] = useState<EquipmentItem>({ ...item });
  
  // Update local state when item prop changes
  useEffect(() => {
    // Ensure wattage is properly initialized
    const initialItem = { ...item };
    if (initialItem.wattage === null || initialItem.wattage === undefined) {
      initialItem.wattage = 0;
    }
    setEditedItem(initialItem);
  }, [item]);

  // Handle input changes
  const handleInputChange = (field: keyof EquipmentItem, value: any) => {
    const updatedItem = { ...editedItem };
    
    // Simplified location handling - always use a simple string
    if (field === 'location') {
      // If it's a string, use it directly
      if (typeof value === 'string') {
        updatedItem.location = value;
      }
      // If it's an object, extract a meaningful string value
      else if (typeof value === 'object' && value !== null) {
        if (value.room && typeof value.room === 'string') {
          updatedItem.location = value.room;
        } else if (value.name && typeof value.name === 'string') {
          updatedItem.location = value.name;
        } else {
          // Default if no meaningful string found
          updatedItem.location = 'Unknown';
        }
      } else {
        // Default for null or undefined
        updatedItem.location = 'Unknown';
      }
    } else {
      // For all other fields, assign directly
      // Use type assertion to fix the TypeScript error
      (updatedItem as any)[field] = value;
    }
    
    // Calculate annual kWh when relevant fields change
    if (field === 'wattage' || field === 'quantity' || field === 'operating_hours') {
      const wattage = parseFloat((updatedItem.wattage as any)?.toString() || '0') || 0;
      const quantity = parseInt((updatedItem.quantity as any)?.toString() || '1') || 1;
      
      // Use operating_hours for calculations (which might be weekly hours)
      const operatingHours = parseFloat((updatedItem.operating_hours as any)?.toString() || '0') || 0;
      
      // Calculate annual hours (52.14 weeks per year)
      const annualHours = operatingHours * 52.14;
      (updatedItem as any).annual_hours = annualHours;
      
      // Calculate annual kWh
      const annualKwh = (wattage * quantity * annualHours) / 1000;
      (updatedItem as any).annual_kwh = annualKwh;
      
      // Set formula and work shown
      (updatedItem as any).formula_used = '(wattage * quantity * annual_hours) / 1000';
      (updatedItem as any).work_shown = `(${wattage} * ${quantity} * ${Math.round(annualHours)}) / 1000`;
    }
    
    setEditedItem(updatedItem);
    onChange(updatedItem);
  };

  // Simplified location handling - always extract a simple string value
  const getLocationValue = () => {
    if (!editedItem.location) return 'Unknown';
    
    // Handle string locations
    if (typeof editedItem.location === 'string') {
      // Try to parse JSON string if it looks like JSON
      if (editedItem.location.startsWith('{')) {
        try {
          // Parse the JSON string
          const locationObj = JSON.parse(editedItem.location);
          
          // Extract a meaningful string value
          if (locationObj && typeof locationObj === 'object') {
            if (locationObj.room && typeof locationObj.room === 'string') {
              // Check if room is also a JSON string
              if (locationObj.room.startsWith('{')) {
                try {
                  const nestedObj = JSON.parse(locationObj.room);
                  if (nestedObj.room && typeof nestedObj.room === 'string') {
                    return nestedObj.room;
                  }
                } catch (e) {
                  return locationObj.room;
                }
              }
              return locationObj.room;
            }
            // Check for other properties
            if (locationObj.name && typeof locationObj.name === 'string') {
              return locationObj.name;
            }
          }
        } catch (e) {
          // If parsing fails, just use the string as is
          console.log('Failed to parse location JSON:', e);
        }
      }
      // If it's not JSON or parsing failed, return the string directly
      return editedItem.location;
    }
    
    // If location is an object, extract a meaningful string value
    if (typeof editedItem.location === 'object') {
      const locationObj = editedItem.location as Record<string, any>;
      
      // Check for room property
      if ('room' in locationObj && typeof locationObj.room === 'string') {
        return locationObj.room;
      }
      
      // Check for other common properties
      if ('name' in locationObj && typeof locationObj.name === 'string') {
        return locationObj.name;
      }
      
      // Fall back to the first string property we find
      for (const key in locationObj) {
        if (typeof locationObj[key] === 'string') {
          return locationObj[key];
        }
      }
    }
    
    return 'Unknown';
  };
  
  // We no longer need to distinguish between complex and simple locations
  // All locations will be treated as simple strings in the UI

  return (
    <TableRow>
      {/* Equipment Type */}
      <TableCell>
        <Input
          value={editedItem.equipment_type || ''}
          onChange={(e) => handleInputChange('equipment_type', e.target.value)}
          className="w-full"
          placeholder="Equipment type"
        />
      </TableCell>
      
      {/* Location */}
      <TableCell>
        {/* Replace the Select dropdown with a read-only display */}
        <div className="py-2 px-3 rounded-md bg-muted/50 text-sm">
          {getLocationValue()}
        </div>
      </TableCell>
      
      {/* Quantity */}
      <TableCell>
        <Input
          type="number"
          value={editedItem.quantity || 1}
          onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 1)}
          className="w-20"
          min={1}
        />
      </TableCell>
      
      {/* Wattage */}
      <TableCell>
        <Input
          type="number"
          value={editedItem.wattage !== null && editedItem.wattage !== undefined ? editedItem.wattage : 0}
          onChange={(e) => {
            const wattage = parseFloat(e.target.value) || 0;
            handleInputChange('wattage', wattage);
          }}
          className="w-24"
          min={0}
          step={0.1}
        />
      </TableCell>
      
      {/* Operating Hours */}
      <TableCell>
        <Input
          type="number"
          value={editedItem.operating_hours || (isApartment ? 28 : 84)}
          onChange={(e) => {
            const hours = parseFloat(e.target.value) || 0;
            handleInputChange('operating_hours', hours);
          }}
          className="w-24"
          min={0}
          step={0.5}
        />
      </TableCell>
      
      {/* Formula Used - NEW */}
      <TableCell>
        <Input
          value={editedItem.formula_used || ''}
          onChange={(e) => handleInputChange('formula_used', e.target.value)}
          className="w-full"
          placeholder="Enter formula"
        />
      </TableCell>
      
      {/* Work Shown - NEW */}
      <TableCell>
        <Input
          value={editedItem.work_shown || ''}
          onChange={(e) => handleInputChange('work_shown', e.target.value)}
          className="w-full"
          placeholder="Show your work"
        />
      </TableCell>
      
      {/* Annual kWh */}
      <TableCell className="text-right">
        <span className="font-semibold">{Math.round(editedItem.annual_kwh || 0).toLocaleString()} kWh</span>
      </TableCell>
      
      {/* Area Type */}
      <TableCell>
        <Badge variant={isApartment ? "secondary" : "outline"}>
          {isApartment ? 'Apartment' : 'Common'}
        </Badge>
      </TableCell>
      
      {/* Actions */}
      <TableCell>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onDelete}
          title="Delete"
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </TableCell>
    </TableRow>
  );
};
