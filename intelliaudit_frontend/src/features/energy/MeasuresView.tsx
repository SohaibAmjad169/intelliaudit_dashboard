import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, AlertCircle, Lightbulb, Camera, Info, X } from 'lucide-react';
import { EquipmentItem } from './types';
import { Measure, generateMeasureRecommendations, regenerateMeasureRecommendations } from '@/services/energy-analysis/measures-service';
import { useToast } from '@/components/ui/use-toast';
import { fetchTotalUtilityUsage } from '@/services/energy-analysis';
import { usePhotoManagement } from '@/hooks/usePhotoManagement';
import { Photo } from '@/types/eco';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ClickablePhotoIdProps {
  text: string;
  photos: Photo[];
}

interface TextPart {
  type: 'text';
  content: string;
}

interface UuidPart {
  type: 'uuid';
  content: string;
  uuid: string;
}

interface ImageUrlPart {
  type: 'image';
  content: string;
  url: string;
}

type TextPartType = TextPart | UuidPart | ImageUrlPart;

const ClickablePhotoId: React.FC<ClickablePhotoIdProps> = ({ text, photos }) => {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);

  // Combined regex for UUIDs and image URLs
  const combinedRegex = /(Photo ID ([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}))|(Photo URL (https?:\/\/[^\s]+(?:\.jpg|\.jpeg|\.png|\.gif)))|((https?:\/\/[^\s]+(?:\.jpg|\.jpeg|\.png|\.gif)))/gi;

  const parts: TextPartType[] = [];
  let lastIndex = 0;
  let match;

  while ((match = combinedRegex.exec(text)) !== null) {
    // Add the text before the match
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: text.substring(lastIndex, match.index)
      });
    }

    // Check if it's a UUID match (group 1)
    if (match[1]) {
      parts.push({
        type: 'uuid',
        content: match[1],
        uuid: match[2]
      });
    } 
    // Check if it's a "Photo URL" match (group 3)
    else if (match[3]) {
      parts.push({
        type: 'image',
        content: 'View Photo',
        url: match[4]
      });
    }
    // Otherwise it's just an image URL (group 5)
    else if (match[5]) {
      parts.push({
        type: 'image',
        content: 'View Photo',
        url: match[5]
      });
    }

    lastIndex = match.index + match[0].length;
  }

  // Add the remaining text
  if (lastIndex < text.length) {
    parts.push({
      type: 'text',
      content: text.substring(lastIndex)
    });
  }

  const handlePhotoClick = (uuid: string) => {
    const photo = photos.find(p => p.id === uuid);
    if (photo) {
      setSelectedPhoto(photo);
    }
  };

  const handleImageClick = (url: string) => {
    setSelectedImageUrl(url);
  };

  return (
    <>
      {parts.map((part, index) => {
        if (part.type === 'text') {
          return <span key={index}>{part.content}</span>;
        } else if (part.type === 'uuid') {
          return (
            <button
              key={index}
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium inline-flex items-center gap-1"
              onClick={() => handlePhotoClick(part.uuid)}
            >
              <Camera className="h-4 w-4" /> {part.content}
            </button>
          );
        } else if (part.type === 'image') {
          return (
            <button
              key={index}
              className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/20 rounded"
              onClick={() => handleImageClick(part.url)}
              title={part.url}
            >
              <Camera className="h-4 w-4" /> {part.content}
            </button>
          );
        }
        return null;
      })}

      {/* Modal for direct image URLs */}
      {selectedImageUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold text-foreground">Image Preview</h3>
              <button 
                onClick={() => setSelectedImageUrl(null)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            <div className="p-4">
              <img 
                src={selectedImageUrl} 
                alt="Preview" 
                className="max-w-full max-h-[80vh] object-contain mx-auto"
                onError={(e) => {
                  e.currentTarget.src = 'path-to-fallback-image.jpg';
                  e.currentTarget.alt = 'Image failed to load';
                }}
              />
              <div className="mt-4 text-sm text-gray-600 dark:text-gray-400 break-all">
                {selectedImageUrl}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

interface MeasuresViewProps {
  projectId: string;
  equipment?: EquipmentItem[];
  initialMeasures?: {
    eems: Measure[];
    wems: Measure[];
    rcms: Measure[];
    customMeasures: Measure[];
  };
  publicView?: boolean;
}

export const MeasuresView: React.FC<MeasuresViewProps> = ({
  projectId,
  equipment = [],
  initialMeasures,
  publicView
}) => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // State for different measure types
  const [eems, setEems] = useState<Measure[]>(initialMeasures?.eems || []);
  const [wems, setWems] = useState<Measure[]>(initialMeasures?.wems || []);
  const [rcms, setRcms] = useState<Measure[]>(initialMeasures?.rcms || []);
  const [customMeasures, setCustomMeasures] = useState<Measure[]>(initialMeasures?.customMeasures || []);

  // State for utility data
  const [, setUtilityData] = useState<{
    electric?: number;
    gas?: number;
    water?: number;
  }>({});

  // State for selected measure (for detail view)
  const [selectedMeasure, setSelectedMeasure] = useState<Measure | null>(null);

  // Get project photos using the photo management hook
  const { photos } = usePhotoManagement(projectId);

  // Function to get photos by their IDs
  const getPhotosByIds = (photoIds: string[] = []): Photo[] => {
    if (!photoIds || photoIds.length === 0 || photos.length === 0) return [];
    return photos.filter(photo => photoIds.includes(photo.id));
  };

  // Fetch utility data on component mount
  useEffect(() => {
    const fetchUtilityData = async () => {
      try {
        const data = await fetchTotalUtilityUsage(projectId);
        setUtilityData({
          electric: data.totalElectric,
          gas: data.naturalGasInKWh,
          water: data.waterUsage
        });
      } catch (error) {
        console.error('Failed to fetch utility data:', error);
        // Continue without utility data
      }
    };

    fetchUtilityData();
  }, [projectId]);

  // Update measures when initialMeasures changes
  useEffect(() => {
    if (initialMeasures) {
      setEems(Array.isArray(initialMeasures.eems) ? initialMeasures.eems : []);
      setWems(Array.isArray(initialMeasures.wems) ? initialMeasures.wems : []);
      setRcms(Array.isArray(initialMeasures.rcms) ? initialMeasures.rcms : []);
      setCustomMeasures(Array.isArray(initialMeasures.customMeasures) ? initialMeasures.customMeasures : []);
    }
  }, [initialMeasures]);

  // Generate measures on component mount if none exist
  useEffect(() => {
    if (equipment.length > 0 && eems.length === 0 && wems.length === 0 && rcms.length === 0) {
      generateMeasures();
    }
  }, [equipment]);

  // Function to generate measures
  const generateMeasures = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      // Call the API to generate measures with projectId
      // The backend will fetch equipment, utility and building data using the project ID
      const result = await generateMeasureRecommendations(projectId);

      // Update state with the generated measures
      setEems(result.eems || []);
      setWems(result.wems || []);
      setRcms(result.rcms || []);
      setCustomMeasures(result.customMeasures || []);

      toast({
        title: 'Measures Generated',
        description: `Generated ${result.eems.length} EEMs, ${result.wems.length} WEMs, and ${result.rcms.length} RCMs`,
      });
    } catch (error) {
      console.error('Error generating measures:', error);
      setError('Failed to generate measures. Please try again.');

      toast({
        title: 'Error',
        description: 'Failed to generate measures. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Function to force regeneration of measures
  // This function is kept for future use but currently not called
  // The underscore prefix indicates it's intentionally unused
  // This function is currently unused but kept for future implementation
  // It will be used when the regenerate measures feature is fully implemented
  const regenerateMeasures = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      // Call the API to regenerate measures with projectId
      const result = await regenerateMeasureRecommendations(projectId);

      // Update state with the regenerated measures
      setEems(result.eems || []);
      setWems(result.wems || []);
      setRcms(result.rcms || []);
      setCustomMeasures(result.customMeasures || []);

      toast({
        title: 'Measures Regenerated',
        description: `Regenerated ${result.eems.length} EEMs, ${result.wems.length} WEMs, and ${result.rcms.length} RCMs`,
      });
    } catch (error) {
      console.error('Error regenerating measures:', error);
      setError('Failed to regenerate measures. Please try again.');

      toast({
        title: 'Error',
        description: 'Failed to regenerate measures. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // View details for a specific measure
  const viewMeasureDetails = (measure: Measure) => {
    setSelectedMeasure(measure);
  };

  // Close detail view
  const closeMeasureDetails = () => {
    setSelectedMeasure(null);
  };

  // Count total measures
  const totalMeasures = eems.length + wems.length + rcms.length + customMeasures.length;

  // Add a new MeasuresTable component
  const MeasuresTable: React.FC<{ measures: Measure[] }> = ({ measures }) => {
    if (!measures || measures.length === 0) {
      return <p className="text-muted-foreground text-center">No measures to display</p>;
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse bg-green-50 dark:bg-green-900/20">
          <thead className="bg-green-600/80 text-white dark:bg-green-800">
            <tr>
              <th className="px-4 py-2 text-left border border-green-500 font-medium">Measure</th>
              <th className="px-4 py-2 text-left border border-green-500 font-medium">Descriptions</th>
              <th className="px-4 py-2 text-center border border-green-500 font-medium">Annual Cost Savings</th>
              <th className="px-4 py-2 text-center border border-green-500 font-medium">Annual kWh Savings</th>
              <th className="px-4 py-2 text-center border border-green-500 font-medium">kW Savings</th>
              <th className="px-4 py-2 text-center border border-green-500 font-medium">Annual Therms Savings</th>
              <th className="px-4 py-2 text-center border border-green-500 font-medium">Annual Gallons Savings</th>
              <th className="px-4 py-2 text-center border border-green-500 font-medium">Simple Payback (Years)</th>
              <th className="px-4 py-2 text-center border border-green-500 font-medium">Available Incentives</th>
              <th className="px-4 py-2 text-center border border-green-500 font-medium">Net Implementation Cost</th>
              <th className="px-4 py-2 text-center border border-green-500 font-medium">Photos</th>
            </tr>
          </thead>
          <tbody>
            {measures.map((measure, index) => {
              // Determine measure type (EEM, WEM, RCM)
              const measureType =
                measure.id.startsWith('eem') ? 'EEM' :
                  measure.id.startsWith('wem') ? 'WEM' :
                    measure.id.startsWith('rcm') ? 'RCM' : 'Other';

              // Track row number for each type
              const rowNumber = measures.filter(
                (m, i) => i < index &&
                  (measureType === 'EEM' ? m.id.startsWith('eem') :
                    measureType === 'WEM' ? m.id.startsWith('wem') :
                      measureType === 'RCM' ? m.id.startsWith('rcm') : false)
              ).length + 1;

              // Calculate values with defaults
              const costSavings = measure.estimatedSavings?.cost || 0;
              const kwhSavings = measure.estimatedSavings?.energy || 0;
              const kwSavings = measure.estimatedSavings?.demand || 0;
              const thermsSavings = measure.estimatedSavings?.therms || 0;
              // Steam savings removed as requested
              const gallonsSavings = measure.estimatedSavings?.water || 0;
              const paybackYears = measure.estimatedSavings?.paybackPeriod || 0;
              const implementationCost = measure.implementationCost || 0; // Get implementation cost
              const incentives = measure.incentives || 0; // Get actual incentives
              const netCost = implementationCost - incentives; // Calculate Net Cost
              // const photoRefs = measure.photoReferences ? measure.photoReferences.join(", ") : "";

              // Different background colors for each measure type
              let bgClass = "";
              if (measureType === 'EEM') {
                bgClass = "bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30";
              } else if (measureType === 'WEM') {
                bgClass = "bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30";
              } else if (measureType === 'RCM') {
                bgClass = "bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30";
              } else {
                bgClass = "bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700";
              }

              return (
                <tr key={measure.id} className={bgClass} onClick={() => viewMeasureDetails(measure)}>
                  <td className="px-4 py-2 border border-green-200 dark:border-green-800 font-medium cursor-pointer">
                    <span className={`text-xs px-1 rounded ${measureType === 'EEM' ? 'text-green-800 dark:text-green-300' : measureType === 'WEM' ? 'text-blue-800 dark:text-blue-300' : measureType === 'RCM' ? 'text-purple-800 dark:text-purple-300' : 'text-gray-800 dark:text-gray-300'}`}>{measureType}</span> {rowNumber}
                  </td>
                  <td className="px-4 py-2 border border-green-200 dark:border-green-800 text-sm cursor-pointer">{measure.title}</td>
                  <td className="px-4 py-2 border border-green-200 dark:border-green-800 text-right cursor-pointer">${costSavings.toLocaleString()}</td>
                  <td className="px-4 py-2 border border-green-200 dark:border-green-800 text-right cursor-pointer">{kwhSavings.toLocaleString()}</td>
                  <td className="px-4 py-2 border border-green-200 dark:border-green-800 text-right cursor-pointer">{kwSavings.toLocaleString()}</td>
                  <td className="px-4 py-2 border border-green-200 dark:border-green-800 text-right cursor-pointer">{thermsSavings.toLocaleString()}</td>
                  <td className="px-4 py-2 border border-green-200 dark:border-green-800 text-right cursor-pointer">{gallonsSavings.toLocaleString()}</td>
                  <td className="px-4 py-2 border border-green-200 dark:border-green-800 text-right cursor-pointer">{Math.round(paybackYears)}</td>
                  <td className="px-4 py-2 border border-green-200 dark:border-green-800 text-right cursor-pointer">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>${incentives.toLocaleString()}</TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs text-sm">
                            {measure.calculationNotes ? (
                              <ClickablePhotoId text={measure.calculationNotes} photos={photos} />
                            ) : 'No calculation notes available.'}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </td>
                  <td className="px-4 py-2 border border-green-200 dark:border-green-800 text-right cursor-pointer">${netCost.toLocaleString()}</td>
                  <td className="px-4 py-2 border border-green-200 dark:border-green-800 text-center cursor-pointer">
                    {measure.photoReferences && measure.photoReferences.length > 0 ? (
                      <div className="flex items-center justify-center">
                        <Camera className="h-4 w-4 mr-1" />
                        <span>{measure.photoReferences.length}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              );
            })}

            {/* Add a total row at the bottom */}
            <tr className="bg-green-100 dark:bg-green-900/50 font-bold">
              <td className="px-4 py-2 border border-green-200 dark:border-green-800" colSpan={2}>TOTAL</td>
              <td className="px-4 py-2 border border-green-200 dark:border-green-800 text-right">
                ${measures.reduce((sum, m) => sum + (m.estimatedSavings?.cost || 0), 0).toLocaleString()}
              </td>
              <td className="px-4 py-2 border border-green-200 dark:border-green-800 text-right">
                {measures.reduce((sum, m) => sum + (m.estimatedSavings?.energy || 0), 0).toLocaleString()}
              </td>
              <td className="px-4 py-2 border border-green-200 dark:border-green-800 text-right">
                {measures.reduce((sum, m) => sum + (m.estimatedSavings?.demand || 0), 0).toLocaleString()}
              </td>
              <td className="px-4 py-2 border border-green-200 dark:border-green-800 text-right">
                {measures.reduce((sum, m) => sum + (m.estimatedSavings?.therms || 0), 0).toLocaleString()}
              </td>
              <td className="px-4 py-2 border border-green-200 dark:border-green-800 text-right">
                {measures.reduce((sum, m) => sum + (m.estimatedSavings?.water || 0), 0).toLocaleString()}
              </td>
              <td className="px-4 py-2 border border-green-200 dark:border-green-800 text-right">-</td>
              <td className="px-4 py-2 border border-green-200 dark:border-green-800 text-right">
                ${measures.reduce((sum, m) => sum + Number(m.incentives || 0), 0).toLocaleString()}
              </td>
              <td className="px-4 py-2 border border-green-200 dark:border-green-800 text-right">
                ${measures.reduce((sum, m) => sum + (Number(m.implementationCost || 0) - Number(m.incentives || 0)), 0).toLocaleString()}
              </td>
              <td className="px-4 py-2 border border-green-200 dark:border-green-800 text-right">-</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  // Detailed view for a selected measure
  const MeasureDetails: React.FC<{ measure: Measure; onClose: () => void }> = ({ measure, onClose }) => {
    // Get photos associated with this measure
    const measurePhotos = getPhotosByIds(measure.photoReferences);

    return (
      <div className="bg-white dark:bg-gray-900 p-5 rounded-lg shadow-lg max-w-4xl mx-auto relative">
        <Button 
          onClick={onClose} 
          variant="ghost" 
          size="icon"
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <X className="h-5 w-5" />
        </Button>
        <h2 className="text-2xl font-bold mb-4">{measure.title}</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Existing Condition</h3>
            <p className="text-gray-700 dark:text-gray-300">
              <ClickablePhotoId text={measure.existingCondition} photos={photos} />
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Recommendation</h3>
            <p className="text-gray-700 dark:text-gray-300">
              <ClickablePhotoId text={measure.recommendation} photos={photos} />
            </p>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold text-foreground mb-2">Benefits</h3>
          <ul className="list-disc ml-5">
            {measure.benefits.map((benefit, index) => (
              <li key={index} className="text-gray-700 dark:text-gray-300">
                <ClickablePhotoId text={benefit} photos={photos} />
              </li>
            ))}
          </ul>
        </div>

        {measure.implementationNotes && (
          <div className="mb-6 bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center">
              <Info className="h-5 w-5 mr-2 text-amber-600" />
              Implementation Notes
            </h3>
            <p className="text-gray-700 dark:text-gray-300">
              <ClickablePhotoId text={measure.implementationNotes} photos={photos} />
            </p>
          </div>
        )}

        {measure.calculationNotes && (
          <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center">
              <Info className="h-5 w-5 mr-2 text-blue-600" />
              Savings & Incentive Calculation Notes
            </h3>
            <p className="text-gray-700 dark:text-gray-300">
              <ClickablePhotoId text={measure.calculationNotes} photos={photos} />
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-foreground mb-2">Cost Savings</h3>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">
              ${measure.estimatedSavings?.cost?.toLocaleString() || '0'}
            </p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-foreground mb-2">Energy Savings</h3>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {measure.estimatedSavings?.energy?.toLocaleString() || '0'} kWh
            </p>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-foreground mb-2">Payback Period</h3>
            <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
              {Math.round(measure.estimatedSavings?.paybackPeriod || 0)} years
            </p>
          </div>
        </div>

        {/* Display photos from the project that match the photoReferences */}
        {measurePhotos.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-foreground mb-2">Referenced Photos</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {measurePhotos.map(photo => (
                <div key={photo.id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <img
                    src={photo.url}
                    alt={photo.caption || 'Equipment photo'}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-3 bg-white dark:bg-gray-800">
                    <p className="text-sm font-medium">{photo.caption || 'Equipment photo'}</p>
                    {photo.location && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Location: {photo.location}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Display raw photo references if photos aren't found */}
        {measure.photoReferences && measure.photoReferences.length > 0 && measurePhotos.length === 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-foreground mb-2">Photo References</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {measure.photoReferences.map((photoRef, index) => {
                const urlMatch = photoRef.match(/https?:\/\/[^\s]+/);
                const imageUrl = urlMatch ? urlMatch[0] : null;

                return (
                  <div key={index} className="border rounded-lg overflow-hidden">
                    {imageUrl ? (
                      <>
                        <img
                          src={imageUrl}
                          alt={`Reference ${index + 1}`}
                          className="w-full h-48 object-cover"
                        />
                      </>
                    ) : (
                      <div className="p-4 bg-gray-100 dark:bg-gray-800">
                        <p className="text-gray-700 dark:text-gray-300">Invalid image URL</p>
                        <ClickablePhotoId text={`Photo ID ${photoRef}`} photos={photos} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Keep the original supporting images if they exist */}
        {measure.supportingImages && (Object.keys(measure.supportingImages).length > 0) && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-foreground mb-2">Supporting Images</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {measure.supportingImages.existing && (
                <div>
                  <h4 className="text-md font-medium mb-1">Existing Condition</h4>
                  <img src={measure.supportingImages.existing} alt="Existing condition" className="rounded-lg w-full h-48 object-cover" />
                </div>
              )}
              {measure.supportingImages.replacement && (
                <div>
                  <h4 className="text-md font-medium mb-1">Recommended Replacement</h4>
                  <img src={measure.supportingImages.replacement} alt="Recommended replacement" className="rounded-lg w-full h-48 object-cover" />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Display a message when no measures are found
  const EmptyMeasuresState = () => (
    <div className="text-center p-8">
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-4">
            <Lightbulb className="h-12 w-12 text-amber-500" />
            <h3 className="text-xl font-medium">No Measures Found</h3>
            <p className="text-muted-foreground max-w-md">
              No energy efficiency measures have been generated yet.
              Use the Regenerate button to analyze your equipment data and generate recommendations.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="px-6 space-y-6">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Header section with Title, Count, and Regenerate Button */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl  text-foreground font-bold">Energy Conservation Measures</h2>
          {totalMeasures > 0 && (
            <Badge variant="secondary">{totalMeasures} Measures</Badge>
          )}
        </div>
        {!publicView && totalMeasures > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={regenerateMeasures}
            disabled={isGenerating}
          >
            {isGenerating ? (
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
        )}
      </div>

      {/* Main Content Area - Removed Tabs structure */}
      <div> 
        {isGenerating && totalMeasures === 0 ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 text-emerald-500 animate-spin mr-2" />
            <span>Generating measures based on your equipment data...</span>
          </div>
        ) : selectedMeasure ? (
          <MeasureDetails
            measure={selectedMeasure}
            onClose={closeMeasureDetails} // Use the close handler
          />
        ) : totalMeasures === 0 && !isGenerating ? (
          <EmptyMeasuresState />
        ) : (
          // Display the table directly if measures exist and none are selected
          <div>
            <p className="text-sm text-muted-foreground mb-2 text-center italic">
              Click on a measure row to view details.
            </p>
            <MeasuresTable
              measures={[...eems, ...wems, ...rcms, ...customMeasures]}
            />
          </div>
        )}
      </div>
    </div>
  );
}; 