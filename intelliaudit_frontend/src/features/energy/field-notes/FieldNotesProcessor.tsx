import React, { useState } from 'react';
import { AlertCircle, Loader2, BarChart, Lightbulb, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { EnergyBreakdownDialog } from '@/features/energy/EnergyBreakdownDialog';
import { EquipmentItem } from '@/features/energy/types';
import { fieldNotesService } from '@/services/field-notes';
import { FieldNotesEquipmentItem } from '@/services/field-notes';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export interface FieldNotesProcessorProps {
  projectId: string;
  onSuccess?: () => void;
}

export const FieldNotesProcessor: React.FC<FieldNotesProcessorProps> = ({
  projectId,
  onSuccess
}) => {
  const [fieldNotes, setFieldNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [equipmentItems, setEquipmentItems] = useState<EquipmentItem[]>([]);
  const [showBreakdown, setShowBreakdown] = useState(false);

  // Process field notes using the new field-notes service
  const handleProcess = async () => {
    if (!fieldNotes.trim()) {
      setError('Please enter field notes to process');
      return;
    }

    if (!projectId) {
      console.error('[DEBUG] Missing projectId in FieldNotesProcessor.handleProcess');
      setError('Project ID is required');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setEquipmentItems([]);

    try {
      // Use the new field-notes service that defaults to Claude 3 Opus (o1)
      const result = await fieldNotesService.processFieldNotes(
        fieldNotes,
        projectId
      );

      if (result.flags?.some(flag => flag.type === 'error')) {
        const errorMessage = result.flags.find(flag => flag.type === 'error')?.message;
        setError(errorMessage || 'Failed to process field notes');
        return;
      }

      if (result.equipment && result.equipment.length > 0) {
        // Transform API response data to match the expected EquipmentItem type
        const transformedEquipment: EquipmentItem[] = result.equipment.map(item => ({
          id: item.id,
          equipment_type: item.equipment_type,
          category: item.category || 'Other',
          quantity: item.quantity || 1,
          wattage: item.wattage,
          annual_kwh: item.annual_kwh,
          manufacturer: item.manufacturer,
          model: item.model,
          location: item.location || 'Various',
          source_type: 'field_notes',
          capacity: item.capacity
        }));

        setEquipmentItems(transformedEquipment);
        toast.success(`Successfully extracted ${transformedEquipment.length} equipment items`);
        if (onSuccess) {
          onSuccess();
        }
      } else {
        setError('No equipment detected in the field notes. Please check your input and try again.');
      }
    } catch (error: any) {
      console.error('[DEBUG] Error processing:', error);
      setError(`Error processing field notes: ${error.message || 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper function to determine if equipment is in apartment
  const isApartmentEquipment = (item: EquipmentItem) => {
    const locationStr = typeof item.location === 'string'
      ? item.location?.toLowerCase()
      : '';

    return locationStr?.includes('apartment') ||
           locationStr?.includes('unit') ||
           locationStr?.includes('tenant');
  };

  return (
    <div className="space-y-4">
      <div className="relative group">
        <Textarea
          value={fieldNotes}
          onChange={(e) => setFieldNotes(e.target.value)}
          placeholder="Enter your field notes here. Include details about equipment locations, specifications, and conditions..."
          className="min-h-[200px] w-full resize-none rounded-lg
            bg-background/50 backdrop-blur-sm
            border border-border/50 hover:border-border
            focus:border-emerald-500/50 focus:ring-emerald-500/20
            placeholder:text-muted-foreground/70
            transition-colors duration-200"
          disabled={isProcessing}
        />
        <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-emerald-500/5 via-transparent to-emerald-500/5 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-500" />
      </div>

      {error && (
        <div className="p-3 bg-destructive/5 backdrop-blur-sm border border-destructive/20 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <p className="text-destructive text-sm">{error}</p>
        </div>
      )}

      {isProcessing && (
        <div className="p-3 bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />
            <div>
              <p className="text-sm font-medium">Processing Field Notes</p>
              <p className="text-xs text-muted-foreground">Please wait while we analyze your notes with o1...</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => setFieldNotes('')}
          disabled={isProcessing || !fieldNotes.trim()}
          className="bg-background/50 backdrop-blur-sm border-border/50 hover:bg-accent/50"
        >
          Clear
        </Button>

        {equipmentItems.length > 0 && (
          <Button
            variant="outline"
            onClick={() => setShowBreakdown(true)}
            className="bg-background/50 backdrop-blur-sm border-border/50 hover:bg-accent/50"
          >
            <BarChart className="w-4 h-4 mr-2" />
            View Energy Breakdown
          </Button>
        )}

        <Button
          onClick={handleProcess}
          disabled={isProcessing || !fieldNotes.trim()}
          className="bg-emerald-500/90 hover:bg-emerald-600/90 text-white backdrop-blur-sm"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : 'Process Notes'}
        </Button>
      </div>

      {/* Energy breakdown dialog */}
      {equipmentItems.length > 0 && (
        <EnergyBreakdownDialog
          open={showBreakdown}
          onOpenChange={setShowBreakdown}
          equipment={equipmentItems}
          totalApartmentCount={24} // This should ideally be dynamic based on building info
          isApartmentEquipment={isApartmentEquipment}
        />
      )}
    </div>
  );
};