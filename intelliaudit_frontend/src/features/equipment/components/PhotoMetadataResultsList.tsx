import React, { useEffect, useState, useMemo } from 'react';
import { 
  photoMetadataService, 
  PhotoMetadataResult, 
  SuggestedMatch
} from '../../../services/equipment/photo-metadata';
import { equipmentV2Service } from '../../../services/equipment/equipment-v2';
import { normalizeUUID } from '../../../services/common/uuid-helpers';
import { format } from 'date-fns';
import { EquipmentSelectionModal } from './EquipmentSelectionModal';
import { 
  Check, 
  Info, 
  Loader2, 
  Image, 
  Search, 
  ArrowUpDown, 
  Zap, 
  X,
  Maximize,
  Tag as TagIcon,
  Bolt as BoltIcon,
  HelpCircle as QuestionMarkCircleIcon
} from 'lucide-react';

// Import shadcn components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { apiClient } from '../../../services/common/api-client';

interface PhotoMetadataResultsListProps {
  batchId: string;
  projectId: string;
  refreshTrigger?: number; // Incremented to trigger a refresh
}

// Add this new component for photo lightbox
const PhotoLightbox = ({ imageUrl, isOpen, onClose }: { imageUrl: string, isOpen: boolean, onClose: () => void }) => {
  if (!isOpen) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[90vw] sm:max-h-[90vh] p-0 border-0 bg-black/5 backdrop-blur-sm">
        <div className="relative">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose} 
            className="absolute top-2 right-2 bg-black/40 hover:bg-black/60 text-white rounded-full"
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="w-full flex items-center justify-center p-2">
            <img 
              src={imageUrl} 
              alt="Equipment" 
              className="max-h-[85vh] max-w-full object-contain"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

/**
 * Component for displaying results of photo metadata extraction
 */
