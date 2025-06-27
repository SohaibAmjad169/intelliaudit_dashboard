import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { apiClient } from '@/services/common/api-client';
import { Loader2, AlertCircle, Info, Edit, Trash2, Zap, ClipboardList, Camera, Plus, Sparkles, Thermometer, Lightbulb, Droplet, Image, Shirt, Sprout, Utensils, Waves, Database, AlertTriangle, ChevronDown, Wind, RefreshCw } from 'lucide-react';
import { DeviationExplanations } from './DeviationExplanations';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PhotoUploadForm } from '@/features/energy/components/PhotoUploadForm';
import { fetchTotalUtilityUsage } from '@/services/energy-analysis';
import { fieldNotesService } from '@/services/field-notes';
import { equipmentV2Service } from '@/services/equipment/equipment-v2';
import { EnergyBreakdownDialog } from './EnergyBreakdownDialog';
import { toast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { EquipmentEditModal } from './components/EquipmentEditModal';
import { useParams } from 'react-router-dom';
import { FieldNotesProcessor } from './field-notes/FieldNotesProcessor';
import { RawNotesModal } from './RawNotesModal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { EquipmentTable } from './components/EquipmentTable';
import { PlaceholderHighlight } from '@/components/ui/PlaceholderHighlight';
import { EquipmentItem, Location, EquipmentCondition } from './types';
import { Pencil, Power } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip as RechartsTooltip } from 'recharts';
import { EnergyBreakdown, EndUseComponent } from '@/services/field-notes/field-notes.types';

// TanStack Table imports
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  ColumnDef,
} from '@tanstack/react-table';

// Shadcn UI Table components
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Simple header component
const Header = ({ title, subtitle }: { title: string; subtitle?: string }) => (
  <div className="mb-6">
    <h1 className="text-2xl font-bold">{title}</h1>
    {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
  </div>
);

// Utility functions for energy calculations
const calculateAnnualHours = (weeklyHours: number | string | undefined): number => {
  if (!weeklyHours) return 0;
  const hours = typeof weeklyHours === 'string' ? parseFloat(weeklyHours) : weeklyHours;
  return hours * 52.14; // 52.14 weeks in a year
};

const calculateAnnualKwh = (item: EquipmentItem): number => {
  if (!item) return 0;

  // Safely access potentially undefined properties
  const wattage = typeof item.wattage === 'string' ? parseFloat(item.wattage || '0') : (item.wattage ?? 0);
  const quantity = item.quantity ?? 1;
  const weeklyHours = typeof item.weekly_hours === 'string' ? parseFloat(item.weekly_hours || '0') : (item.weekly_hours ?? 0);

  // Calculate annual hours
  const annualHours = calculateAnnualHours(weeklyHours);

  // Calculate annual kWh
  return (wattage * quantity * annualHours) / 1000;
};

// Component props
interface EquipmentProps {
  projectId: string;
  equipment?: EquipmentItem[];
  project?: {
    id: string;
    raw_notes?: string;
    [key: string]: any;
  };
  publicView?: boolean;
}

// Add this new component after the Header component
const EmptyState = ({ onAddFieldNotes, onUploadPhotos, publicView }: {
  onAddFieldNotes: () => void;
  onUploadPhotos: () => void;
  publicView?: boolean;
}) => (
  <div className="flex flex-col items-center justify-center p-8 text-center">
    <div className="mb-6">
      <Zap className="w-12 h-12 mx-auto text-emerald-500" />
    </div>
    <h2 className="text-xl font-semibold mb-2">Start Your Energy Audit</h2>
    <p className="text-muted-foreground mb-6 max-w-md">
      To begin analyzing your building's equipment and energy usage, please upload your field notes and photos from the site visit.
    </p>
    
    {!publicView && (
    <div className="flex flex-col sm:flex-row gap-4">
      <Button
        onClick={onAddFieldNotes}
        className="bg-emerald-600 hover:bg-emerald-700 text-white"
      >
        <ClipboardList className="w-4 h-4 mr-2" />
        Add Field Notes
      </Button>
      <Button
        onClick={onUploadPhotos}
        variant="outline"
      >
        <Camera className="w-4 h-4 mr-2" />
        Upload Photos
      </Button>
    </div>
    )}
  </div>
);

// Update PhotoUploadPrompt component
const PhotoUploadPrompt = ({ onUploadPhotos }: { onUploadPhotos: () => void }) => (
  <div className="bg-muted/50 border border-border rounded-lg p-4 mb-6">
    <div className="flex items-start gap-3">
      <Camera className="w-5 h-5 text-muted-foreground mt-0.5" />
      <div>
        <h3 className="font-medium text-foreground">Add Equipment Photos</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Upload photos of your equipment to help better analyze the building's energy usage.
        </p>
        <Button
          onClick={onUploadPhotos}
          variant="outline"
          size="sm"
          className="mt-3"
        >
          <Camera className="w-4 h-4 mr-2" />
          Upload Photos
        </Button>
      </div>
    </div>
  </div>
);

// Update Actions component
const Actions = ({
  onAddNotes,
  onAddPhotos,
  hasFieldNotes,
  hasPhotos
}: {
  onAddNotes: () => void;
  onAddPhotos: () => void;
  hasFieldNotes: boolean;
  hasPhotos: boolean;
}) => (
  <div className="flex gap-2 flex-wrap">

  </div>
);

// Define equipment categories with priority order
const EQUIPMENT_CATEGORIES = {
  HVAC: 'hvac',
  LIGHTING: 'lighting',
  VENTILATION: 'ventilation',
  DHW: 'dhw',
  WATER_FIXTURES: 'water_fixtures',
  POOL: 'pool',
  LAUNDRY: 'laundry',
  IRRIGATION: 'irrigation',
  APPLIANCE: 'appliance',
  MOTORS_PUMPS: 'motors_pumps', // 1. Define new category
  OTHER: 'other'
};

// Use the imported type definition instead of redefining
type EquipmentSpecifications = NonNullable<EquipmentItem['specifications']>;

// Helper function to safely access specifications
const getSpecificationValue = <T,>(
  specs: unknown,
  key: string,
  fallback: T
): T => {
  if (!specs || typeof specs !== 'object' || specs === null) return fallback;

  try {
    // Try to access the property
    const typedSpecs = specs as Record<string, any>;
    if (key.includes('.')) {
      // Handle nested properties like 'efficiency.cooling'
      const parts = key.split('.');
      let value: any = typedSpecs;
      for (const part of parts) {
        if (!value || typeof value !== 'object') return fallback;
        value = value[part];
      }
      return (value as unknown as T) ?? fallback;
    }

    return (typedSpecs[key] as unknown as T) ?? fallback;
  } catch (error) {
    return fallback;
  }
};

// Helper function for ReactNode safe conversion
const toReactNode = (value: unknown): React.ReactNode => {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'object') {
    return JSON.stringify(value).slice(0, 50) + (JSON.stringify(value).length > 50 ? '...' : '');
  }
  return String(value);
};

// Helper function to safely access nested objects like location
const getLocationValue = (
  location: unknown,
  key: keyof Location,
  fallback: string = '-'
): string => {
  if (!location) return fallback;
  if (typeof location === 'string') return location;
  if (typeof location === 'object' && location !== null) {
    // Handle the case where location is an object, but might not have the expected shape
    try {
      const typedLocation = location as Location;
      return (typedLocation[key] as unknown as string) || fallback;
    } catch (error) {
      return fallback;
    }
  }
  return fallback;
};

// Helper function to clean display values
const cleanDisplayValue = (value: string | undefined | null): string => {
  if (!value) return '';
  return value === 'N/A' ? '' : value;
};

// Add CategorySection component
interface CategorySectionProps {
  title: string;
  count: number;
  icon: React.ReactNode;
  children: React.ReactNode;
}

const CategorySection = ({
  title,
  count,
  icon,
  children
}: CategorySectionProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border rounded-lg mb-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/50"
      >
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-lg font-semibold">{title}</h3>
          <Badge variant="secondary">{count}</Badge>
        </div>
        <ChevronDown
          className={`w-5 h-5 transition-transform ${isExpanded ? 'transform rotate-180' : ''}`}
        />
      </button>
      {isExpanded && (
        <div className="p-4 border-t">
          {children}
        </div>
      )}
    </div>
  );
};

// Add helper functions
const getCategoryIcon = (category: string): React.ReactNode => {
  const iconMap: Record<string, React.ReactNode> = {
    [EQUIPMENT_CATEGORIES.HVAC]: <Thermometer className="w-5 h-5" />,
    [EQUIPMENT_CATEGORIES.LIGHTING]: <Lightbulb className="w-5 h-5" />,
    [EQUIPMENT_CATEGORIES.DHW]: <Zap className="w-5 h-5" />,
    [EQUIPMENT_CATEGORIES.WATER_FIXTURES]: <Droplet className="w-5 h-5" />,
    [EQUIPMENT_CATEGORIES.POOL]: <Waves className="w-5 h-5" />,
    [EQUIPMENT_CATEGORIES.LAUNDRY]: <Shirt className="w-5 h-5" />,
    [EQUIPMENT_CATEGORIES.IRRIGATION]: <Sprout className="w-5 h-5" />,
    [EQUIPMENT_CATEGORIES.APPLIANCE]: <Utensils className="w-5 h-5" />,
    [EQUIPMENT_CATEGORIES.MOTORS_PUMPS]: <Power className="w-5 h-5" />, // 2. Add Power icon
    [EQUIPMENT_CATEGORIES.OTHER]: <AlertCircle className="w-5 h-5" />
  };
  return iconMap[category] || <AlertCircle className="w-5 h-5" />;
};

