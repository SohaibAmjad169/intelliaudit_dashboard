import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { equipmentV2Service } from "@/services/equipment/equipment-v2";
import { EquipmentItem } from "../types";

interface EquipmentEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipment: EquipmentItem | null;
  onSaved: () => void;
}

// Utility functions for energy calculations
const calculateAnnualHours = (
  weeklyHours: number | string | undefined
): number => {
  if (!weeklyHours) return 0;
  const hours =
    typeof weeklyHours === "string" ? parseFloat(weeklyHours) : weeklyHours;
  return hours * 52.14; // 52.14 weeks in a year
};

const calculateAnnualKwh = (item: any): number => {
  if (!item) return 0;

  const wattage =
    typeof item.wattage === "string"
      ? parseFloat(item.wattage || "0")
      : item.wattage || 0;
  const quantity = item.quantity || 1;
  const weeklyHours =
    typeof item.weekly_hours === "string"
      ? parseFloat(item.weekly_hours || "0")
      : item.weekly_hours || 0;

  // Calculate annual hours
  const annualHours = calculateAnnualHours(weeklyHours);

  // Calculate annual kWh
  return (wattage * quantity * annualHours) / 1000;
};

export const EquipmentEditModal: React.FC<EquipmentEditModalProps> = ({
  isOpen,
  onClose,
  equipment,
  onSaved,
}) => {
  const [editedItem, setEditedItem] = useState<EquipmentItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update local state when equipment prop changes
  useEffect(() => {
    if (equipment) {
      // Ensure all numeric values are properly parsed from strings if needed
      const parsedEquipment = {
        ...equipment,
        wattage:
          typeof equipment.wattage === "string"
            ? parseFloat(equipment.wattage)
            : equipment.wattage || 0,
        quantity:
          typeof equipment.quantity === "string"
            ? parseInt(equipment.quantity)
            : equipment.quantity || 1,
        weekly_hours:
          typeof equipment.weekly_hours === "string"
            ? parseFloat(equipment.weekly_hours)
            : equipment.weekly_hours || 0,
        annual_kwh:
          typeof equipment.annual_kwh === "string"
            ? parseFloat(equipment.annual_kwh)
            : equipment.annual_kwh || 0,
        multiplier: equipment.multiplier || 1,
        specifications: {
          ...equipment.specifications,
          lampsPerFixture: equipment.specifications?.lampsPerFixture || 1,
          control:
            equipment.specifications?.control ||
            equipment.controlStrategy ||
            "",
          mountingType: equipment.specifications?.mountingType || "",
        },
      };

      setEditedItem(parsedEquipment);
    } else {
      setEditedItem(null);
    }
  }, [equipment]);

  // Recalculate annual kWh whenever wattage, quantity, or weekly_hours changes
  useEffect(() => {
    if (editedItem) {
      // Calculate annual hours
      const weeklyHours =
        typeof editedItem.weekly_hours === "string"
          ? parseFloat(editedItem.weekly_hours || "0")
          : editedItem.weekly_hours || 0;
      const annualHours = calculateAnnualHours(weeklyHours);

      // Update annual_hours
      setEditedItem((prev) => ({
        ...prev,
        annual_hours: annualHours,
      }));

      // Calculate annual kWh
      const annualKwh = calculateAnnualKwh(editedItem);

      // Update annual_kwh
      setEditedItem((prev) => ({
        ...prev,
        annual_kwh: annualKwh,
      }));
    }
  }, [editedItem?.wattage, editedItem?.quantity, editedItem?.weekly_hours]);

  const handleInputChange = (field: string, value: any) => {
    // Convert string values to numbers for numeric fields
    if (field === "wattage" || field === "weekly_hours") {
      value = value === "" ? 0 : parseFloat(value);
    } else if (field === "quantity") {
      value = value === "" ? 0 : parseInt(value);
    }

    setEditedItem((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSpecificationsChange = (field: string, value: any) => {
    setEditedItem((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        specifications: {
          ...prev.specifications,
          [field]: value,
        },
      };
    });
  };

  const handleSave = async () => {
    if (!editedItem || !editedItem.id) return;

    setIsSaving(true);
    setError(null);

    try {
      await equipmentV2Service.updateEquipment(
        editedItem.id.toString(),
        editedItem
      );
      onSaved();
      onClose();
    } catch (err: any) {
      console.error("Error saving equipment:", err);
      setError(err.message || "Failed to save equipment");
    } finally {
      setIsSaving(false);
    }
  };

  // Categories for dropdown
  const categories = [
    "Lighting",
    "HVAC",
    "DHW",
    "Laundry",
    "Kitchen",
    "Electronics",
    "Appliance",
    "Motors",
    "Pumps",
    "Other",
  ];

  const renderLightingFields = () => {
    if (editedItem?.equipment_type !== "Lighting") return null;

    return (
      <>
        <div className="grid grid-cols-2 items-center gap-4">
          {/* Multiplier */}
          <div className="space-y-4">
            <Label htmlFor="multiplier" className="text-right">
              Multiplier
            </Label>
            <Input
              id="multiplier"
              type="number"
              value={editedItem.multiplier || 1}
              onChange={(e) =>
                handleInputChange("multiplier", parseFloat(e.target.value) || 1)
              }
              className="col-span-3"
              min={1}
              step={1}
            />
          </div>

          {/* Lamps per Fixture */}
          <div className="space-y-4">
            <Label htmlFor="lampsPerFixture" className="text-right">
              Lamps per Fixture
            </Label>
            <Input
              id="lampsPerFixture"
              type="number"
              value={editedItem.specifications?.lampsPerFixture || 1}
              onChange={(e) =>
                handleSpecificationsChange(
                  "lampsPerFixture",
                  parseFloat(e.target.value) || 1
                )
              }
              className="col-span-3"
              min={1}
              step={1}
            />
          </div>

          {/* Total Lamps (Read-only) */}
          <div className="space-y-4">
            <Label htmlFor="totalLamps" className="text-right">
              Total Lamps
            </Label>
            <Input
              id="totalLamps"
              type="number"
              value={
                (editedItem.quantity || 1) *
                (editedItem.specifications?.lampsPerFixture || 1) *
                (editedItem.multiplier || 1)
              }
              className="col-span-3"
              disabled
            />
          </div>

          {/* Control */}
          <div className="space-y-4">
            <Label htmlFor="control" className="text-right">
              Control
            </Label>
            <Select
              value={editedItem.specifications?.control || ""}
              onValueChange={(value) =>
                handleSpecificationsChange("control", value)
              }
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select control type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Manual Switch</SelectItem>
                <SelectItem value="occupancy">Occupancy Sensor</SelectItem>
                <SelectItem value="daylight">Daylight Sensor</SelectItem>
                <SelectItem value="timer">Timer</SelectItem>
                <SelectItem value="dimmer">Dimmer</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Mounting Type */}
          <div className="space-y-4">
            <Label htmlFor="mountingType" className="text-right">
              Mounting Type
            </Label>
            <Select
              value={editedItem.specifications?.mountingType || ""}
              onValueChange={(value) =>
                handleSpecificationsChange("mountingType", value)
              }
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select mounting type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="surface">Surface Mount</SelectItem>
                <SelectItem value="recessed">Recessed</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="track">Track Lighting</SelectItem>
                <SelectItem value="wall">Wall Mount</SelectItem>
                <SelectItem value="pole">Pole Mount</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </>
    );
  };

  if (!editedItem) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-[750px]"
        style={{ maxHeight: "90vh", overflowY: "auto" }}
      >
        <DialogHeader>
          <DialogTitle>Edit Equipment</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Equipment Type */}
          <div className="grid grid-cols-2 items-center gap-4">
            <div className="space-y-4">
              <Label htmlFor="equipment_type" className="text-right">
                Equipment Type
              </Label>

              {/* <Input
                id="location"
                value={typeof editedItem.equipment_type === 'string' 
                  ? editedItem.equipment_type 
                  : editedItem.equipment_type || ''}
                onChange={(e) => handleInputChange('equipment_type', e.target.value)}
                className="col-span-3"
              /> */}
              <Select
                value={editedItem.equipment_type || ""}
                onValueChange={(value) =>
                  handleInputChange("equipment_type", value)
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Location */}
            {/* <div className="grid grid-cols-4 items-center gap-4"> */}

            <div className="space-y-4">
              <Label htmlFor="location" className="text-right">
                Location
              </Label>
              <Input
                id="location"
                value={
                  typeof editedItem.location === "string"
                    ? editedItem.location
                    : editedItem.location?.room ||
                      editedItem.location?.area ||
                      ""
                }
                onChange={(e) => handleInputChange("location", e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>

          {/* Render lighting-specific fields if equipment type is Lighting */}
          {renderLightingFields()}

          {/* Common fields that apply to all equipment types */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="manufacturer">Manufacturer</Label>
                <Input
                  id="manufacturer"
                  value={editedItem?.manufacturer || ""}
                  onChange={(e) =>
                    handleInputChange("manufacturer", e.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="model">Model</Label>
                <Input
                  id="model"
                  value={editedItem?.model || ""}
                  onChange={(e) => handleInputChange("model", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="wattage">Wattage</Label>
                <Input
                  id="wattage"
                  type="number"
                  value={editedItem?.wattage || ""}
                  onChange={(e) => handleInputChange("wattage", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={editedItem?.quantity || ""}
                  onChange={(e) =>
                    handleInputChange("quantity", e.target.value)
                  }
                />
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="weekly_hours">Weekly Operating Hours</Label>
                <Input
                  id="weekly_hours"
                  type="number"
                  value={editedItem?.weekly_hours || ""}
                  onChange={(e) =>
                    handleInputChange("weekly_hours", e.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="operating_hours">
                  Daily Operating Hours (Calculated)
                </Label>
                <Input
                  id="operating_hours"
                  type="number"
                  value={editedItem?.operating_hours || ""}
                  disabled
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="days_per_week">Days per Week</Label>
                <Input
                  id="days_per_week"
                  type="number"
                  value={editedItem?.days_per_week || ""}
                  onChange={(e) =>
                    handleInputChange("days_per_week", e.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="annual_hours">Annual Hours (Calculated)</Label>
                <Input
                  id="annual_hours"
                  type="number"
                  value={editedItem?.annual_hours || ""}
                  disabled
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="annual_kwh">Annual kWh (Calculated)</Label>
                <Input
                  id="annual_kwh"
                  type="number"
                  value={editedItem?.annual_kwh || ""}
                  disabled
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="text-destructive text-sm col-span-4 mt-2">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
            className="bg-background/50 backdrop-blur-sm border-border/50 hover:bg-accent/50"
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-emerald-500/90 hover:bg-emerald-600/90 text-white backdrop-blur-sm"
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