export const PhotoMetadataResultsList: React.FC<PhotoMetadataResultsListProps> = ({
  batchId,
  projectId,
  refreshTrigger = 0
}) => {
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [bulkApplying, setBulkApplying] = useState(false);
  const [results, setResults] = useState<PhotoMetadataResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<PhotoMetadataResult | null>(null);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [selectionModalVisible, setSelectionModalVisible] = useState(false);
  const [resultToApply, setResultToApply] = useState<PhotoMetadataResult | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBy, setFilterBy] = useState('all');
  const [photoLightboxOpen, setPhotoLightboxOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string>('');
  const [equipmentDetails, setEquipmentDetails] = useState<Map<string, any>>(new Map());
  const [loadingEquipment, setLoadingEquipment] = useState(false);

  const loadEquipmentDetails = async (results: PhotoMetadataResult[]) => {
    const equipmentIds = new Set<string>();
    const normalizedIdsMap = new Map<string, string>();
    
    // Collect all unique equipment IDs from suggested matches and normalize them once
    results.forEach(result => {
      if (result.suggested_matches && result.suggested_matches.length > 0) {
        result.suggested_matches.forEach(match => {
          const normalizedId = normalizeUUID(match.equipmentId);
          equipmentIds.add(normalizedId);
          normalizedIdsMap.set(match.equipmentId, normalizedId);
          match.equipmentId = normalizedId; // Store normalized ID
        });
      }
      
      // Also normalize applied_to_equipment_id if present
      if (result.applied_to_equipment_id) {
        const normalizedId = normalizeUUID(result.applied_to_equipment_id);
        equipmentIds.add(normalizedId);
        normalizedIdsMap.set(result.applied_to_equipment_id, normalizedId);
        result.applied_to_equipment_id = normalizedId;
      }
    });
    
    if (equipmentIds.size === 0) return;
    
    setLoadingEquipment(true);
    const detailsMap = new Map<string, any>();
    
    try {
      // Batch load all equipment details in one API call
      const equipmentArray = Array.from(equipmentIds);
      const response = await apiClient.post(`equipment-prisma/batch`, {
        ids: equipmentArray
      });
      
      if (response && Array.isArray(response)) {
        response.forEach(equipment => {
          if (equipment && equipment.id) {
            detailsMap.set(equipment.id, equipment);
          }
        });
      }
      
      setEquipmentDetails(detailsMap);
    } catch (error) {
      console.error('Error loading equipment details:', error);
    } finally {
      setLoadingEquipment(false);
    }
  };
  
  // Updated loadResults to include equipment details loading
  const loadResults = async () => {
    try {
      setLoading(true);
      const data = await photoMetadataService.getBatchResults(batchId);
      
      // Sort by confidence score (highest first)
      const sortedData = [...data].sort((a, b) => {
        return (b.confidence || 0) - (a.confidence || 0);
      });
      
      setResults(sortedData);
      
      // Load equipment details for suggested matches
      await loadEquipmentDetails(sortedData);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to Load Results',
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setLoading(false);
    }
  };

  // Load results on component mount and when refreshTrigger changes
  useEffect(() => {
    loadResults();
  }, [batchId, refreshTrigger]);

  // Filter and sort results
  const filteredResults = useMemo(() => {
    let filtered = [...results];
    
    // Filter by status
    if (filterBy === 'applied') {
      filtered = filtered.filter(result => result.is_applied);
    } else if (filterBy === 'not-applied') {
      filtered = filtered.filter(result => !result.is_applied);
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(result => 
        (result.equipment_type?.toLowerCase().includes(query) || false) ||
        (result.manufacturer?.toLowerCase().includes(query) || false) ||
        (result.model?.toLowerCase().includes(query) || false)
      );
    }
    
    return filtered;
  }, [results, searchQuery, filterBy]);

  // Show equipment selection modal
  const showEquipmentSelectionModal = (result: PhotoMetadataResult) => {
    setResultToApply(result);
    setSelectionModalVisible(true);
  };

  // Handle equipment selection
  const handleEquipmentSelected = async (equipmentId: string) => {
    if (!resultToApply) return;
    
    try {
      setApplying(true);
      
      // Normalize the UUID
      const normalizedId = normalizeUUID(equipmentId);
      if (normalizedId !== equipmentId) {
        console.log(`Normalized UUID: ${equipmentId} -> ${normalizedId}`);
      }
      
      await photoMetadataService.applyMetadataToEquipment({
        metadataResultId: resultToApply.id,
        equipmentId: normalizedId
      });
      
      toast({
        title: 'Metadata Applied',
        description: `Successfully applied metadata to equipment ID: ${normalizedId}`
      });
      
      // Close the modal
      setSelectionModalVisible(false);
      setResultToApply(null);
      
      // Refresh results
      loadResults();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to Apply Metadata',
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setApplying(false);
    }
  };

  // View details of a result
  const showDetails = (result: PhotoMetadataResult) => {
    setSelectedResult(result);
    setDetailsVisible(true);
  };
  
  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'PPpp');
    } catch (error) {
      return dateString;
    }
  };

  // Get confidence badge with appropriate color
  const getConfidenceBadge = (confidence?: number) => {
    if (confidence === undefined || confidence === null) {
      return <Badge variant="outline">Unknown</Badge>;
    }
    
    if (confidence >= 0.8) {
      return <Badge className="bg-emerald-500">{`${(confidence * 100).toFixed(0)}%`}</Badge>;
    } else if (confidence >= 0.5) {
      return <Badge className="bg-amber-500">{`${(confidence * 100).toFixed(0)}%`}</Badge>;
    } else {
      return <Badge variant="destructive">{`${(confidence * 100).toFixed(0)}%`}</Badge>;
    }
  };

  // Handle click on photo to open lightbox
  const handlePhotoClick = (photoUrl: string) => {
    setSelectedPhoto(photoUrl);
    setPhotoLightboxOpen(true);
  };
  
  // New function to get equipment info for display
  const getEquipmentInfo = (equipmentId: string) => {
    if (!equipmentId) return { 
      name: 'Unknown Equipment', 
      type: 'Unknown',
      description: 'No equipment details available'
    };
    
    // Normalize the UUID
    const normalizedId = normalizeUUID(equipmentId);
    
    const equipment = equipmentDetails.get(normalizedId);
    if (!equipment) return { 
      name: 'Unknown Equipment', 
      type: 'Unknown',
      description: 'No equipment details available'
    };
    
    // Create a more descriptive name with all available information
    let name = '';
    
    if (equipment.manufacturer && equipment.model) {
      name = `${equipment.manufacturer} ${equipment.model}`;
    } else if (equipment.manufacturer) {
      name = equipment.manufacturer;
    } else if (equipment.model) {
      name = equipment.model;
    } else if (equipment.equipment_type) {
      name = equipment.equipment_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    } else {
      name = 'Unknown Equipment';
    }
    
    // Add location if available
    const location = equipment.location ? ` (${equipment.location})` : '';
    
    return { 
      name: name + location,
      type: equipment.equipment_type || 'Unknown',
      description: `${equipment.equipment_type ? equipment.equipment_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Equipment'}${equipment.location ? ` - ${equipment.location}` : ''}`
    };
  };

  // Helper function to generate match badge
  const generateMatchBadge = (match) => {
    const equipInfo = getEquipmentInfo(match.equipmentId);
    
    return (
      <div className="flex flex-col gap-1 mt-1 w-full max-w-[250px]">
        <div className="flex items-center gap-1.5">
          <Badge className={
            match.matchScore >= 0.8 ? "bg-emerald-500" : 
            match.matchScore >= 0.5 ? "bg-amber-500" : 
            "bg-zinc-700 text-white"
          }>
            {`${(match.matchScore * 100).toFixed(0)}%`}
          </Badge>
          <span className="text-sm font-medium truncate">{equipInfo.name}</span>
        </div>
        <p className="text-xs text-muted-foreground truncate">{equipInfo.description}</p>
      </div>
    );
  };

  // Updated match suggestion badge with more descriptive info
  const getMatchSuggestionBadge = (result: PhotoMetadataResult) => {
    if (!result.suggested_matches || result.suggested_matches.length === 0) {
      return null;
    }

    // Sort matches by score descending
    const sortedMatches = [...result.suggested_matches].sort((a, b) => b.matchScore - a.matchScore);
    const bestMatch = sortedMatches[0];
    const bestMatchInfo = getEquipmentInfo(bestMatch.equipmentId);
    
    const matchCount = result.suggested_matches.length;

    return (
      <div className="inline-flex items-center ml-1">
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <div className="cursor-help">
              {bestMatch.matchScore >= 0.8 ? (
                <Badge variant="outline" className="ml-2 bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                  <BoltIcon className="w-3 h-3 mr-1" /> 
                  {matchCount > 1 ? `${matchCount} matches` : 'Match available'}
                </Badge>
              ) : bestMatch.matchScore >= 0.5 ? (
                <Badge variant="outline" className="ml-2 bg-amber-500/10 text-amber-500 border-amber-500/20">
                  <TagIcon className="w-3 h-3 mr-1" />
                  {matchCount > 1 ? `${matchCount} matches` : 'Possible match'}
                </Badge>
              ) : (
                <Badge variant="outline" className="ml-2 bg-slate-400/10 text-slate-400 border-slate-400/20">
                  <QuestionMarkCircleIcon className="w-3 h-3 mr-1" />
                  {matchCount > 1 ? `${matchCount} low matches` : 'Low match'}
                </Badge>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[300px]">
            <div className="space-y-2">
              <p className="text-sm font-medium">Suggested Equipment Matches</p>
              <div className="space-y-1.5">
                {sortedMatches.slice(0, 3).map((match, idx) => {
                  const equipInfo = getEquipmentInfo(match.equipmentId);
                  return (
                    <div key={idx} className="flex items-center gap-2">
                      <Badge className={
                        match.matchScore >= 0.8 ? "bg-emerald-500" : 
                        match.matchScore >= 0.5 ? "bg-amber-500" : 
                        "bg-zinc-700 text-white"
                      }>
                        {`${(match.matchScore * 100).toFixed(0)}%`}
                      </Badge>
                      <span className="text-sm">{equipInfo.name}</span>
                    </div>
                  );
                })}
                {sortedMatches.length > 3 && (
                  <p className="text-xs text-muted-foreground pt-1">
                    +{sortedMatches.length - 3} more matches
                  </p>
                )}
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </div>
    );
  };

  // Handle direct match application
  const handleApplyMatch = async (result: PhotoMetadataResult, equipmentId: string) => {
    try {
      setApplying(true);
      setResultToApply(result);
      
      // Normalize the UUID
      const normalizedId = normalizeUUID(equipmentId);
      if (normalizedId !== equipmentId) {
        console.log(`Normalized UUID: ${equipmentId} -> ${normalizedId}`);
      }
      
      await photoMetadataService.applyMetadataToEquipment({
        metadataResultId: result.id,
        equipmentId: normalizedId
      });
      
      // Update local state immediately
      setResults(prevResults => prevResults.map(r => {
        if (r.id === result.id) {
          return {
            ...r,
            is_applied: true,
            applied_to_equipment_id: normalizedId
          };
        }
        return r;
      }));
      
      toast({
        title: 'Metadata Applied',
        description: `Successfully applied metadata to equipment ID: ${normalizedId}`
      });
      
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to Apply Metadata',
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setApplying(false);
      setResultToApply(null);
    }
  };

  // Handle bulk application of high confidence matches
  const handleBulkApply = async () => {
    try {
      setBulkApplying(true);
      
      // Filter for unapplied results with high confidence matches
      const resultsToApply = filteredResults.filter(result => 
        !result.is_applied && 
        result.suggested_matches && 
        result.suggested_matches.length > 0 &&
        result.suggested_matches[0].matchScore >= 0.8
      );
      
      if (resultsToApply.length === 0) {
        toast({
          title: 'No Matches to Apply',
          description: 'No high confidence matches found to apply.',
          variant: 'default'
        });
        return;
      }
      
      // Prepare batch data
      const batchData = resultsToApply.map(result => ({
        metadataResultId: result.id,
        equipmentId: normalizeUUID(result.suggested_matches![0].equipmentId)
      }));
      
      // Call batch apply endpoint
      await photoMetadataService.applyMetadataBatch({
        projectId,
        matches: batchData
      });
      
      // Update local state immediately
      setResults(prevResults => prevResults.map(r => {
        const matchToApply = resultsToApply.find(result => result.id === r.id);
        if (matchToApply) {
          return {
            ...r,
            is_applied: true,
            applied_to_equipment_id: normalizeUUID(matchToApply.suggested_matches![0].equipmentId)
          };
        }
        return r;
      }));
      
      toast({
        title: 'Bulk Apply Complete',
        description: `Successfully applied ${resultsToApply.length} matches`,
        variant: 'default'
      });
      
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to Apply Matches',
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setBulkApplying(false);
    }
  };

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>Photo Metadata Results</CardTitle>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadResults} 
              disabled={loading}
              className="ml-auto bg-zinc-800 text-zinc-100 border-zinc-700 hover:bg-zinc-700"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Refresh
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by type, manufacturer, or model..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 bg-zinc-800/70 border-zinc-700"
                />
              </div>
              <Select 
                value={filterBy} 
                onValueChange={setFilterBy}
              >
                <SelectTrigger className="w-[180px] bg-zinc-800/70 border-zinc-700">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  <SelectItem value="all">All Results</SelectItem>
                  <SelectItem value="applied">Applied Only</SelectItem>
                  <SelectItem value="not-applied">Not Applied Only</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="default"
                size="default"
                onClick={handleBulkApply}
                disabled={bulkApplying || loading}
                className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white min-w-[140px]"
              >
                {bulkApplying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Applying...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Apply All Matches
                  </>
                )}
              </Button>
            </div>

            {loading && results.length === 0 ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredResults.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {results.length > 0 
                  ? 'No results match your filters' 
                  : 'No metadata results found for this batch'
                }
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-zinc-800/50">
                  <TableRow>
                    <TableHead>Photo</TableHead>
                    <TableHead>Equipment Type</TableHead>
                    <TableHead>Manufacturer</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>
                      <div className="flex items-center">
                        Confidence
                        <ArrowUpDown className="ml-1 h-3 w-3 text-muted-foreground" />
                      </div>
                    </TableHead>
                    <TableHead>Suggested Match</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredResults.map((result) => (
                    <TableRow key={result.id}>
                      <TableCell>
                        {result.photo_url ? (
                          <div 
                            className="relative h-10 w-10 overflow-hidden rounded-md cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => handlePhotoClick(result.photo_url!)}
                          >
                            <img 
                              src={result.photo_url} 
                              alt="Equipment" 
                              className="h-full w-full object-cover" 
                            />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                              <Maximize className="h-4 w-4 text-white" />
                            </div>
                          </div>
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
                            <Image className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{result.equipment_type || 'Unknown'}</TableCell>
                      <TableCell>{result.manufacturer || 'Unknown'}</TableCell>
                      <TableCell>{result.model || 'Unknown'}</TableCell>
                      <TableCell>{getConfidenceBadge(result.confidence)}</TableCell>
                      <TableCell>{getMatchSuggestionBadge(result)}</TableCell>
                      <TableCell>
                        {result.is_applied ? (
                          <div className="flex items-center gap-1">
                            <Badge variant="outline" className="border-emerald-500 text-emerald-500">
                              <Check className="mr-1 h-3 w-3" />
                              Applied
                            </Badge>
                          </div>
                        ) : (
                          <Badge variant="outline">Not Applied</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => showDetails(result)}
                          >
                            Details
                          </Button>
                          
                          {!result.is_applied && (
                            <>
                              {result.suggested_matches && 
                               result.suggested_matches.length > 0 && 
                               result.suggested_matches[0].matchScore >= 0.8 ? (
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => handleApplyMatch(result, result.suggested_matches![0].equipmentId)}
                                  disabled={applying && resultToApply?.id === result.id}
                                  className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white"
                                >
                                  {applying && resultToApply?.id === result.id ? (
                                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                  ) : (
                                    <Zap className="mr-1 h-3 w-3" />
                                  )}
                                  Apply Match
                                </Button>
                              ) : (
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => showEquipmentSelectionModal(result)}
                                  disabled={applying && resultToApply?.id === result.id}
                                  className="bg-zinc-800 text-zinc-100 border-zinc-700 hover:bg-zinc-700"
                                >
                                  {applying && resultToApply?.id === result.id ? (
                                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                  ) : null}
                                  Apply
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Details Dialog - Update with match functionality */}
        <Dialog open={detailsVisible} onOpenChange={setDetailsVisible}>
          <DialogContent className="sm:max-w-[800px]">
            <DialogHeader>
              <DialogTitle>Metadata Details</DialogTitle>
            </DialogHeader>
            
            {selectedResult && (
              <div className="space-y-4">
                {selectedResult.photo_url && (
                  <div className="flex justify-center">
                    <img 
                      src={selectedResult.photo_url} 
                      alt="Equipment" 
                      className="max-h-[300px] rounded-md object-contain cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => handlePhotoClick(selectedResult.photo_url!)}
                    />
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Identification</h4>
                    <div className="rounded-lg border p-3 text-sm space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Equipment Type:</span>
                        <span>{selectedResult.equipment_type || 'Unknown'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Manufacturer:</span>
                        <span>{selectedResult.manufacturer || 'Unknown'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Model:</span>
                        <span>{selectedResult.model || 'Unknown'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Serial Number:</span>
                        <span>{selectedResult.serial_number || 'Unknown'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Specifications</h4>
                    <div className="rounded-lg border p-3 text-sm space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Capacity:</span>
                        <span>{selectedResult.capacity || 'Unknown'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Efficiency:</span>
                        <span>
                          {selectedResult.efficiency 
                            ? `${selectedResult.efficiency} ${selectedResult.efficiency_unit || ''}` 
                            : 'Unknown'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Year:</span>
                        <span>{selectedResult.year || 'Unknown'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Condition:</span>
                        <span>{selectedResult.condition || 'Unknown'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Processing Details</h4>
                    <div className="rounded-lg border p-3 text-sm space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Confidence:</span>
                        <span>{getConfidenceBadge(selectedResult.confidence)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Extracted At:</span>
                        <span>{formatDate(selectedResult.extracted_at)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Processing Time:</span>
                        <span>{selectedResult.processing_time ? `${selectedResult.processing_time}ms` : 'Unknown'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Application Status</h4>
                    <div className="rounded-lg border p-3 text-sm space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Applied:</span>
                        <span>{selectedResult.is_applied ? 'Yes' : 'No'}</span>
                      </div>
                      {selectedResult.applied_to_equipment_id && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Applied To Equipment:</span>
                          <span>
                            {(() => {
                              const equipInfo = getEquipmentInfo(selectedResult.applied_to_equipment_id);
                              return equipInfo.name;
                            })()}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Batch ID:</span>
                        <span>{selectedResult.batch_id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Result ID:</span>
                        <span>{selectedResult.id}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Add suggested matches section to details */}
                {!selectedResult.is_applied && selectedResult.suggested_matches && selectedResult.suggested_matches.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold">Suggested Matches</h4>
                    <div className="space-y-2 mt-2">
                      {selectedResult.suggested_matches
                        .sort((a, b) => b.matchScore - a.matchScore) // Sort by confidence score (highest first)
                        .map((match, idx) => {
                        const equipInfo = getEquipmentInfo(match.equipmentId);
                        return (
                          <div key={idx} className="flex items-center justify-between bg-zinc-800 p-2 rounded-md">
                            <div className="flex items-center gap-2">
                              <Badge className={
                                match.matchScore >= 0.8 ? "bg-emerald-500" : 
                                match.matchScore >= 0.5 ? "bg-amber-500" : 
                                "bg-zinc-700 text-white"
                              }>
                                {`${(match.matchScore * 100).toFixed(0)}%`}
                              </Badge>
                              <div>
                                <div className="font-medium">{equipInfo.name}</div>
                                <div className="text-xs text-muted-foreground">{match.reasoning}</div>
                              </div>
                            </div>
                            <Button 
                              size="sm" 
                              onClick={() => {
                                handleEquipmentSelected(match.equipmentId);
                                setDetailsVisible(false);
                              }}
                              className={match.matchScore >= 0.8 
                                ? "bg-emerald-600 hover:bg-emerald-700"
                                : "bg-zinc-700 hover:bg-zinc-600"
                              }
                            >
                              {match.matchScore >= 0.8 && <Zap className="mr-1 h-4 w-4" />}
                              Apply Match
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <DialogFooter className="space-x-2">
              {!selectedResult?.is_applied && (
                <Button 
                  variant="default"
                  onClick={() => {
                    showEquipmentSelectionModal(selectedResult!);
                    setDetailsVisible(false);
                  }}
                >
                  Select Equipment
                </Button>
              )}
              <Button 
                variant="secondary" 
                onClick={() => setDetailsVisible(false)}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Equipment Selection Modal */}
        <EquipmentSelectionModal
          isOpen={selectionModalVisible}
          onClose={() => setSelectionModalVisible(false)}
          onEquipmentSelected={handleEquipmentSelected}
          projectId={projectId}
          metadataResult={resultToApply}
        />
        
        {/* Photo Lightbox */}
        <PhotoLightbox 
          imageUrl={selectedPhoto} 
          isOpen={photoLightboxOpen} 
          onClose={() => setPhotoLightboxOpen(false)} 
        />
      </div>
    </TooltipProvider>
  );
}; 