const getCategoryTitle = (category: string): string => {
  const titleMap: Record<string, string> = {
    [EQUIPMENT_CATEGORIES.HVAC]: 'HVAC Systems',
    [EQUIPMENT_CATEGORIES.LIGHTING]: 'Lighting',
    [EQUIPMENT_CATEGORIES.DHW]: 'Domestic Hot Water',
    [EQUIPMENT_CATEGORIES.WATER_FIXTURES]: 'Water Fixtures',
    [EQUIPMENT_CATEGORIES.POOL]: 'Pool Equipment',
    [EQUIPMENT_CATEGORIES.LAUNDRY]: 'Laundry',
    [EQUIPMENT_CATEGORIES.IRRIGATION]: 'Irrigation',
    [EQUIPMENT_CATEGORIES.APPLIANCE]: 'Appliances',
    [EQUIPMENT_CATEGORIES.MOTORS_PUMPS]: 'Motors & Pumps', // 3. Add Motors & Pumps title
    [EQUIPMENT_CATEGORIES.OTHER]: 'Other Equipment'
  };
  return titleMap[category] || 'Other Equipment';
};

interface LightingSpecifications {
  phase?: string;
  voltage?: string;
  capacity?: string;
  efficiency?: {
    cooling?: string;
    heating?: string;
  };
  refrigerantType?: string;
  lampType?: string;
  wattage?: number;
  weeklyHours?: number;
  flowRate?: number;
  flowRateGpm?: number;
  fuelType?: string;
  lampsPerFixture?: number;
  control?: string;
  mountingType?: string;
  lumens?: number;
  colorTemperature?: number;
  lightingType?: string;
}

// Add these constants and types before the component
const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6'];

// We'll need to pass the components to the tooltip
const CustomTooltip = ({ active, payload, components }: any) => {
  if (active && payload && payload.length) {
    // Find the component with deviation explanation
    const name = payload[0].name;
    const component = components?.find(c => c.name === name);

    return (
      <div className="bg-background border border-border p-3 rounded-md shadow-md max-w-xs">
        <p className="font-medium capitalize">{name}</p>
        <p className="text-sm mb-1">{`${payload[0].value.toLocaleString()} kBTU (${payload[0].payload.percentage}%)`}</p>
        {payload[0].payload.originalKwh > 0 && (
          <p className="text-xs text-muted-foreground">{Math.round(payload[0].payload.originalKwh).toLocaleString()} kWh electric</p>
        )}

        {component?.standardPercent && (
          <p className="text-xs text-blue-600 mt-1">Standard: {component.standardPercent}%</p>
        )}

        {component?.deviationExplanation && (
          <div className="mt-2 pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground">{component.deviationExplanation}</p>
          </div>
        )}
      </div>
    );
  }
  return null;
};

// Add this function before the component
const calculateEnergyBreakdown = (equipment: EquipmentItem[]) => {
  const breakdown: Record<string, number> = {};

  // Log the equipment data for debugging
  console.log('Calculating energy breakdown from equipment:', equipment);

  equipment.forEach(item => {
    // Skip items with no annual energy usage
    if (!item.annual_kwh) {
      console.log(`Skipping item with no energy usage: ${item.equipment_type}`);
      return;
    }

    // Convert annual_kwh to number if it's a string
    const annualKwh = typeof item.annual_kwh === 'string' ?
      parseFloat(item.annual_kwh) : (item.annual_kwh || 0);

    // Skip items with zero energy usage
    if (annualKwh <= 0) {
      console.log(`Skipping item with zero energy usage: ${item.equipment_type}`);
      return;
    }

    // Prioritize end_use_category over regular category
    // This is critical for proper categorization
    let category = item.end_use_category || '';

    console.log(`Processing item: ${item.equipment_type}, end_use_category: ${item.end_use_category}, category: ${item.category}`);

    // If end_use_category is not available, fall back to regular category
    if (!category) {
      category = item.category || 'Other';
      console.log(`No end_use_category, using category: ${category}`);
    }

    // If we still don't have a valid category, try to determine it from equipment_type
    if (category === 'Unknown' || !category) {
      const equipType = (item.equipment_type || '').toLowerCase();

      if (equipType.includes('light')) {
        category = 'Lighting';
      } else if (equipType.includes('heat') || equipType.includes('furnace')) {
        category = 'Heating';
      } else if (equipType.includes('cool') || equipType.includes('ac')) {
        category = 'Cooling';
      } else if (equipType.includes('water heater') || equipType.includes('dhw')) {
        category = 'Water Heating';
      } else if (equipType.includes('fan') || equipType.includes('vent')) {
        category = 'Ventilation';
      } else if (equipType.includes('pump')) {
        category = 'Water Pumps';
      } else if (equipType.includes('refrigerator')) {
        category = 'Refrigeration';
      } else if (equipType.includes('washer') || equipType.includes('dishwasher') ||
                equipType.includes('stove') || equipType.includes('oven')) {
        category = 'Cooking';
      } else {
        category = 'Miscellaneous';
      }

      console.log(`Inferred category from equipment type: ${category}`);
    }

    // Standardize the category name using the helper function defined earlier
    const lowerCategory = category.toLowerCase();
    const categoryMap: Record<string, string> = {
      'hvac': 'HVAC',
      'cooling': 'Cooling',
      'heating': 'Heating',
      'lighting': 'Lighting',
      'dhw': 'Water Heating',
      'hot water': 'Water Heating',
      'water heating': 'Water Heating',
      'ventilation': 'Ventilation',
      'pumps': 'Water Pumps',
      'water pumps': 'Water Pumps',
      'refrigeration': 'Refrigeration',
      'cooking': 'Cooking',
      'office equipment': 'Office Equipment',
      'miscellaneous': 'Miscellaneous'
    };

    category = categoryMap[lowerCategory] || category;
    console.log(`Standardized category: ${category}`);

    // Initialize category in breakdown if not exists
    if (!breakdown[category]) {
      breakdown[category] = 0;
    }

    // Add the energy usage to the category
    breakdown[category] += annualKwh;
    console.log(`Added ${annualKwh} kWh to ${category}, new total: ${breakdown[category]}`);
  });

  console.log('Final energy breakdown:', breakdown);
  return breakdown;
};

// Helper function to determine the final displayed lamp type string
const determineLampType = (item: EquipmentItem): string => {
  let lampType: string | undefined = undefined;
  const value = item.lamp_type; // Access lamp_type directly from item

  // Check equipment_type for HPS first
  if (item.equipment_type) {
    const equipTypeCleaned = (item.equipment_type || '').trim().toLowerCase();
    if (equipTypeCleaned.indexOf('hps') !== -1 || equipTypeCleaned.indexOf('high pressure sodium') !== -1) {
      lampType = 'HPS';
    }
  }

  // Check lamp_type from database field if lampType isn't already set
  if (!lampType && value) {
    lampType = value;
  }

  // Fallback 1: Check specifications object if lampType isn't already set
  if (!lampType && item.specifications?.lampType) {
    lampType = item.specifications.lampType;
  }

  // Fallback 2: Parse from Equipment Type string for *other* types if lampType isn't already set
  if (!lampType && item.equipment_type) {
    const equipTypeCleaned = (item.equipment_type || '').trim().toLowerCase();
    // Check other keywords (excluding HPS check which was done above)
    if (equipTypeCleaned.indexOf('led') !== -1) {
      lampType = 'LED';
    } else if (equipTypeCleaned.indexOf('t8 fluorescent') !== -1 || equipTypeCleaned.indexOf('fluorescent t8') !== -1) {
      lampType = 'T8 Fluorescent';
    } else if (equipTypeCleaned.indexOf('t5 fluorescent') !== -1 || equipTypeCleaned.indexOf('fluorescent t5') !== -1) {
      lampType = 'T5 Fluorescent';
    } else if (equipTypeCleaned.indexOf('cfl') !== -1 || equipTypeCleaned.indexOf('compact fluorescent') !== -1) {
      lampType = 'CFL';
    } else if (equipTypeCleaned.indexOf('incandescent') !== -1) {
      lampType = 'Incandescent';
    } else if (equipTypeCleaned.indexOf('halogen') !== -1) {
      lampType = 'Halogen';
    } else if (equipTypeCleaned.indexOf('metal halide') !== -1) {
      lampType = 'Metal Halide';
    } else if (equipTypeCleaned.indexOf('hid') !== -1) {
      lampType = 'HID';
    } else if (equipTypeCleaned.indexOf('fluorescent') !== -1) {
       lampType = 'Fluorescent';
    }
  }

  // Fallback 3: Guess based on wattage range if lampType isn't already set
  if (!lampType && item.wattage) {
    const wattage = Number(item.wattage);
    if (wattage >= 8 && wattage <= 12) {
      lampType = 'LED';
    } else if (wattage >= 30 && wattage <= 34) {
      lampType = 'T8 Fluorescent';
    } else if (wattage >= 13 && wattage <= 15) {
      lampType = 'CFL';
    } else if (wattage >= 23 && wattage <= 27) {
      lampType = 'CFL';
    }
  }

  // Return the determined type or "Unknown"
  return lampType ? lampType : 'Unknown';
};

