import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Plus, Save } from 'lucide-react';
import { EquipmentItem } from '../../types';
import { EditableEquipmentRow } from './EditableEquipmentRow';
import { CategorySubtotal } from './CategorySubtotal';
import { GrandTotal } from './GrandTotal';
import { equipmentV2Service } from '@/services/equipment/equipment-v2';
import { useToast } from '@/components/ui/use-toast';

export interface EditableEquipmentTableProps {
  equipment: EquipmentItem[];
  totalApartmentCount: number;
  isApartmentEquipment: (item: EquipmentItem) => boolean;
  projectId: string;
  onEquipmentUpdated: () => void;
}

export const EditableEquipmentTable: React.FC<EditableEquipmentTableProps> = ({
  equipment,
  isApartmentEquipment,
  projectId,
  onEquipmentUpdated,
}) => {
  const [editedEquipment, setEditedEquipment] = useState<EquipmentItem[]>(equipment);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Update local state when equipment prop changes
  useEffect(() => {
    setEditedEquipment(equipment);
  }, [equipment]);

  // Add a check for empty equipment array
  if (!editedEquipment || editedEquipment.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center text-muted-foreground">
        <p className="mb-4">No equipment data available.</p>
        <Button onClick={() => handleAddNewItem()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Equipment
        </Button>
      </div>
    );
  }

  // Group items by equipment type for better organization
  const groupedEquipment = editedEquipment.reduce((acc, item) => {
    const type = item.category && item.category !== 'Unknown' ? 
      item.category : 
      (item.equipment_type || 'Other Equipment');
      
    if (!acc[type]) {
      acc[type] = [];
    }
    
    // Set apartment location and calculation details
    if (isApartmentEquipment(item)) {
      item.location = "Apartment";
      if (!item.calculation_details) {
        item.calculation_details = {
          quantity: 1,
          weekly_hours: 28,
          is_apartment_item: true
        };
      }
    }
    
    acc[type].push(item);
    return acc;
  }, {} as Record<string, EquipmentItem[]>);

  const sortedGroups = Object.keys(groupedEquipment).sort();

  // Calculate total kWh for all equipment
  const totalKwh = editedEquipment.reduce((sum, item) => {
    return sum + (item.annual_kwh || 0);
  }, 0);

  // Handle equipment item change
  function handleEquipmentChange(updatedItem: EquipmentItem) {
    setEditedEquipment(prev => 
      prev.map(item => item.id === updatedItem.id ? updatedItem : item)
    );
  }

  // Handle adding a new equipment item
  function handleAddNewItem(category?: string): void {
    const newItem: EquipmentItem & { is_new?: boolean } = {
      id: `temp-${Date.now()}`, // Temporary ID until saved
      equipment_type: '',
      category: category || 'Other Equipment',
      quantity: 1,
      wattage: 0,
      annual_kwh: 0,
      location: 'Common',
      project_id: projectId,
      is_new: true // Flag to identify new items
    };
    
    setEditedEquipment(prev => [...prev, newItem]);
  }
  
  // Handle button click for adding new item
  function handleAddNewItemClick() {
    handleAddNewItem();
  }

  // Handle deleting an equipment item
  async function handleDeleteItem(id: string | number) {
    // If it's a new item (not yet saved to DB), just remove from state
    if (typeof id === 'string' && id.startsWith('temp-')) {
      setEditedEquipment(prev => prev.filter(item => item.id !== id));
      return;
    }
    
    // For DB items, convert id to string if needed
    const itemId = id.toString();
    
    // Otherwise, delete from DB
    try {
      const result = await equipmentV2Service.deleteEquipment(itemId);
      if (result?.success) {
        setEditedEquipment(prev => prev.filter(item => item.id !== id));
        // Toast notification removed as requested
      } else {
        throw new Error("Failed to delete equipment");
      }
    } catch (error) {
      console.error("Error deleting equipment:", error);
      // Only log errors to console, no toast notification
    }
  }

  // Handle adding a new item to a specific category
  function handleAddToCategoryClick(category: string): React.MouseEventHandler<HTMLButtonElement> {
    return (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      handleAddNewItem(category);
    };
  }

  // Save all equipment changes
  async function handleSaveChanges() {
    setIsSaving(true);
    try {
      // Separate new items from existing ones
      const newItems = editedEquipment.filter(item => (item as any).is_new).map(item => {
        // Remove temporary properties
        const { is_new, ...itemData } = item as any;
        // Remove temporary ID
        if (typeof item.id === 'string' && item.id.startsWith('temp-')) {
          const { id, ...rest } = itemData;
          return { ...rest, project_id: projectId };
        }
        return { ...itemData, project_id: projectId };
      });
      
      // Get existing items that need updating
      const existingItems = editedEquipment.filter(item => !(item as any).is_new);
      
      // Combine all items for bulk update
      const allItems = [...existingItems, ...newItems];
      
      // Perform bulk update
      const result = await equipmentV2Service.bulkUpdateEquipment(projectId, allItems);
      
      if (result) {
        toast({
          title: "Changes saved",
          description: "All equipment changes have been saved",
          variant: "default",
        });
        
        // Refresh equipment data
        onEquipmentUpdated();
      } else {
        throw new Error("Failed to save changes");
      }
    } catch (error) {
      console.error("Error saving equipment changes:", error);
      toast({
        title: "Error",
        description: "Failed to save equipment changes",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Button 
          onClick={handleAddNewItemClick} 
          className="mb-4"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Equipment
        </Button>
        
        <Button 
          onClick={handleSaveChanges} 
          className="mb-4"
          disabled={isSaving}
          variant="default"
        >
          {isSaving ? (
            <>Saving...</>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">Equipment Type</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Wattage</TableHead>
              <TableHead>Operating Hours</TableHead>
              <TableHead>Formula Used</TableHead>
              <TableHead>Work Shown</TableHead>
              <TableHead className="text-right">Annual kWh</TableHead>
              <TableHead className="w-[80px]">Area Type</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedGroups.map(groupName => (
              <React.Fragment key={groupName}>
                {/* Group Header */}
                <TableRow className="bg-muted/50">
                  <TableCell colSpan={8} className="font-medium py-2">
                    <div className="flex justify-between items-center">
                      <span>{groupName}</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={handleAddToCategoryClick(groupName)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add to {groupName}
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="py-2"></TableCell>
                </TableRow>
                
                {/* Group Items */}
                {groupedEquipment[groupName].map((item) => (
                  <EditableEquipmentRow
                    key={item.id}
                    item={item}
                    isApartment={isApartmentEquipment(item)}
                    onChange={handleEquipmentChange}
                    onDelete={() => handleDeleteItem(item.id)}
                  />
                ))}
                
                {/* Category Subtotal */}
                <CategorySubtotal
                  items={groupedEquipment[groupName]}
                  categoryName={groupName}
                />
              </React.Fragment>
            ))}
            
            {/* Grand Total */}
            <GrandTotal totalKwh={totalKwh} />
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
