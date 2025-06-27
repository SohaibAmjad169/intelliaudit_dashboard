import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, X } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { equipmentAnalysisService, EquipmentAnalysisItem } from '@/services/equipment/equipment-analysis';

interface EquipmentEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipment: EquipmentAnalysisItem | null;
  onSaved: () => void;
}

// Utility functions for energy calculations
const calculateAnnualHours = (weeklyHours: number | string | undefined): number => {
  if (!weeklyHours) return 0;
  const hours = typeof weeklyHours === 'string' ? parseFloat(weeklyHours) : weeklyHours;
  return hours * 52.14; // 52.14 weeks in a year
};

const calculateAnnualKwh = (item: any): number => {
  if (!item) return 0;
  
  const wattage = typeof item.wattage === 'string' ? parseFloat(item.wattage || '0') : (item.wattage || 0);
  const quantity = item.quantity || 1;
  const weeklyHours = typeof item.weekly_hours === 'string' ? parseFloat(item.weekly_hours || '0') : (item.weekly_hours || 0);
  
  // Calculate annual hours
  const annualHours = calculateAnnualHours(weeklyHours);
  
  // Calculate annual kWh
  return (wattage * quantity * annualHours) / 1000;
};

export const EquipmentEditModalEnhanced: React.FC<EquipmentEditModalProps> = ({
  isOpen,
  onClose,
  equipment,
  onSaved
}) => {
  const [editedItem, setEditedItem] = useState<EquipmentAnalysisItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('general');

  // Update local state when equipment prop changes
  useEffect(() => {
    if (equipment) {
      setEditedItem({ ...equipment });
    } else {
      setEditedItem(null);
    }
  }, [equipment]);

  const handleChange = (field: string, value: any) => {
    if (!editedItem) return;

    const updatedItem = { ...editedItem, [field]: value };
    
    // Calculate annual hours and annual kWh when relevant fields change
    if (field === 'wattage' || field === 'quantity' || field === 'weekly_hours') {
      const wattage = parseFloat(updatedItem.wattage?.toString() || '0') || 0;
      const quantity = parseInt(updatedItem.quantity?.toString() || '1') || 1;
      const weeklyHours = parseFloat(updatedItem.weekly_hours?.toString() || '0') || 0;
      
      // Calculate annual hours
      const annualHours = calculateAnnualHours(weeklyHours);
      updatedItem.annual_hours = annualHours;
      
      // Calculate annual kWh
      const annualKwh = calculateAnnualKwh(updatedItem);
      updatedItem.annual_kwh = annualKwh;
      
      // Set formula and work shown
      updatedItem.formula_used = '(wattage * quantity * annual_hours) / 1000';
      updatedItem.work_shown = `(${wattage} * ${quantity} * ${Math.round(annualHours)}) / 1000`;
    }
    
    setEditedItem(updatedItem);
  };

  const handleSave = async () => {
    if (!editedItem || !editedItem.id) return;
    
    setIsSaving(true);
    setError(null);
    
    try {
      await equipmentAnalysisService.update(editedItem.id.toString(), editedItem);
      onSaved();
      onClose();
    } catch (err: any) {
      console.error('Error saving equipment:', err);
      setError(err.message || 'Failed to save equipment');
    } finally {
      setIsSaving(false);
    }
  };

  // Categories for dropdown
  const categories = [
    'Lighting', 'HVAC', 'DHW', 'Laundry', 'Kitchen', 
    'Electronics', 'Appliance', 'Motors', 'Pumps', 'Other'
  ];

  if (!editedItem) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Equipment</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-5 mb-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="specs">Specifications</TabsTrigger>
            <TabsTrigger value="energy">Energy</TabsTrigger>
            <TabsTrigger value="type-specific">Type Specific</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          </TabsList>
          
          {/* General Tab */}
          <TabsContent value="general" className="space-y-4">
            {/* Equipment Type */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="equipment_type" className="text-right">Type</Label>
              <Input
                id="equipment_type"
                value={editedItem.equipment_type || ''}
                onChange={(e) => handleChange('equipment_type', e.target.value)}
                className="col-span-3"
              />
            </div>
            
            {/* Category */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">Category</Label>
              <Select 
                value={editedItem.category || 'Other'} 
                onValueChange={(value) => handleChange('category', value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Location */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="location" className="text-right">Location</Label>
              <Input
                id="location"
                value={typeof editedItem.location === 'string' ? editedItem.location : ''}
                onChange={(e) => handleChange('location', e.target.value)}
                className="col-span-3"
              />
            </div>
            
            {/* Is Per Unit (Apartment/Common) */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="is_per_unit" className="text-right">Area Type</Label>
              <Select 
                value={editedItem.is_per_unit ? 'true' : 'false'} 
                onValueChange={(value) => handleChange('is_per_unit', value === 'true')}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select area type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Apartment</SelectItem>
                  <SelectItem value="false">Common</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Quantity */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="quantity" className="text-right">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                value={editedItem.quantity || 1}
                onChange={(e) => handleChange('quantity', parseInt(e.target.value) || 1)}
                className="col-span-3"
                min={1}
              />
            </div>
            
            {/* Manufacturer */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="manufacturer" className="text-right">Manufacturer</Label>
              <Input
                id="manufacturer"
                value={editedItem.manufacturer || ''}
                onChange={(e) => handleChange('manufacturer', e.target.value)}
                className="col-span-3"
              />
            </div>

            {/* Model */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="model" className="text-right">Model</Label>
              <Input
                id="model"
                value={editedItem.model || ''}
                onChange={(e) => handleChange('model', e.target.value)}
                className="col-span-3"
              />
            </div>

            {/* Serial Number */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="serial_number" className="text-right">Serial Number</Label>
              <Input
                id="serial_number"
                value={editedItem.serial_number || ''}
                onChange={(e) => handleChange('serial_number', e.target.value)}
                className="col-span-3"
              />
            </div>
          </TabsContent>
          
          {/* Specifications Tab */}
          <TabsContent value="specs" className="space-y-4">
            {/* Capacity */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="capacity" className="text-right">Capacity</Label>
              <Input
                id="capacity"
                value={editedItem.capacity || ''}
                onChange={(e) => handleChange('capacity', e.target.value)}
                className="col-span-3"
                placeholder="e.g. 119 gallons"
              />
            </div>

            {/* Voltage */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="voltage" className="text-right">Voltage</Label>
              <Input
                id="voltage"
                value={editedItem.voltage || ''}
                onChange={(e) => handleChange('voltage', e.target.value)}
                className="col-span-3"
                placeholder="e.g. 208-230V"
              />
            </div>

            {/* Phase */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phase" className="text-right">Phase</Label>
              <Input
                id="phase"
                value={editedItem.phase || ''}
                onChange={(e) => handleChange('phase', e.target.value)}
                className="col-span-3"
                placeholder="e.g. Single, Three"
              />
            </div>

            {/* Fuel Type */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="fuel_type" className="text-right">Fuel Type</Label>
              <Input
                id="fuel_type"
                value={editedItem.fuel_type || ''}
                onChange={(e) => handleChange('fuel_type', e.target.value)}
                className="col-span-3"
                placeholder="e.g. Electric, Natural Gas"
              />
            </div>

            {/* Cooling Efficiency */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="cooling_efficiency" className="text-right">Cooling Efficiency</Label>
              <Input
                id="cooling_efficiency"
                value={editedItem.cooling_efficiency || ''}
                onChange={(e) => handleChange('cooling_efficiency', e.target.value)}
                className="col-span-3"
                placeholder="e.g. 14 SEER"
              />
            </div>

            {/* Heating Efficiency */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="heating_efficiency" className="text-right">Heating Efficiency</Label>
              <Input
                id="heating_efficiency"
                value={editedItem.heating_efficiency || ''}
                onChange={(e) => handleChange('heating_efficiency', e.target.value)}
                className="col-span-3"
                placeholder="e.g. 8.5 HSPF"
              />
            </div>
          </TabsContent>
          
          {/* Energy Tab */}
          <TabsContent value="energy" className="space-y-4">
            {/* Wattage */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="wattage" className="text-right">Wattage</Label>
              <Input
                id="wattage"
                type="number"
                value={editedItem.wattage || 0}
                onChange={(e) => handleChange('wattage', parseFloat(e.target.value) || 0)}
                className="col-span-3"
                min={0}
                step={0.1}
              />
            </div>
            
            {/* Weekly Hours */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="weekly_hours" className="text-right">Hours per Week</Label>
              <Input
                id="weekly_hours"
                type="number"
                value={editedItem.weekly_hours || 0}
                onChange={(e) => handleChange('weekly_hours', parseFloat(e.target.value) || 0)}
                className="col-span-3"
                min={0}
              />
            </div>
            
            {/* Annual Hours (Read-only) */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="annual_hours" className="text-right">Annual Hours</Label>
              <Input
                id="annual_hours"
                type="text"
                value={Math.round(parseFloat((editedItem.annual_hours || 0).toString())).toLocaleString()}
                readOnly
                className="col-span-3 bg-muted"
              />
            </div>
            
            {/* Annual kWh (Read-only) */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="annual_kwh" className="text-right">Annual kWh</Label>
              <Input
                id="annual_kwh"
                type="text"
                value={Math.round(parseFloat((editedItem.annual_kwh || 0).toString())).toLocaleString()}
                readOnly
                className="col-span-3 bg-muted"
              />
            </div>
            
            {/* Annual Therms */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="annual_therms" className="text-right">Annual Therms</Label>
              <Input
                id="annual_therms"
                type="number"
                value={editedItem.annual_therms || 0}
                onChange={(e) => handleChange('annual_therms', parseFloat(e.target.value) || 0)}
                className="col-span-3"
                min={0}
              />
            </div>
            
            {/* Load Factor */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="load_factor" className="text-right">Load Factor</Label>
              <Input
                id="load_factor"
                type="number"
                value={editedItem.load_factor || 1.0}
                onChange={(e) => handleChange('load_factor', parseFloat(e.target.value) || 1.0)}
                className="col-span-3"
                min={0}
                max={1}
                step={0.1}
              />
            </div>
          </TabsContent>
          
          {/* Type Specific Tab */}
          <TabsContent value="type-specific" className="space-y-4">
            {editedItem.category === 'HVAC' && (
              <>
                {/* Refrigerant Type */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="refrigerant_type" className="text-right">Refrigerant Type</Label>
                  <Input
                    id="refrigerant_type"
                    value={editedItem.refrigerant_type || ''}
                    onChange={(e) => handleChange('refrigerant_type', e.target.value)}
                    className="col-span-3"
                    placeholder="e.g. R-410A"
                  />
                </div>
                
                {/* Airflow Rate */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="airflow_rate" className="text-right">Airflow Rate (CFM)</Label>
                  <Input
                    id="airflow_rate"
                    type="number"
                    value={editedItem.airflow_rate || 0}
                    onChange={(e) => handleChange('airflow_rate', parseFloat(e.target.value) || 0)}
                    className="col-span-3"
                    min={0}
                  />
                </div>
              </>
            )}
            
            {editedItem.category === 'Lighting' && (
              <>
                {/* Lumens */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="lumens" className="text-right">Lumens</Label>
                  <Input
                    id="lumens"
                    type="number"
                    value={editedItem.lumens || 0}
                    onChange={(e) => handleChange('lumens', parseInt(e.target.value) || 0)}
                    className="col-span-3"
                    min={0}
                  />
                </div>
                
                {/* Color Temperature */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="color_temperature" className="text-right">Color Temp (K)</Label>
                  <Input
                    id="color_temperature"
                    type="number"
                    value={editedItem.color_temperature || 0}
                    onChange={(e) => handleChange('color_temperature', parseInt(e.target.value) || 0)}
                    className="col-span-3"
                    min={0}
                  />
                </div>
                
                {/* Lighting Type */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="lighting_type" className="text-right">Lighting Type</Label>
                  <Select 
                    value={editedItem.lighting_type || ''} 
                    onValueChange={(value) => handleChange('lighting_type', value)}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select lighting type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LED">LED</SelectItem>
                      <SelectItem value="Fluorescent">Fluorescent</SelectItem>
                      <SelectItem value="Incandescent">Incandescent</SelectItem>
                      <SelectItem value="HID">HID</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            
            {(editedItem.category === 'DHW' || editedItem.category === 'Water Heater') && (
              <>
                {/* Recovery Rate */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="recovery_rate" className="text-right">Recovery Rate (GPH)</Label>
                  <Input
                    id="recovery_rate"
                    type="number"
                    value={editedItem.recovery_rate || 0}
                    onChange={(e) => handleChange('recovery_rate', parseFloat(e.target.value) || 0)}
                    className="col-span-3"
                    min={0}
                  />
                </div>
                
                {/* Standby Loss */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="standby_loss" className="text-right">Standby Loss (%)</Label>
                  <Input
                    id="standby_loss"
                    type="number"
                    value={editedItem.standby_loss || 0}
                    onChange={(e) => handleChange('standby_loss', parseFloat(e.target.value) || 0)}
                    className="col-span-3"
                    min={0}
                    max={100}
                    step={0.1}
                  />
                </div>
              </>
            )}
            
            {editedItem.category === 'Appliance' && (
              <>
                {/* Energy Star Rated */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="energy_star_rated" className="text-right">Energy Star Rated</Label>
                  <div className="col-span-3 flex items-center">
                    <Checkbox 
                      id="energy_star_rated" 
                      checked={editedItem.energy_star_rated || false}
                      onCheckedChange={(checked) => handleChange('energy_star_rated', checked)}
                    />
                    <Label htmlFor="energy_star_rated" className="ml-2">Yes</Label>
                  </div>
                </div>
              </>
            )}
          </TabsContent>
          
          {/* Maintenance Tab */}
          <TabsContent value="maintenance" className="space-y-4">
            {/* Equipment Age */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="equipment_age" className="text-right">Equipment Age (years)</Label>
              <Input
                id="equipment_age"
                type="number"
                value={editedItem.equipment_age || 0}
                onChange={(e) => handleChange('equipment_age', parseInt(e.target.value) || 0)}
                className="col-span-3"
                min={0}
              />
            </div>
            
            {/* Expected Lifetime */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="expected_lifetime" className="text-right">Expected Lifetime (years)</Label>
              <Input
                id="expected_lifetime"
                type="number"
                value={editedItem.expected_lifetime || 0}
                onChange={(e) => handleChange('expected_lifetime', parseInt(e.target.value) || 0)}
                className="col-span-3"
                min={0}
              />
            </div>
            
            {/* Installation Date */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="installation_date" className="text-right">Installation Date</Label>
              <Input
                id="installation_date"
                type="date"
                value={editedItem.installation_date ? new Date(editedItem.installation_date).toISOString().split('T')[0] : ''}
                onChange={(e) => handleChange('installation_date', e.target.value)}
                className="col-span-3"
              />
            </div>
            
            {/* Maintenance Schedule */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="maintenance_schedule" className="text-right">Maintenance Schedule</Label>
              <Input
                id="maintenance_schedule"
                value={editedItem.maintenance_schedule || ''}
                onChange={(e) => handleChange('maintenance_schedule', e.target.value)}
                className="col-span-3"
                placeholder="e.g. Annual inspection"
              />
            </div>
            
            {/* Replacement Cost */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="replacement_cost" className="text-right">Replacement Cost ($)</Label>
              <Input
                id="replacement_cost"
                type="number"
                value={editedItem.replacement_cost || 0}
                onChange={(e) => handleChange('replacement_cost', parseFloat(e.target.value) || 0)}
                className="col-span-3"
                min={0}
              />
            </div>
            
            {/* Recommendations */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="recommendations" className="text-right">Recommendations</Label>
              <Input
                id="recommendations"
                value={editedItem.recommendations || ''}
                onChange={(e) => handleChange('recommendations', e.target.value)}
                className="col-span-3"
                placeholder="e.g. Replace with high-efficiency model"
              />
            </div>
          </TabsContent>
        </Tabs>
        
        {error && (
          <div className="text-destructive text-sm mt-2">
            {error}
          </div>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