export const Equipment: React.FC<EquipmentProps> = ({
  projectId: propProjectId,
  equipment: initialEquipment = [],
  project,
  publicView
}) => {
  const { projectId: routeProjectId } = useParams<{ projectId: string }>();
  const projectId = propProjectId || routeProjectId;

  // State
  const [equipment, setEquipment] = useState<EquipmentItem[]>(initialEquipment);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forceUpdate, setForceUpdate] = useState(false);
  const [showFieldNotesDialog, setShowFieldNotesDialog] = useState(false);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [showEnergyBreakdown, setShowEnergyBreakdown] = useState(false);
  const [actualElectricUsage, setActualElectricUsage] = useState<number | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<EquipmentItem | null>(null);
  const [projectDetails, setProjectDetails] = useState<{ total_units?: number, building_type?: string }>({});
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<EquipmentItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showRawNotes, setShowRawNotes] = useState(false);
  const [isEnriching, setIsEnriching] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [showPhotoViewer, setShowPhotoViewer] = useState(false);
  const [energyBreakdown, setEnergyBreakdown] = useState<EnergyBreakdown | null>(null);
  const [loadingBreakdown, setLoadingBreakdown] = useState(false);
  // Add state for actual gas usage
  const [actualGasUsage, setActualGasUsage] = useState<number | null>(null);

  const isApartmentEquipment = (item: EquipmentItem): boolean => item.is_per_unit === true;

  // Column helper
  const columnHelper = createColumnHelper<EquipmentItem>();

  // Add photo viewer column definition
  const photoViewerColumn = columnHelper.accessor('photo_url', {
    header: 'Photos',
    cell: info => {
      const photoUrl = info.getValue();
      if (!photoUrl) return null;
      return (
        <div
          className="cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => {
            setSelectedPhoto(photoUrl);
            setShowPhotoViewer(true);
          }}
        >
          <img
            src={photoUrl}
            alt="Equipment"
            className="w-12 h-12 object-cover rounded-md"
          />
        </div>
      );
    },
  });

  // Replace all individual equipment filter functions with a prioritized categorization system
  const categorizedEquipment = useMemo(() => {
    // 1. Filter out invalid items for public view
    const filteredEquipment = equipment.filter(item => {
      if (!publicView) return true; // Show everything if not public view

      const typeLower = (item.equipment_type || '').toLowerCase();
      const categoryLower = (item.category || '').toLowerCase();
      const invalidKeywords = ['string', 'unknown', 'n/a', 'tool', 'control', 'meter', 'instrument'];
      const componentKeywords = ['door', 'lock', 'blind', 'screen', 'pipe', 'vent pipe', 'mailbox']; // Removed 'window' from here
      
      // Special check for air conditioners that have "window" in their name
      const isWindowAC = typeLower.includes('window') && typeLower.includes('air conditioner');
      
      const isInvalid = invalidKeywords.some(kw => typeLower.includes(kw) || categoryLower.includes(kw)) ||
                       (componentKeywords.some(kw => typeLower.includes(kw)) && !isWindowAC);

      // Also filter items with 0 annual kWh unless it's a water fixture
      const isZeroEnergy = !item.annual_kwh || parseFloat(item.annual_kwh.toString()) === 0;
      const isWaterFixture = categoryLower.includes('water fixture');

      return !isInvalid && (!isZeroEnergy || isWaterFixture);
    });

    // Initialize with empty arrays for each category
    const result: Record<string, EquipmentItem[]> = {
      [EQUIPMENT_CATEGORIES.HVAC]: [],
      [EQUIPMENT_CATEGORIES.LIGHTING]: [],
      [EQUIPMENT_CATEGORIES.VENTILATION]: [],
      [EQUIPMENT_CATEGORIES.DHW]: [],
      [EQUIPMENT_CATEGORIES.WATER_FIXTURES]: [],
      [EQUIPMENT_CATEGORIES.POOL]: [],
      [EQUIPMENT_CATEGORIES.LAUNDRY]: [],
      [EQUIPMENT_CATEGORIES.IRRIGATION]: [],
      [EQUIPMENT_CATEGORIES.APPLIANCE]: [],
      [EQUIPMENT_CATEGORIES.MOTORS_PUMPS]: [],
      [EQUIPMENT_CATEGORIES.OTHER]: [],
    };

    // 2. Process the *filtered* equipment item and place it in exactly one category
    filteredEquipment.forEach(item => {
      const type = (item.equipment_type || item.type || '').toLowerCase();
      const category = (item.category || '').toLowerCase();
      const endUseCategory = (item.end_use_category || '').toLowerCase();

      // ... (Keep Water Fixture check as highest priority) ...
      if (type.includes('faucet') ||
          type.includes('shower') ||
          type.includes('showerhead') ||
          type.includes('toilet') ||
          type.includes('urinal') ||
          type.includes('lavatory') ||
          type.includes('sink') ||
          type.includes('pre-rinse') ||
          type.includes('pre rinse') ||
          type.includes('spray valve') ||
          type.includes('water fixture')) {
        result[EQUIPMENT_CATEGORIES.WATER_FIXTURES].push(item);
        return;
      }
      if (category === 'water fixtures' || category === 'water fixture' ||
          category === 'plumbing fixtures' || category === 'plumbing fixture') {
         result[EQUIPMENT_CATEGORIES.WATER_FIXTURES].push(item);
         return;
      }

      // ... (Keep end_use_category checks) ...
      if (endUseCategory === 'lighting') { /* ... */ }
      else if (endUseCategory === 'water heating' || endUseCategory === 'dhw') { /* ... */ }
      else if (endUseCategory === 'water fixtures' || endUseCategory === 'plumbing fixtures') { /* ... */}
      else if (endUseCategory === 'ventilation') { /* ... */ }
      else if (endUseCategory === 'hvac' || endUseCategory === 'cooling' || endUseCategory === 'heating') { /* ... */ }
      else if (endUseCategory === 'motors/pumps' || endUseCategory === 'water pumps') { /* ... */ }
      // Add checks for Appliance/Laundry based on end_use_category if available
       else if (endUseCategory === 'cooking' || endUseCategory === 'refrigeration') {
         result[EQUIPMENT_CATEGORIES.APPLIANCE].push(item); return;
       } else if (endUseCategory === 'laundry') {
          result[EQUIPMENT_CATEGORIES.LAUNDRY].push(item); return;
       }

      // Fallback checks based on type/category
      if ( // Ventilation Check
        type.includes('ventilation') ||
        type.includes('exhaust fan') ||
        type.includes('ventilator') ||
        type.includes('air handler') ||
        type.includes('erv') ||
        type.includes('hrv') ||
        type.includes('ceiling fan') ||
        (type.includes('fan') && !type.includes('ceiling fan'))
      ) {
        result[EQUIPMENT_CATEGORIES.VENTILATION].push(item);
      } else if ( // HVAC Check - Add AC types
        category.includes('hvac') ||
        type.includes('cool') ||
        type.includes('hvac') ||
        type.includes('furnace') ||
        type.includes('air conditioner') || // Catch all AC types
        type.includes(' ac') || // Catch short AC variations
        (type.includes('heat') && !type.includes('water heat')) ||
        type.includes('split system')
      ) {
        result[EQUIPMENT_CATEGORIES.HVAC].push(item);
      } else if ( // Lighting Check
        category.includes('lighting') ||
        type.includes('light') ||
        type.includes('lamp') ||
        type.includes('fixture') ||
        type.includes('led') ||
        type.includes('fluorescent') ||
        type.includes('sconce') ||
        type.includes('wall pack')
      ) {
        result[EQUIPMENT_CATEGORIES.LIGHTING].push(item);
      } else if ( // DHW Check - Add Storage Tank
        category.includes('dhw') ||
        type.includes('water heat') ||
        type.includes('dhw') ||
        type.includes('hot water') ||
        type.includes('storage tank') || // Add storage tank
        (type.includes('boiler') && (item.serves || '').toLowerCase().includes('hot water'))
      ) {
        result[EQUIPMENT_CATEGORIES.DHW].push(item);
      } else if ( // Motors/Pumps Check
        category.includes('mechanical system') ||
        type.includes('pump')
      ) {
         result[EQUIPMENT_CATEGORIES.MOTORS_PUMPS].push(item);
      } else if ( // Pool Check
        category.includes('pool') ||
        type.includes('pool') ||
        type.includes('filter') ||
        type.includes('pump')
      ) {
        result[EQUIPMENT_CATEGORIES.POOL].push(item);
      } else if ( // Laundry Check - Add Washing Machine
        category.includes('laundry') ||
        type.includes('washer') || // Includes washing machine
        type.includes('washing machine') || // Explicitly add washing machine
        type.includes('dryer')
      ) {
        result[EQUIPMENT_CATEGORIES.LAUNDRY].push(item);
      } else if ( // Irrigation Check
       category.includes('irrigation') ||
       type.includes('sprinkler') ||
       type.includes('drip') ||
       type.includes('irrigation')
      ) {
        result[EQUIPMENT_CATEGORIES.IRRIGATION].push(item);
      } else if ( // Appliance Check - Add Microwave, TV
        category.includes('appliance') ||
        type.includes('refrigerator') ||
        type.includes('freezer') ||
        type.includes('stove') ||
        type.includes('oven') ||
        type.includes('dishwasher') ||
        type.includes('microwave') || // Add microwave
        type.includes('television') // Add television
      ) {
        result[EQUIPMENT_CATEGORIES.APPLIANCE].push(item);
      }
      // Other category as catch-all
      else {
        // Log items falling into 'Other' for debugging
        console.log('Item falling into OTHER:', item);
        result[EQUIPMENT_CATEGORIES.OTHER].push(item);
      }
    });

    return result;
  }, [equipment, publicView]); // Add publicView dependency

  // Replace individual category variables with references to the categorized object
  const hvacEquipment = categorizedEquipment[EQUIPMENT_CATEGORIES.HVAC];
  const lightingEquipment = categorizedEquipment[EQUIPMENT_CATEGORIES.LIGHTING];
  const ventilationEquipment = categorizedEquipment[EQUIPMENT_CATEGORIES.VENTILATION];
  const dhwEquipment = categorizedEquipment[EQUIPMENT_CATEGORIES.DHW];
  const waterFixturesEquipment = categorizedEquipment[EQUIPMENT_CATEGORIES.WATER_FIXTURES];
  const poolEquipment = categorizedEquipment[EQUIPMENT_CATEGORIES.POOL];
  const laundryEquipment = categorizedEquipment[EQUIPMENT_CATEGORIES.LAUNDRY];
  const irrigationEquipment = categorizedEquipment[EQUIPMENT_CATEGORIES.IRRIGATION];
  const applianceEquipment = categorizedEquipment[EQUIPMENT_CATEGORIES.APPLIANCE];
  const motorsPumpsEquipment = categorizedEquipment[EQUIPMENT_CATEGORIES.MOTORS_PUMPS]; // Define variable for new category
  const otherEquipment = categorizedEquipment[EQUIPMENT_CATEGORIES.OTHER];

  // Add a function to count total displayed equipment
  const totalDisplayedEquipment = useMemo(() => {
    return Object.values(categorizedEquipment).reduce((sum, items) => sum + items.length, 0);
  }, [categorizedEquipment]);

  // Fetch equipment data
  const fetchEquipmentData = useCallback(async () => {
    console.log('Fetching equipment data for project:', projectId);
    try {
      if (!projectId) {
        throw new Error('Project ID is required');
      }

      // Fetch equipment data from the API
      const equipmentData = await equipmentV2Service.getAllEquipment(projectId);
      console.log('Raw API Response:', JSON.stringify(equipmentData[0], null, 2));

      if (Array.isArray(equipmentData)) {
        // Sort equipment by source type (field notes first), then category and type
        const sortedData = [...equipmentData].sort((a, b) => {
          // First sort by source type (field notes first)
          if (a.source_type === 'field_notes' && b.source_type !== 'field_notes') return -1;
          if (a.source_type !== 'field_notes' && b.source_type === 'field_notes') return 1;

          // Then sort by category
          const categoryCompare = (a.category || '').localeCompare(b.category || '');
          if (categoryCompare !== 0) return categoryCompare;

          // Finally sort by equipment type
          return (a.equipment_type || '').localeCompare(b.equipment_type || '');
        });

        // Set the sorted data directly
        setEquipment(sortedData);
      } else {
        console.warn('Equipment data is not an array:', equipmentData);
        setEquipment([]);
      }
    } catch (error: any) {
      console.error('Error fetching equipment data:', error);
      setError(error.message || 'Failed to fetch equipment data');
      setEquipment([]);
    }
  }, [projectId]);

  // Add handler for field notes processing success
  const handleFieldNotesSuccess = useCallback(async () => {
    setShowFieldNotesDialog(false);
    await fetchEquipmentData();
    toast({
      description: "Field notes processed successfully. Equipment list updated.",
    });
  }, [fetchEquipmentData]);

  // Add handler for regenerating comprehensive energy breakdown
  const handleComprehensiveEnergyBreakdown = useCallback(async () => {
    if (!projectId) return;

    setLoading(true);
    try {
      console.log('Generating baseline energy breakdown for project:', projectId);
      const response = await apiClient.post<EnergyBreakdown>(`/field-notes/${projectId}/baseline-energy-breakdown`);
      console.log('Baseline energy breakdown response:', response);

      if (response && response.endUseComponents && response.endUseComponents.length > 0) {
        setEnergyBreakdown(response);
        setForceUpdate(prev => !prev); // Toggle to force re-render
        toast({
          description: "Energy breakdown regenerated successfully.",
        });
      } else {
        throw new Error('Invalid energy breakdown response');
      }
    } catch (error) {
      console.error('Error generating baseline energy breakdown:', error);
      toast({
        variant: "destructive",
        description: "Failed to regenerate energy breakdown. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // Add handler for viewing energy breakdown details
  const handleViewEnergyBreakdown = useCallback(() => {
    if (energyBreakdown) {
      setShowEnergyBreakdown(true);
    } else {
      toast({
        variant: "destructive",
        description: "No energy breakdown data available.",
      });
    }
  }, [energyBreakdown]);

  // Fetch actual utility data
  const fetchActualUtilityData = useCallback(async () => {
    try {
      if (projectId) {
        const usageData = await fetchTotalUtilityUsage(projectId);
        // Set both electric and gas usage
        if (usageData) {
          setActualElectricUsage(usageData.totalElectric ?? null);
          setActualGasUsage(usageData.naturalGasUsage ?? null); // Use naturalGasUsage from the service
          console.log('Fetched Actual Utility Data:', usageData); // Log fetched data
        }
      }
    } catch (error) {
      console.error('Failed to load utility data:', error);
      // Don't clear usage on error, keep previous values if any
    }
  }, [projectId]);

  // Fetch project details to get total units
  const fetchProjectDetails = useCallback(async () => {
    try {
      if (!projectId) return;

      const response = await apiClient.get(`projects/${projectId}`) as { data: any };
      const projectData = response.data;

      if (projectData) {
        const buildingType = projectData.building_info?.building_type ||
                      projectData.building_type || '';
        console.log('Building type detected:', buildingType);
        setProjectDetails({
          total_units: projectData.building_info?.total_units ||
                      projectData.total_units || 1,
          building_type: buildingType
        });
      }
    } catch (error) {
      console.error('Failed to load project details:', error);
    }
  }, [projectId]);

  // Add function to fetch energy breakdown
  const fetchEnergyBreakdown = useCallback(async () => {
    if (!projectId) return;

    setLoadingBreakdown(true);
    try {
      console.log('Fetching energy breakdown for project:', projectId);
      const breakdown = await fieldNotesService.getEnergyBreakdown(projectId);
      console.log('Energy breakdown response:', breakdown);
      if (breakdown) {
        setEnergyBreakdown(breakdown);
      } else {
        console.log('No energy breakdown data available');
      }
    } catch (error) {
      console.error('Error fetching energy breakdown:', error);
    } finally {
      setLoadingBreakdown(false);
    }
  }, [projectId]);

  // Update useEffect to fetch energy breakdown
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        await Promise.all([
          fetchEquipmentData(),
          fetchActualUtilityData(),
          fetchProjectDetails(),
          fetchEnergyBreakdown(),
        ]);
      } catch (error: any) {
        console.error('Error initializing data:', error);
        setError(error.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [fetchEquipmentData, fetchActualUtilityData, fetchProjectDetails, fetchEnergyBreakdown]);

  // Add useEffect to log equipment state after update
  useEffect(() => {
    if (equipment.length > 0) {
      console.log("Equipment state updated. Checking specific items:");
      const itemToCheck1 = equipment.find(item => item.id === '48225c31-48c8-4726-8ca0-3b29b4a90d99'); // Gas Water Heater
      const itemToCheck2 = equipment.find(item => item.id === 'a01620bb-2b0d-4e06-9dbb-6c0a3301ead3'); // Storage Tank Water Heater
      console.log("Gas Water Heater (4822...):", itemToCheck1 ? `annual_therms: ${itemToCheck1.annual_therms}` : 'Not found');
      console.log("Storage Tank WH (a016...):", itemToCheck2 ? `annual_therms: ${itemToCheck2.annual_therms}` : 'Not found');
      // You can add more items here if needed
    }
  }, [equipment]); // Run this effect whenever the equipment state changes

  // Event handler for editing equipment
  const handleEditEquipment = (item: EquipmentItem) => {
    console.log('hvacEquipment', hvacEquipment);
    setItemToEdit(item);
    setShowEditModal(true);
  };

  // Event handler for initiating equipment deletion
  const handleDeleteConfirmation = (item: EquipmentItem) => {
    setItemToDelete(item);
    setShowDeleteConfirmation(true);
  };

  // Function to handle equipment deletion
  const handleDeleteEquipment = async () => {
    if (!itemToDelete || !itemToDelete.id) {
      toast({
        variant: "destructive",
        description: "No item selected for deletion",
      });
      return;
    }

    setIsDeleting(true);

    try {
      const result = await equipmentV2Service.deleteEquipment(itemToDelete.id.toString());

      if (result && result.success) {
        // Remove the deleted item from the equipment array
        setEquipment(prevEquipment =>
          prevEquipment.filter(item => item.id !== itemToDelete.id)
        );

        toast({
          description: "Equipment deleted successfully",
        });
      } else {
        throw new Error("Failed to delete equipment");
      }
    } catch (error) {
      console.error("Error deleting equipment:", error);
      toast({
        variant: "destructive",
        description: "Failed to delete equipment. Please try again.",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirmation(false);
      setItemToDelete(null);
    }
  };

  // Function to handle equipment updates
  const handleEquipmentUpdated = async () => {
    // Keep reference to existing equipment order
    const currentIds = equipment.map(item => item.id);

    try {
      // Fetch updated equipment data
      await fetchEquipmentData();

      // Also refresh the energy breakdown data to update category totals
      await fetchEnergyBreakdown();

      // Re-order equipment to match original order
      if (currentIds.length > 0) {
        setEquipment(prev => {
          // Create a map for faster lookups
          const itemMap = new Map(prev.map(item => [item.id, item]));

          // Reconstruct array in original order, with updated items
          const ordered = currentIds
            .map(id => itemMap.get(id))
            .filter(Boolean) as EquipmentItem[];

          // Add any new items that weren't in the original list
          const newItems = prev.filter(item => !currentIds.includes(item.id));

          return [...ordered, ...newItems];
        });
      }

      setShowEditModal(false);
      setItemToEdit(null);
      toast({
        description: 'Equipment updated successfully!',
      });
    } catch (error) {
      console.error('Error updating equipment data:', error);
      toast({
        variant: 'destructive',
        description: 'Failed to update equipment data. Please try again.',
      });
    }
  };

  // Get color for category
  const getCategoryColor = (category: string): string => {
    const categoryMap: Record<string, string> = {
      'Lighting': 'border-l-4 border-l-amber-500 bg-amber-950/10',
      'HVAC': 'border-l-4 border-l-sky-500 bg-sky-950/10',
      'DHW': 'border-l-4 border-l-rose-500 bg-rose-950/10',
      'Laundry': 'border-l-4 border-l-emerald-500 bg-emerald-950/10',
      'Kitchen': 'border-l-4 border-l-purple-500 bg-purple-950/10',
      'Electronics': 'border-l-4 border-l-blue-500 bg-blue-950/10',
      'Appliance': 'border-l-4 border-l-indigo-500 bg-indigo-950/10',
      'Motors': 'border-l-4 border-l-orange-500 bg-orange-950/10',
      'Pumps': 'border-l-4 border-l-green-500 bg-green-950/10',
      'Water Fixture': 'border-l-4 border-l-cyan-500 bg-cyan-950/10',
      'Pool Equipment': 'border-l-4 border-l-blue-500 bg-blue-950/10',
      'Other': 'border-l-4 border-l-gray-500 bg-gray-500/10'
    };

    return categoryMap[category] || 'border-l-4 border-l-gray-500 bg-gray-500/5';
  };

  const getVarianceColor = (actualUsage: number, estimatedUsage: number) => {
    const difference = Math.abs((actualUsage - estimatedUsage) / actualUsage * 100);
    if (difference <= 10) return 'text-emerald-500'; // Within 10%
    if (difference <= 25) return 'text-yellow-500'; // Within 25%
    return 'text-red-500'; // More than 25% off
  };

  // Add these handlers
  const handleAddFieldNotes = () => {
    setShowFieldNotesDialog(true);
  };

  const handleUploadPhotos = () => {
    setShowPhotoUpload(true);
  };

  // handleViewEnergyBreakdown is defined as a useCallback above

  // Add handler for enrichment
  const handleEnrichEquipment = async () => {
    try {
      if (!projectId) {
        throw new Error('Project ID is required');
      }

      setIsEnriching(true);
      interface EnrichmentResponse {
        success: boolean;
        message?: string;
        data?: any;
      }

      const response = await apiClient.post<EnrichmentResponse>(`equipment/enrich`, { projectId });

      if (response.success) {
        toast({
          description: response.message || "Equipment data enriched successfully",
        });
        await fetchEquipmentData();
      } else {
        throw new Error(response.message || "Failed to enrich equipment data");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        description: error.message || "Failed to enrich equipment data",
      });
    } finally {
      setIsEnriching(false);
    }
  };

  // This function has been moved to a useCallback above

  const handlePhotoUploadSuccess = async () => {
    setShowPhotoUpload(false);
    await fetchEquipmentData();
  };

  // Define HVAC-specific columns
  const hvacColumns: ColumnDef<EquipmentItem>[] = [
    {
      header: 'Equipment Type',
      accessorKey: 'equipment_type',
      cell: (info) => {
        const value = info.getValue() as string | undefined;
        return (
          <span>
            {value || <span className="text-amber-600 italic">Unknown</span>}
          </span>
        );
      }
    },
    {
      header: '# of Units',
      accessorKey: 'quantity',
      cell: (info) => {
        const value = Number(info.getValue());
        return (
          <span className={value === 0 ? 'text-yellow-500 font-medium' : ''}>
            {value}
          </span>
        );
      }
    },
    {
      header: 'Location',
      accessorKey: 'location',
      cell: (info) => {
        const location = info.getValue() as string | { room?: string };
        const displayLocation = typeof location === 'string' ? location : location?.room;
        // Display 'Not Specified' if the location is null, undefined, empty, or the literal string "Unknown"
        return (displayLocation && displayLocation.toLowerCase() !== 'unknown') ? displayLocation : 'Not Specified';
      }
    },
    {
      header: 'Wattage',
      accessorKey: 'wattage',
      cell: (info) => {
        const value = info.getValue() as number | undefined;
        return (
          <span>
            {value ? `${value}W` : '-'}
          </span>
        );
      }
    },
    {
      header: 'Weekly Hours',
      accessorKey: 'weekly_hours',
      cell: (info) => {
        const value = info.getValue() as number | undefined;
        return (
          <span>
            {value ? Math.round(value) : '-'}
          </span>
        );
      }
    },
    {
      header: 'Annual kWh',
      accessorKey: 'annual_kwh',
      cell: (info) => {
        const value = info.getValue() as number | undefined;
        const item = info.row.original;

        // Get the values needed for the calculation
        const wattage = Number(item.wattage || 0);
        const quantity = Number(item.quantity || 1);
        const weeklyHours = Number(item.weekly_hours || 0);

        // Calculate annual kWh if not provided
        const annualKwh = value || (wattage * quantity * weeklyHours * 52) / 1000;

        // Create the formula string for the tooltip
        const formula = `(${quantity} units × ${wattage}W × ${Math.round(weeklyHours)} hrs/week × 52 weeks) ÷ 1000 = ${Math.round(annualKwh)} kWh/year`;

        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className={annualKwh === 0 ? 'text-yellow-500 font-medium' : ''}>
                  {Math.round(annualKwh).toLocaleString()}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-sm">
                  <div className="font-medium">Annual kWh Calculation:</div>
                  <div>{formula}</div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      }
    },
    {
      header: 'Cooling Capacity (Ton)',
      accessorKey: 'cooling_capacity_tons',
      cell: (info) => {
        const value = info.getValue() as number | undefined;
        return (
          <span>
            {value || '-'}
          </span>
        );
      }
    },
    {
      header: 'Heating Capacity (MBH)',
      accessorKey: 'heating_capacity_mbh',
      cell: (info) => {
        const value = info.getValue() as number | undefined;
        return (
          <span>
            {value || '-'}
          </span>
        );
      }
    },
    {
      header: 'Fuel Type',
      accessorKey: 'fuel_type',
      cell: (info) => {
        const value = info.getValue() as string | undefined;
        return (
          <span>
            {value || '-'}
          </span>
        );
      }
    },
    {
      header: 'Serves',
      accessorKey: 'serves',
      cell: (info) => {
        const value = info.getValue() as string | undefined;
        return (
          <span>
            {value || '-'}
          </span>
        );
      }
    },
    {
      header: 'Actions',
      accessorKey: 'id',
      cell: (info) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleEditEquipment(info.row.original)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDeleteConfirmation(info.row.original)}
            className="text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  // Define lighting-specific columns
  // Define columns that are specific to lighting equipment
  const lightingSpecificColumns: ColumnDef<EquipmentItem>[] = [
    {
      header: '# Lamp/Fixture',
      accessorKey: 'lamps_per_fixture',
      cell: (info) => {
        const value = info.getValue();
        return (
          <span>
            {value !== undefined ? Number(value) : <span className="text-amber-600 italic">1</span>}
          </span>
        );
      }
    },
    {
      header: 'Tot # Lamps',
      accessorKey: 'number_of_lamps',
      cell: (info) => {
        const value = info.getValue() as number | undefined;
        const item = info.row.original;

        // If number_of_lamps is available in the database, use it
        // Otherwise calculate it from quantity and lamps_per_fixture
        const quantity = Number(item.quantity || 1);
        const lampsPerFixture = Number(item.lamps_per_fixture || 1);
        const calculatedValue = quantity * lampsPerFixture;

        return (
          <span>
            {value !== undefined && value > 0 ? value : calculatedValue}
          </span>
        );
      }
    },
    {
      header: 'Lamp Type',
      accessorKey: 'lamp_type', // Still access the raw key if needed elsewhere
      cell: (info) => {
        // Use the helper function to determine the displayed value
        const displayLampType = determineLampType(info.row.original);
        return (
          <span>
            {displayLampType === 'Unknown' ? (
              <span className="text-amber-600 italic">Unknown</span>
            ) : (
              displayLampType
            )}
          </span>
        );
      }
    },
  ];

  // Define the base columns that are common to all equipment types
  const equipmentColumns: ColumnDef<EquipmentItem>[] = [
    {
      header: 'Location',
      accessorKey: 'location',
      cell: (info) => {
        const location = info.getValue() as string | { room?: string };
        const displayLocation = typeof location === 'string' ? location : location?.room;
        // Display 'Not Specified' if the location is null, undefined, empty, or the literal string "Unknown"
        return (displayLocation && displayLocation.toLowerCase() !== 'unknown') ? displayLocation : 'Not Specified';
      }
    },
    {
      header: 'Equipment Type',
      accessorKey: 'equipment_type',
      cell: (info) => {
        const value = info.getValue() as string | undefined;
        return (
          <span>
            {value || <span className="text-amber-600 italic">Unknown</span>}
          </span>
        );
      }
    },

    {
      header: ({ table }) => {
        // Get the first row's category to determine the header text
        const firstRow = table.getRowModel().rows[0];
        const category = firstRow?.original?.category?.toLowerCase() || '';

        // Use '# Fixtures' for lighting, 'Quantity' for everything else
        return category === 'lighting' ? '# Fixtures' : 'Quantity';
      },
      accessorKey: 'quantity',
      cell: (info) => {
        const value = Number(info.getValue());
        return (
          <span className={value === 0 ? 'text-yellow-500 font-medium' : ''}>
            {value}
          </span>
        );
      }
    },

    {
      header: ({ table }) => {
        // Get the first row's category to determine the header text
        const firstRow = table.getRowModel().rows[0];
        const category = firstRow?.original?.category?.toLowerCase() || '';

        // Use 'Lamp Watts' for lighting, 'Watts' for everything else
        return category === 'lighting' ? 'Lamp Watts' : 'Watts';
      },
      accessorKey: 'wattage',
      // Add id for reliable filtering
      id: 'wattage',
      cell: (info) => {
        const value = Number(info.getValue());
        return (
          <span className={value === 0 ? 'text-yellow-500 font-medium' : ''}>
            {value.toLocaleString()}
          </span>
        );
      }
    },
    {
      header: 'Weekly Hours',
      accessorKey: 'weekly_hours',
      // Add id for reliable filtering
      id: 'weekly_hours',
      cell: (info) => {
        const value = Number(info.getValue() || 0);
        return (
          <span className={value === 0 ? 'text-yellow-500 font-medium' : ''}>
            {value ? Math.round(value) : '-'}
          </span>
        );
      }
    },
    {
      header: 'Annual kWh',
      accessorKey: 'annual_kwh',
      // Add id for reliable filtering
      id: 'annual_kwh',
      cell: (info) => {
        const item = info.row.original;
        const category = item.category?.toLowerCase() || '';

        // Skip annual kWh calculation for laundry equipment
        if (category === 'laundry') {
          return <span className="text-amber-600 italic">N/A</span>;
        }

        // Calculate annual kWh using the formula
        const quantity = Number(item.quantity || 1);
        const wattage = Number(item.wattage || 0);
        const weeklyHours = Math.round(Number(item.weekly_hours || 0));

        // For lighting, use lamps calculation
        let totalUnits = quantity;
        let formulaPrefix = '';

        if (category === 'lighting') {
          const lampsPerFixture = Number(item.lamps_per_fixture || 1);
          totalUnits = Number(item.number_of_lamps) || (quantity * lampsPerFixture);
          formulaPrefix = `${totalUnits} lamps`;
        } else {
          formulaPrefix = `${quantity} units`;
        }

        // Calculate annual kWh
        const calculatedKwh = Math.round((totalUnits * wattage * weeklyHours * 52) / 1000);

        // Create the formula string for the tooltip
        const formula = `(${formulaPrefix} × ${wattage}W × ${weeklyHours} hrs/week × 52 weeks) ÷ 1000 = ${calculatedKwh} kWh/year`;

        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className={calculatedKwh === 0 ? 'text-yellow-500 font-medium' : ''}>
                  {calculatedKwh.toLocaleString()}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-sm">
                  <div className="font-medium">Annual kWh Calculation:</div>
                  <div>{formula}</div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      }
    },
    {
      header: 'Annual Therms',
      accessorKey: 'annual_therms',
      // Add id for reliable filtering
      id: 'annual_therms',
      cell: (info) => {
        const value = info.getValue() as number | undefined | null;
        const itemId = info.row.original.id; // Get item ID for logging
        // console.log(`Item ${itemId} - Annual Therms cell renderer received:`, value);
        // Display the value rounded or '-' if null/undefined/zero
        return (
          <span>
            {value ? Math.round(value).toLocaleString() : '-'}
          </span>
        );
      }
    },
    {
      header: 'Annual kBTU',
      id: 'annual_kbtu',
      cell: (info) => {
        const item = info.row.original;
        const annualKwh = Number(item.annual_kwh || 0);
        const annualTherms = Number(item.annual_therms || 0);

        let totalKbtu = 0;
        let tooltipContent = '';

        if (annualTherms > 0) {
          // Combined electric and gas
          const kbtuFromKwh = annualKwh * 3.412;
          const kbtuFromTherms = annualTherms * 100;
          totalKbtu = Math.round(kbtuFromKwh + kbtuFromTherms);
          tooltipContent = `(${annualKwh.toLocaleString()} kWh * 3.412) + (${annualTherms.toLocaleString()} therms * 100) = ${totalKbtu.toLocaleString()} kBTU`;
        } else if (annualKwh > 0) {
          // Electric only
          totalKbtu = Math.round(annualKwh * 3.412);
          tooltipContent = `${annualKwh.toLocaleString()} kWh * 3.412 = ${totalKbtu.toLocaleString()} kBTU`;
        } else {
          // No energy usage
          return <span>-</span>;
        }

        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>{totalKbtu.toLocaleString()}</span>
              </TooltipTrigger>
              <TooltipContent>
                <p>{tooltipContent}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      }
    },
    {
      header: 'Actions',
      accessorKey: 'id',
      cell: (info) => (
        <>
          {!publicView && (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleEditEquipment(info.row.original)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDeleteConfirmation(info.row.original)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )
    }
  ];

  // Function to get the appropriate columns based on equipment category
  const getColumnsForCategory = (category: string): ColumnDef<EquipmentItem>[] => {
    const categoryLower = category.toLowerCase();

    // Base columns that all equipment types have
    let columns = [...equipmentColumns];

    // Categories that generally DO NOT use therms
    const electricOnlyCategories = [
      EQUIPMENT_CATEGORIES.LIGHTING,
      EQUIPMENT_CATEGORIES.VENTILATION,
      EQUIPMENT_CATEGORIES.MOTORS_PUMPS,
      EQUIPMENT_CATEGORIES.OTHER,
      // Water fixtures & Irrigation are handled separately below but also don't use therms
      EQUIPMENT_CATEGORIES.WATER_FIXTURES,
      EQUIPMENT_CATEGORIES.IRRIGATION,
    ].map(c => c.toLowerCase());

    // For water fixtures and irrigation, remove watts, kWh, therms, kBTU columns
    if (categoryLower === EQUIPMENT_CATEGORIES.WATER_FIXTURES.toLowerCase() || 
        categoryLower === EQUIPMENT_CATEGORIES.IRRIGATION.toLowerCase()) {
      columns = columns.filter(col => 
        col.id !== 'weekly_hours' && // Use id for filtering
        col.id !== 'annual_kwh' &&
        col.id !== 'annual_therms' &&
        col.id !== 'annual_kbtu' &&
        col.id !== 'wattage' // Use id for wattage column
      );
      // Special case for water_fixtures: also remove weekly hours
      if (categoryLower === EQUIPMENT_CATEGORIES.WATER_FIXTURES.toLowerCase()) {
        columns = columns.filter(col => col.id !== 'weekly_hours');
      }
    } 
    // For other electric-only categories, just remove therms
    else if (electricOnlyCategories.includes(categoryLower)) {
       columns = columns.filter(col => 
          col.id !== 'annual_therms' // Use id for filtering
         // Keep Annual kBTU column
       );
    }

    // Add lighting-specific columns for lighting equipment
    if (categoryLower === EQUIPMENT_CATEGORIES.LIGHTING.toLowerCase()) {
      // Insert lighting columns after the equipment_type column (index 1)
      // Find the index after Equipment Type
      const equipTypeIndex = columns.findIndex(col => col.header === 'Equipment Type');
      if (equipTypeIndex !== -1) {
         columns.splice(equipTypeIndex + 1, 0, ...lightingSpecificColumns);
      } else {
        // Fallback if column name changes
        columns.splice(2, 0, ...lightingSpecificColumns);
      }
    }

    // Filter out Actions column when in public view
    if (publicView) {
      columns = columns.filter(col => col.header !== 'Actions');
    }

    return columns;
  };

  // Helper function to ensure end_use_category is properly mapped to standard categories
  const standardizeEndUseCategory = (category: string | undefined): string => {
    if (!category) return 'Miscellaneous';

    // Map common variations to standard end-use categories
    const categoryMap: Record<string, string> = {
      'hvac': 'HVAC',
      'cooling': 'Cooling',
      'heating': 'Heating',
      'lighting': 'Lighting',
      'dhw': 'Water Heating',
      'hot water': 'Water Heating',
      'water heating': 'Water Heating',
      'ventilation': 'Ventilation',
      'pumps': 'Water Pumps',
      'water pumps': 'Water Pumps',
      'refrigeration': 'Refrigeration',
      'cooking': 'Cooking',
      'office equipment': 'Office Equipment',
      'miscellaneous': 'Miscellaneous'
    };

    const lowerCategory = category.toLowerCase();
    return categoryMap[lowerCategory] || category;
  };

  // Replace the energy breakdown section with this updated version
  const renderEnergyBreakdown = () => {
    // forceUpdate is used to trigger re-render when data changes
    console.log('Rendering energy breakdown with data:', energyBreakdown, 'forceUpdate:', forceUpdate);
    if (!energyBreakdown || !energyBreakdown.endUseComponents.length) {
      console.log('No energy breakdown to render:',
        !energyBreakdown ? 'energyBreakdown is null' : 'endUseComponents is empty');
      return null;
    }

    // Check if no utility data was available
    if (energyBreakdown.noUtilityDataAvailable) {
      return (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <span className="text-lg font-medium text-amber-800">No Utility Data Available</span>
          </div>
          <p className="text-amber-700">
            Energy breakdown is based solely on equipment data. For a more accurate breakdown,
            please add utility bill data to your project.
          </p>
        </div>
      );
    }

    // First, clean up category names by removing trailing '0'
    energyBreakdown.endUseComponents.forEach(component => {
      if (component.name.endsWith('0')) {
        component.name = component.name.replace(/0$/, '');
      }
    });

    // Check for duplicate categories
    const categoryNames = energyBreakdown.endUseComponents.map(c => c.name);
    const duplicateCategories = categoryNames.filter((name, index) => categoryNames.indexOf(name) !== index);
    console.log('All categories:', categoryNames);
    console.log('Duplicate categories:', duplicateCategories);

    // Show all categories in the chart, even those with zero energy usage
    // Deduplicate categories by combining them and clean up category names
    const uniqueComponents = [];
    const processedNames = new Set();

    for (const component of energyBreakdown.endUseComponents) {
      // Clean up category name by removing trailing '0'
      const cleanName = component.name.replace(/0$/, '');

      // Create a cleaned component with the fixed name
      const cleanedComponent = {
        ...component,
        name: cleanName
      };

      if (processedNames.has(cleanName)) {
        // Find the existing component and combine values
        const existingComponent = uniqueComponents.find(c => c.name === cleanName);
        if (existingComponent) {
          existingComponent.electricKwh += cleanedComponent.electricKwh;
          existingComponent.electricPercent += cleanedComponent.electricPercent;
          existingComponent.gasTherms += (cleanedComponent.gasTherms || 0);
          // Combine deviation explanations if both have them
          if (cleanedComponent.deviationExplanation && existingComponent.deviationExplanation) {
            existingComponent.deviationExplanation += '; ' + cleanedComponent.deviationExplanation;
          } else if (cleanedComponent.deviationExplanation) {
            existingComponent.deviationExplanation = cleanedComponent.deviationExplanation;
          }
        }
      } else {
        // Add new component with cleaned name
        uniqueComponents.push(cleanedComponent);
        processedNames.add(cleanName);
      }
    }

    // Ensure kWh values match percentages
    const totalElectric = energyBreakdown.totalActualElectric ||
      uniqueComponents.reduce((sum, comp) => sum + (comp.electricKwh || 0), 0);

    const totalGas = energyBreakdown.totalActualGas !== null ? energyBreakdown.totalActualGas :
      uniqueComponents.reduce((sum, comp) => sum + (comp.gasTherms || 0), 0);

    // Convert all energy to kBTU for consistent comparison
    uniqueComponents.forEach(comp => {
      // Store original values
      comp.originalElectricKwh = comp.electricKwh;

      // Convert electric kWh to kBTU (1 kWh = 3.412 kBTU)
      const electricKbtu = comp.electricKwh * 3.412;

      // Convert gas therms to kBTU (1 therm = 100 kBTU)
      const gasKbtu = comp.gasTherms * 100;

      // Store total kBTU for this component
      comp.totalKbtu = electricKbtu + gasKbtu;

      console.log(`${comp.name}: Electric ${electricKbtu.toFixed(0)} kBTU, Gas ${gasKbtu.toFixed(0)} kBTU, Total ${comp.totalKbtu.toFixed(0)} kBTU`);
    });

    // Calculate the new total energy in kBTU
    const totalCombinedKbtu = uniqueComponents.reduce((sum, comp) => sum + (comp.totalKbtu || 0), 0);

    // Now recalculate percentages based on the total kBTU
    uniqueComponents.forEach(comp => {
      // Calculate percentage based on the component's share of total energy
      if (totalCombinedKbtu > 0) {
        comp.electricPercent = (comp.totalKbtu / totalCombinedKbtu) * 100;
      }
    });

    // Make sure all component names are cleaned up
    uniqueComponents.forEach(comp => {
      if (comp.name.endsWith('0')) {
        comp.name = comp.name.replace(/0$/, '');
        console.log(`Cleaned up component name to: ${comp.name}`);
      }
    });

    console.log('Deduplicated components:', uniqueComponents);

    // Ensure all categories have at least a minimum value to be visible in the chart
    // This is especially important for categories like Cooking, Refrigeration, Laundry in multifamily buildings
    const chartData = uniqueComponents
      .map((component, index) => {
        // For important multifamily categories, ensure they have a minimum visible value
        const isImportantCategory = ['Cooking', 'Refrigeration', 'Laundry', 'Miscellaneous'].includes(component.name);
        const minValue = isImportantCategory ? 5 : 0.1; // Higher minimum for important categories

        return {
          name: component.name,
          // Use a minimum value for zero/low-usage categories to make them visible
          value: Math.max(Math.round(component.totalKbtu || 0), minValue),
          percentage: component.electricPercent.toFixed(1),
          originalKwh: component.originalElectricKwh,
          kbtu: component.totalKbtu,
          color: COLORS[index % COLORS.length]
        };
      });

    console.log('Chart data:', chartData);

    return (
      <div className="mb-6 grid grid-cols-1 lg:grid-cols-2 gap-6 d-none">
        {/* Energy Breakdown Chart */}
        {/* <div className="p-4 bg-muted rounded-lg border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ChevronDown className="w-5 h-5 text-emerald-500" />
              <span className="text-lg font-medium">Energy Breakdown</span>
            </div>
            {!publicView && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleComprehensiveEnergyBreakdown}
                  className=""
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Regenerating...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Regenerate
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleViewEnergyBreakdown}
                >
                  View Details
                </Button>
              </div>
            )}
          </div>
          <div className="h-[400px]">
            {!publicView && (
              <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                <Info className="h-3 w-3 text-blue-500" />
                <span>Hover over categories for details. Categories with * have deviations from standard.</span>
              </div>
            )}
            <ResponsiveContainer width="100%" height="95%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  outerRadius={140}
                  innerRadius={30}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent, index }) => {
                    const component = uniqueComponents.find(c => c.name === name);
                    if (percent < 0.005) return null;

                    // 2. Conditionally add asterisk to label
                    const showAsterisk = !publicView && component?.deviationExplanation;
                    const labelBase = `${name} ${(percent * 100).toFixed(1)}%`;

                    return showAsterisk ? `${labelBase}*` : labelBase;
                  }}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                {!publicView && (
                  <RechartsTooltip content={<CustomTooltip components={uniqueComponents} />} />
                )}
              </PieChart>
            </ResponsiveContainer>
          </div>

          {(projectDetails?.building_type?.toLowerCase() === 'multifamily' ||
            projectDetails?.building_type?.toLowerCase() === 'apartment') && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-4 h-4 text-blue-500" />
                <span className="font-medium text-blue-700">Why these percentages differ from standard</span>
              </div>
              <DeviationExplanations components={uniqueComponents} />
              {!uniqueComponents.some(c => c.deviationExplanation) && (
                <p className="text-sm text-blue-600 italic">No significant deviations from standard multifamily breakdown.</p>
              )}
            </div>
          )}
        </div> */}

        {/* Energy Breakdown Stats */}
        {/* <div className="p-4 bg-muted rounded-lg border">
          <div className="flex items-center gap-2 mb-4">
            <Database className="w-5 h-5 text-emerald-500" />
            <span className="text-lg font-medium">Energy Distribution</span>
          </div>
          <div className="space-y-3">
            {uniqueComponents
              .sort((a, b) => (b.electricKwh + b.gasTherms * 29.3) - (a.electricKwh + a.gasTherms * 29.3))
              .map((component, index) => (
                <div key={component.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    {!publicView && component.deviationExplanation ? (
                      // Render with Tooltip only if NOT publicView AND deviation exists
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="flex items-center gap-1 cursor-help">
                              {component.name.replace(/0$/, '')}
                              {component.standardPercent && component.standardPercent > 0 && (
                                <Info className="h-3 w-3 text-blue-500" />
                              )}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <div className="text-sm">
                              <div className="font-medium mb-1">Standard: {component.standardPercent}%</div>
                              <div>{component.deviationExplanation}</div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      // Render plain span if publicView OR no deviation explanation
                      <span>{component.name.replace(/0$/, '')}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">
                      {Math.round(component.totalKbtu || 0).toLocaleString()} kBTU
                    </span>
                    <span className="text-sm font-medium">{component.electricPercent.toFixed(1)}%</span>
                  </div>
                </div>
              ))}
          </div>
        </div> */}
      </div>
    );
  };

  return (
    <div className="space-y-6 px-6">
      {/* Page Header */}
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h2 className="text-2xl font-bold">Equipment Analysis</h2>
          <p className="text-muted-foreground">
            Analyze and manage equipment data from field notes and photos
          </p>
        </div>
        {!publicView && (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFieldNotesDialog(true)}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white border-0"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Field Notes
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowPhotoUpload(true)}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white border-0"
          >
            <Camera className="w-4 h-4 mr-2" />
            Add Photos
          </Button>
          {project?.raw_notes && (
            <Button
              variant="outline"
              onClick={() => setShowRawNotes(true)}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white border-0"
            >
              <ClipboardList className="w-4 h-4 mr-2" />
              View Field Notes
            </Button>
          )}
          {equipment.some(item => item.photo_url) && (
            <Button
              variant="outline"
              onClick={handleEnrichEquipment}
              disabled={isEnriching}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white border-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isEnriching ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enriching...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Enrich Equipment
                </>
              )}
            </Button>
          )}
        </div>
        )}
      </div>

      {/* Generic Overview */}
      <div className="mb-6 p-4 bg-muted rounded-lg border">
        <div className="flex items-center gap-2 mb-4">
          <Info className="w-5 h-5 text-emerald-500" />
          <span className="text-lg font-medium">Overview</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Equipment Analysis involves evaluating the performance, condition, and efficiency of machinery or tools used in operations. It helps identify potential issues, optimize maintenance schedules, and improve overall productivity. This process is essential for ensuring equipment reliability and reducing downtime.
        </p>
      </div>


      {/* Total Energy Usage Summary */}
      {equipment.length > 0 && (
        <div className="mb-6 p-4 bg-muted rounded-lg border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              <span className="text-lg font-medium">Total Annual Energy Usage:</span>
            </div>
            <span className="text-xl font-semibold">
              {energyBreakdown ? (
                <>
                  {/* Convert to kBTU and display both */}
                  <div className="flex flex-col items-end">
                    <span>
                      {Math.round(energyBreakdown.totalActualElectric * 3.412).toLocaleString()} kBTU/year
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {Math.round(energyBreakdown.totalActualElectric).toLocaleString()} kWh electric
                      {/* Use actualGasUsage state directly */}
                      {actualGasUsage !== null && actualGasUsage > 0 && (
                        <> + {Math.round(actualGasUsage).toLocaleString()} therms gas</>
                      )}
                    </span>
                  </div>
                </>
              ) : (
                `${Math.round(
                  equipment.reduce((sum, item) => {
                    // Use the annual_kwh value directly from the database
                    const annualKwh = parseFloat(item.annual_kwh?.toString() || '0');
                    return sum + (isNaN(annualKwh) ? 0 : annualKwh);
                  }, 0) * 3.412 // Convert to kBTU
                ).toLocaleString()} kBTU/year`
              )}
            </span>
          </div>
        </div>
      )}

      {/* Energy Breakdown Summary */}
      {equipment.length > 0 && renderEnergyBreakdown()}

      {/* Raw Notes Modal */}
      <Dialog open={showRawNotes} onOpenChange={setShowRawNotes}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Field Notes</DialogTitle>
          </DialogHeader>
          <div className="whitespace-pre-wrap font-mono text-sm">
            {project?.raw_notes || 'No field notes available.'}
          </div>
        </DialogContent>
      </Dialog>

      {/* Action Buttons - Hide when editing */}
      {!showEditModal && (
        <div className="pb-4">
          <Actions
            onAddNotes={handleAddFieldNotes}
            onAddPhotos={handleUploadPhotos}
            hasFieldNotes={equipment.length > 0}
            hasPhotos={equipment.some(item => item.photo_url)}
          />
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-600">
          {error}
        </div>
      ) : equipment.length === 0 ? ( // Use original equipment length here
        <EmptyState
          onAddFieldNotes={handleAddFieldNotes}
          onUploadPhotos={handleUploadPhotos}
          publicView={publicView}
        />
      ) : (
        <TooltipProvider>
          {/* HVAC Section */}
          {hvacEquipment.length > 0 && (
            <CategorySection
              title="HVAC Systems"
              count={hvacEquipment.length}
              icon={<Thermometer className="w-5 h-5" />}
            >
              <div className="mb-4 p-3 bg-muted/50 rounded-md border">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total HVAC Energy Usage:</span>
                  <span className="font-semibold">
                    {Math.round(
                      hvacEquipment.reduce((sum, item) => {
                        const annualKwh = Number(item.annual_kwh || 0);
                        return sum + annualKwh;
                      }, 0)
                    ).toLocaleString()} kWh/year
                  </span>
                </div>
              </div>
              <EquipmentTable
                data={hvacEquipment}
                columns={getColumnsForCategory('hvac')}
              />
            </CategorySection>
          )}

          {/* Ventilation Section */}
          {ventilationEquipment.length > 0 && (
            <CategorySection
              title="Ventilation"
              count={ventilationEquipment.length}
              icon={<Wind className="w-5 h-5" />}
            >
              <div className="mb-4 p-3 bg-muted/50 rounded-md border">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total Ventilation Energy Usage:</span>
                  <span className="font-semibold">
                    {Math.round(
                      ventilationEquipment.reduce((sum, item) => {
                        const annualKwh = Number(item.annual_kwh || 0);
                        return sum + annualKwh;
                      }, 0)
                    ).toLocaleString()} kWh/year
                  </span>
                </div>
              </div>
              <EquipmentTable
                data={ventilationEquipment}
                columns={getColumnsForCategory('ventilation')}
              />
            </CategorySection>
          )}

          {/* Lighting Section - Conditionally filter data for public view */}
          {(() => { // Use a self-executing function for logic, but return JSX directly
              if (lightingEquipment.length === 0) return null; // Early exit if no lighting equipment

              const dataToShow = publicView
                ? lightingEquipment.filter(item => determineLampType(item) !== 'Unknown')
                : lightingEquipment;

              // Only render section if there is data to show after filtering
              if (dataToShow.length === 0) return null;

              // Return the JSX directly
              return (
                <CategorySection
                  title="Lighting"
                  count={dataToShow.length} // Show count of visible items
                  icon={<Lightbulb className="w-5 h-5" />}
                >
                   {/* ... total kWh summary using dataToShow ... */}
                   <div className="mb-4 p-4 bg-muted/50 rounded-lg">
                     <div className="flex items-center justify-between">
                       <div className="flex items-center gap-2">
                         <Zap className="w-4 h-4 text-yellow-500" />
                         <span className="font-medium">Total Annual Energy Usage:</span>
                       </div>
                       <span className="text-lg font-semibold">
                         {Math.round(
                           dataToShow.reduce((sum, item) => {
                             // Calculate annual kWh using the formula
                             const totalLamps = item.number_of_lamps || (
                               Number(item.quantity || 1) * Number(item.lamps_per_fixture || 1)
                             );
                             const wattage = Number(item.wattage || 0);
                             const weeklyHours = Math.round(Number(item.weekly_hours || 0));

                             // Calculate annual kWh
                             const calculatedKwh = (totalLamps * wattage * weeklyHours * 52) / 1000;
                             return sum + (isNaN(calculatedKwh) ? 0 : calculatedKwh);
                           }, 0)
                         ).toLocaleString()} kWh/year
                       </span>
                     </div>
                   </div>
                  <EquipmentTable
                    data={dataToShow} // Pass filtered or original data
                    columns={getColumnsForCategory('lighting')}
                  />
                </CategorySection>
              );
          })()}

          {/* DHW Section */}
          {dhwEquipment.length > 0 && (
            <CategorySection
              title="Domestic Hot Water"
              count={dhwEquipment.length}
              icon={<Zap className="w-5 h-5" />}
            >
              <EquipmentTable
                data={dhwEquipment}
                columns={getColumnsForCategory('dhw')}
              />
            </CategorySection>
          )}

          {/* Water Fixtures Section */}
          {waterFixturesEquipment.length > 0 && (
            <CategorySection
              title="Water Fixtures"
              count={waterFixturesEquipment.length}
              icon={<Droplet className="w-5 h-5" />}
            >
              <EquipmentTable
                data={waterFixturesEquipment}
                columns={getColumnsForCategory('water_fixtures')}
              />
            </CategorySection>
          )}

          {/* Pool Equipment Section */}
          {poolEquipment.length > 0 && (
            <CategorySection
              title="Pool Equipment"
              count={poolEquipment.length}
              icon={<Waves className="w-5 h-5" />}
            >
              <EquipmentTable
                data={poolEquipment}
                columns={equipmentColumns}
              />
            </CategorySection>
          )}

          {/* Laundry Section */}
          {laundryEquipment.length > 0 && (
            <CategorySection
              title="Laundry"
              count={laundryEquipment.length}
              icon={<Shirt className="w-5 h-5" />}
            >
              <EquipmentTable
                data={laundryEquipment}
                columns={getColumnsForCategory('laundry')}
              />
            </CategorySection>
          )}

          {/* Irrigation Section */}
          {irrigationEquipment.length > 0 && (
            <CategorySection
              title="Irrigation"
              count={irrigationEquipment.length}
              icon={<Sprout className="w-5 h-5" />}
            >
              <EquipmentTable
                data={irrigationEquipment}
                columns={getColumnsForCategory('irrigation')}
              />
            </CategorySection>
          )}

          {/* Appliances Section */}
          {applianceEquipment.length > 0 && (
            <CategorySection
              title="Appliances"
              count={applianceEquipment.length}
              icon={<Utensils className="w-5 h-5" />}
            >
              <EquipmentTable
                data={applianceEquipment}
                columns={getColumnsForCategory('appliance')}
              />
            </CategorySection>
          )}

          {/* Motors & Pumps Section (New Section) */}
          {motorsPumpsEquipment.length > 0 && (
            <CategorySection
              title="Motors & Pumps"
              count={motorsPumpsEquipment.length}
              icon={<Power className="w-5 h-5" />} // Using Power icon, adjust if needed
            >
              <EquipmentTable
                data={motorsPumpsEquipment}
                columns={getColumnsForCategory('motors_pumps')} // Need to define columns for this if different
              />
            </CategorySection>
          )}

          {/* Other Equipment Section */}
          {otherEquipment.length > 0 && (
            <CategorySection
              title="Other Equipment"
              count={otherEquipment.length}
              icon={<AlertCircle className="w-5 h-5" />}
            >
              <EquipmentTable
                data={otherEquipment}
                columns={getColumnsForCategory('other')}
              />
            </CategorySection>
          )}
        </TooltipProvider>
      )}

      {/* Equipment Edit Modal */}
      {showEditModal && projectId && (
        <EquipmentEditModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          equipment={itemToEdit}
          onSaved={handleEquipmentUpdated}
        />
      )}

      {/* Field Notes Dialog */}
      <Dialog open={showFieldNotesDialog} onOpenChange={setShowFieldNotesDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Process Field Notes</DialogTitle>
          </DialogHeader>
          <FieldNotesProcessor
            projectId={projectId}
            onSuccess={handleFieldNotesSuccess}
          />
        </DialogContent>
      </Dialog>

      {/* Photo Upload Dialog */}
      <Dialog open={showPhotoUpload} onOpenChange={setShowPhotoUpload}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Upload Equipment Photos</DialogTitle>
          </DialogHeader>
          <PhotoUploadForm
            projectId={projectId!}
            onSuccess={handlePhotoUploadSuccess}
            onCancel={() => setShowPhotoUpload(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Energy Breakdown Dialog */}
      {showEnergyBreakdown && (
        <EnergyBreakdownDialog
          open={showEnergyBreakdown}
          onOpenChange={setShowEnergyBreakdown}
          equipment={equipment}
          totalApartmentCount={projectDetails?.total_units || 1}
          isApartmentEquipment={isApartmentEquipment}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirmation} onOpenChange={setShowDeleteConfirmation}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this equipment item? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {itemToDelete && (
              <div className="space-y-2">
                <p><strong>Type:</strong> {itemToDelete.equipment_type || 'N/A'}</p>
                <p><strong>Category:</strong> {itemToDelete.category || 'N/A'}</p>
                <p><strong>Location:</strong> {
                  typeof itemToDelete.location === 'string'
                    ? itemToDelete.location
                    : itemToDelete.location?.room || 'N/A'
                }</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirmation(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteEquipment}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Photo Viewer Dialog */}
      <Dialog open={showPhotoViewer} onOpenChange={setShowPhotoViewer}>
        <DialogContent className="sm:max-w-[900px] p-0">
          <DialogHeader className="p-6">
            <DialogTitle>Equipment Photo</DialogTitle>
          </DialogHeader>
          {selectedPhoto && (
            <div className="relative aspect-video w-full">
              <img
                src={selectedPhoto}
                alt="Equipment"
                className="w-full h-full object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
