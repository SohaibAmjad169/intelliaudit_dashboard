import React, { useState, useEffect } from 'react';
import { apiClient } from '../../../services/common/api-client';
import { PhotoMetadataResult } from '../../../services/equipment/photo-metadata';
import { normalizeUUID } from '../../../services/common/uuid-helpers';
import { Search, Loader2, Zap, Filter, Database, Thermometer, Lightbulb, Droplet } from 'lucide-react';

// Import shadcn components
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';

// Equipment categories with icons and match patterns
const EQUIPMENT_CATEGORIES = {
  HVAC: {
    id: 'hvac',
    icon: Thermometer,
    label: 'HVAC',
    patterns: ['hvac', 'heat', 'cool', 'furnace', 'air condition', 'thermostat']
  },
  LIGHTING: {
    id: 'lighting',
    icon: Lightbulb,
    label: 'Lighting',
    patterns: ['light', 'lamp', 'fixture', 'led', 'cfl']
  },
  WATER: {
    id: 'water',
    icon: Droplet,
    label: 'Water',
    patterns: ['water', 'faucet', 'shower', 'toilet']
  }
};

interface EquipmentSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEquipmentSelected: (equipmentId: string) => void;
  projectId: string;
  metadataResult?: PhotoMetadataResult | null;
}

export const EquipmentSelectionModal: React.FC<EquipmentSelectionModalProps> = ({
  isOpen,
  onClose,
  onEquipmentSelected,
  projectId,
  metadataResult,
}) => {
  const [equipment, setEquipment] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categoryEquipmentCounts, setCategoryEquipmentCounts] = useState<Record<string, number>>({});
  
  // Load initial equipment counts
  useEffect(() => {
    if (isOpen && projectId) {
      loadCategoryCounts();
    }
  }, [isOpen, projectId]);

  // Load equipment when category changes or search is performed
  useEffect(() => {
    if (isOpen && projectId) {
      const debounceTimer = setTimeout(() => {
        loadFilteredEquipment();
      }, 300); // Debounce search input

      return () => clearTimeout(debounceTimer);
    }
  }, [isOpen, projectId, selectedCategory, searchQuery]);

  // Auto-select category based on metadata
  useEffect(() => {
    if (metadataResult?.equipment_type) {
      const type = metadataResult.equipment_type.toLowerCase();
      const matchingCategory = Object.entries(EQUIPMENT_CATEGORIES).find(([_, category]) =>
        category.patterns.some(pattern => type.includes(pattern))
      );
      if (matchingCategory) {
        setSelectedCategory(matchingCategory[1].id);
      }
    }
  }, [metadataResult]);

  const loadCategoryCounts = async () => {
    try {
      const counts: Record<string, number> = {};
      for (const [key, category] of Object.entries(EQUIPMENT_CATEGORIES)) {
        const response = await apiClient.get<any[]>(`equipment-prisma/project/${projectId}?category=${category.id}`);
        counts[category.id] = response.length;
      }
      setCategoryEquipmentCounts(counts);
    } catch (error) {
      console.error('Error loading category counts:', error);
    }
  };

  const loadFilteredEquipment = async () => {
    try {
      setLoading(true);
      
      // Build the query parameters
      const params = new URLSearchParams();
      if (selectedCategory) {
        params.append('category', selectedCategory);
      }
      if (searchQuery) {
        params.append('type', searchQuery);
      }
      
      // Make the API call with filters
      const response = await apiClient.get<any[]>(
        `equipment-prisma/project/${projectId}${params.toString() ? `?${params.toString()}` : ''}`
      );

      let data = response || [];

      // Enrich with match scores if we have metadata results
      if (metadataResult?.suggested_matches?.length > 0) {
        const matchMap = new Map(
          metadataResult.suggested_matches.map(match => [
            normalizeUUID(match.equipmentId),
            match
          ])
        );

        data = data.map(item => ({
          ...item,
          matchScore: matchMap.get(normalizeUUID(String(item.id)))?.matchScore || 0,
          matchReasoning: matchMap.get(normalizeUUID(String(item.id)))?.reasoning || '',
          isMatched: matchMap.has(normalizeUUID(String(item.id)))
        }));

        // Sort by match score
        data.sort((a, b) => {
          if (a.isMatched && !b.isMatched) return -1;
          if (!a.isMatched && b.isMatched) return 1;
          return (b.matchScore || 0) - (a.matchScore || 0);
        });
      }

      setEquipment(data);
    } catch (error) {
      console.error('Error loading equipment:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to Load Equipment',
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setLoading(false);
    }
  };

  const getMatchScoreBadge = (item: any) => {
    if (!item.isMatched) return null;
    
    if (item.matchScore >= 0.8) {
      return (
        <Badge className="bg-emerald-500 flex items-center">
          <Zap className="mr-1 h-3 w-3" />
          {`${(item.matchScore * 100).toFixed(0)}% Match`}
        </Badge>
      );
    } else if (item.matchScore >= 0.5) {
      return (
        <Badge className="bg-amber-500">
          {`${(item.matchScore * 100).toFixed(0)}% Match`}
        </Badge>
      );
    } else {
      return (
        <Badge variant="secondary">
          {`${(item.matchScore * 100).toFixed(0)}% Match`}
        </Badge>
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-[900px]">
        <DialogHeader>
          <DialogTitle>Select Equipment</DialogTitle>
          <DialogDescription>
            Choose the equipment to apply the extracted metadata to
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by type, manufacturer, or model..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 bg-zinc-800/70 border-zinc-700"
              />
            </div>
            <div className="flex gap-2">
              {Object.entries(EQUIPMENT_CATEGORIES).map(([key, category]) => {
                const Icon = category.icon;
                const count = categoryEquipmentCounts[category.id] || 0;
                
                return (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "outline"}
                    className="gap-2"
                    onClick={() => setSelectedCategory(selectedCategory === category.id ? null : category.id)}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{category.label}</span>
                    <Badge variant="secondary" className="ml-1">{count}</Badge>
                  </Button>
                );
              })}
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : equipment.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No equipment found matching your criteria
            </div>
          ) : (
            <div className="rounded-md border border-zinc-700 overflow-hidden">
              <Table>
                <TableHeader className="bg-zinc-800/50">
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Manufacturer</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>AI Match</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {equipment.map((item) => (
                    <TableRow key={item.id} className={item.isMatched ? 'bg-emerald-950/20' : undefined}>
                      <TableCell>{item.equipment_type || 'Unknown'}</TableCell>
                      <TableCell>{item.manufacturer || 'Unknown'}</TableCell>
                      <TableCell>{item.model || 'Unknown'}</TableCell>
                      <TableCell>{item.location || 'Unknown'}</TableCell>
                      <TableCell>{getMatchScoreBadge(item)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => onEquipmentSelected(item.id)}
                          className={item.isMatched && item.matchScore >= 0.7 
                            ? "bg-gradient-to-r from-emerald-600 to-emerald-700 text-white"
                            : ""}
                        >
                          Select
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}; 