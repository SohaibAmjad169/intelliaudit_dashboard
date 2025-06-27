import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RefreshCw, Plus, Edit, Trash, Info } from 'lucide-react';
import { AshraeEquipmentItem } from '../../types/ashrae';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface AshraeEquipmentTableProps {
  equipment: AshraeEquipmentItem[];
  onRefresh?: () => void;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
}

export const AshraeEquipmentTable: React.FC<AshraeEquipmentTableProps> = ({ 
  equipment,
  onRefresh,
  onEdit,
  onDelete
}) => {
  const [isCalculating] = useState(false);
  const [selectedItem, setSelectedItem] = useState<AshraeEquipmentItem | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  // Handle refreshing equipment data
  const handleRefresh = async () => {
    if (onRefresh) {
      onRefresh();
    }
  };

  // Handle showing calculation details
  const handleShowDetails = (item: AshraeEquipmentItem) => {
    setSelectedItem(item);
    setShowDetailsDialog(true);
  };

  // If there's no equipment, show a message
  if (!equipment || equipment.length === 0) {
    return <div className="text-center py-8">No equipment found</div>;
  }

  // Calculate total kWh
  const totalKwh = equipment.reduce((sum, item) => sum + (item.annual_kwh || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">
          Equipment Energy Usage: {totalKwh.toLocaleString()} kWh
        </h3>
        <div className="flex gap-2">
          <Button 
            onClick={handleRefresh} 
            variant="outline" 
            size="sm"
            disabled={isCalculating}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isCalculating ? 'animate-spin' : ''}`} />
            Refresh Data
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
            <TableHead>Category</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Wattage (W)</TableHead>
            <TableHead>Hours/Week</TableHead>
            <TableHead>Annual kWh</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {equipment.map((item) => (
            <TableRow key={item.id} className="border-0 hover:bg-muted/50">
              <TableCell>{item.category}</TableCell>
              <TableCell>{item.description}</TableCell>
              <TableCell>{item.quantity}</TableCell>
              <TableCell>{item.wattage_w}</TableCell>
              <TableCell>{item.hours_per_week}</TableCell>
              <TableCell>{item.annual_kwh}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleShowDetails(item)}
                    className="h-8 w-8"
                  >
                    <Info className="h-4 w-4" />
                  </Button>
                  {onEdit && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => onEdit(item.id)}
                      className="h-8 w-8"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => onDelete(item.id)}
                      className="h-8 w-8 text-destructive"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="text-sm text-muted-foreground pt-2">
        <p>ASHRAE Level 2 Energy Audit format equipment data</p>
      </div>

      {/* Calculation Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Energy Calculation Details</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-6 max-h-[70vh] overflow-y-auto">
              <div>
                <h3 className="text-lg font-semibold">{selectedItem.description}</h3>
                <p className="text-sm text-muted-foreground">Category: {selectedItem.category}</p>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <h4 className="text-sm font-medium">Quantity</h4>
                  <p>{selectedItem.quantity}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Wattage</h4>
                  <p>{selectedItem.wattage_w} W</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Hours</h4>
                  <p>{selectedItem.hours_per_week} hrs/week ({selectedItem.annual_hours} hrs/year)</p>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium">Annual Energy</h4>
                <p className="text-xl font-bold">{selectedItem.annual_kwh.toLocaleString()} kWh</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium">Formula Used</h4>
                <p className="text-sm bg-muted p-2 rounded">{selectedItem.formula_used}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium">Calculation</h4>
                <p className="text-sm bg-muted p-2 rounded whitespace-pre-line">{selectedItem.work_shown}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium">Assumptions</h4>
                <p className="text-sm whitespace-pre-line">{selectedItem.assumptions}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium">Recommendations</h4>
                <p className="text-sm whitespace-pre-line">{selectedItem.recommendations}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}; 