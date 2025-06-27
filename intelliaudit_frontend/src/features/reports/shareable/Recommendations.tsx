import React from 'react';
import { FileText, Lightbulb, Droplet, Gauge, Camera, CheckCircle2, Building, Waves, Thermometer, Calculator, Wrench, Info, AlertTriangle, ArrowUpDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { EcoData, ReportData } from './types';
import { useMeasures, DetailedMeasure } from '@/hooks/useMeasures';
import { usePhotoManagement } from '@/hooks/usePhotoManagement';
import { Photo } from '@/types/eco';

interface RecommendationsProps {
  ecoData: EcoData;
  reportData?: ReportData;
  projectId: string;
}

// Get color theme and icons for each measure type
const getMeasureTypeStyles = (type: string) => {
  switch (type) {
    case 'eem':
      return {
        icon: <Lightbulb className="h-5 w-5 text-emerald-500" />,
        title: 'Energy Efficiency Measures',
        titleColor: 'text-emerald-700 dark:text-emerald-400',
        badgeBg: 'bg-emerald-100 dark:bg-emerald-900/30',
        badgeText: 'text-emerald-800 dark:text-emerald-300',
        headerBg: 'bg-emerald-50 dark:bg-emerald-900/20',
        headerBorder: 'border-emerald-200 dark:border-emerald-800/30',
        cardBg: 'bg-white dark:bg-gray-800',
        cardBorder: 'border-emerald-200 dark:border-emerald-900/30',
        placeholder: 'https://via.placeholder.com/300x200?text=Energy+Efficiency'
      };
    case 'wem':
      return {
        icon: <Droplet className="h-5 w-5 text-blue-500" />,
        title: 'Water Efficiency Measures',
        titleColor: 'text-blue-700 dark:text-blue-400',
        badgeBg: 'bg-blue-100 dark:bg-blue-900/30',
        badgeText: 'text-blue-800 dark:text-blue-300',
        headerBg: 'bg-blue-50 dark:bg-blue-900/20',
        headerBorder: 'border-blue-200 dark:border-blue-800/30',
        cardBg: 'bg-white dark:bg-gray-800',
        cardBorder: 'border-blue-200 dark:border-blue-900/30',
        placeholder: 'https://via.placeholder.com/300x200?text=Water+Efficiency'
      };
    case 'rcm':
      return {
        icon: <Gauge className="h-5 w-5 text-purple-500" />,
        title: 'Retrocommissioning Measures',
        titleColor: 'text-purple-700 dark:text-purple-400',
        badgeBg: 'bg-purple-100 dark:bg-purple-900/30',
        badgeText: 'text-purple-800 dark:text-purple-300',
        headerBg: 'bg-purple-50 dark:bg-purple-900/20',
        headerBorder: 'border-purple-200 dark:border-purple-800/30',
        cardBg: 'bg-white dark:bg-gray-800',
        cardBorder: 'border-purple-200 dark:border-purple-900/30',
        placeholder: 'https://via.placeholder.com/300x200?text=Retro+Commissioning'
      };
    default:
      return {
        icon: <CheckCircle2 className="h-5 w-5 text-gray-500" />,
        title: 'Additional Recommendations',
        titleColor: 'text-gray-700 dark:text-gray-400',
        badgeBg: 'bg-gray-100 dark:bg-gray-800/30',
        badgeText: 'text-gray-800 dark:text-gray-300',
        headerBg: 'bg-gray-50 dark:bg-gray-800/20',
        headerBorder: 'border-gray-200 dark:border-gray-700',
        cardBg: 'bg-white dark:bg-gray-800',
        cardBorder: 'border-gray-200 dark:border-gray-700',
        placeholder: 'https://via.placeholder.com/300x200?text=Recommendation'
      };
  }
};

// Category icons for different measure subcategories
const getCategoryIcon = (category?: string) => {
  switch (category?.toLowerCase()) {
    case 'lighting':
      return <Lightbulb className="h-4 w-4 text-amber-500" />;
    case 'hvac':
    case 'heating':
    case 'cooling':
      return <Thermometer className="h-4 w-4 text-red-500" />;
    case 'envelope':
    case 'building envelope':
      return <Building className="h-4 w-4 text-indigo-500" />;
    case 'water':
    case 'plumbing':
      return <Droplet className="h-4 w-4 text-blue-500" />;
    case 'ventilation':
      return <Waves className="h-4 w-4 text-cyan-500" />;
    case 'motors':
    case 'pumps':
    case 'mechanical':
      return <Wrench className="h-4 w-4 text-orange-500" />;
    case 'controls':
    case 'automation':
      return <Gauge className="h-4 w-4 text-emerald-500" />;
    case 'renewable':
    case 'renewable energy':
      return <Waves className="h-4 w-4 text-green-500" />;
    default:
      return <Info className="h-4 w-4 text-gray-500" />;
  }
};

export const Recommendations: React.FC<RecommendationsProps> = ({ ecoData, projectId }) => {
  // Fetch measures using our custom hook
  const { eems, wems, rcms, isLoading, error } = useMeasures(projectId);
  
  // Get project photos using the photo management hook
  const { photos } = usePhotoManagement(projectId);
  
  // Function to get photos by their IDs
  const getPhotosByIds = (photoIds: string[] = []): Photo[] => {
    if (!photoIds || photoIds.length === 0 || photos.length === 0) return [];
    return photos.filter(photo => photoIds.includes(photo.id));
  };
  
  // Count total measures
  const totalMeasures = eems.length + wems.length + rcms.length + (ecoData.recommendations?.length || 0);
  
  // Utility formatting functions
  const formatCurrency = (value?: number): string => {
    if (value === undefined || value === null) return 'N/A';
    return `$${value.toLocaleString()}`;
  };
  
  const formatNumber = (value?: number): string => {
    if (value === undefined || value === null) return 'N/A';
    return value.toLocaleString();
  };

  const renderMeasureCategory = (measures: DetailedMeasure[], type: string) => {
    if (!measures || measures.length === 0) return null;
    
    const styles = getMeasureTypeStyles(type);
    
    return (
      <div className="mb-10 break-inside-avoid">
        <div className={`flex items-center justify-between mb-4 px-4 py-3 rounded-md ${styles.headerBg} border ${styles.headerBorder}`}>
          <div className="flex items-center">
            {styles.icon}
            <h3 className={`ml-2 text-lg font-semibold ${styles.titleColor}`}>
              {styles.title}
            </h3>
          </div>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles.badgeBg} ${styles.badgeText}`}>
            {measures.length}
          </span>
        </div>
        
        <div className="space-y-8">
          {measures.map((measure, index) => {
            // Get photos associated with this measure
            const measurePhotos = getPhotosByIds(measure.photoReferences);
            
            return (
              <div 
                key={measure.id || index} 
                className={`rounded-lg border ${styles.cardBorder} ${styles.cardBg} overflow-hidden shadow-sm break-inside-avoid`}
              >
                {/* Measure Header */}
                <div className={`px-4 py-3 flex items-center justify-between ${styles.headerBg} border-b ${styles.headerBorder}`}>
                  <div className="flex items-center">
                    {styles.icon}
                    <span className={`ml-2 font-medium ${styles.titleColor}`}>{type.toUpperCase()} {index + 1}</span>
                    
                    {measure.category && (
                      <div className="flex items-center ml-4 bg-white/50 dark:bg-gray-800/50 rounded-full px-2 py-0.5 text-xs">
                        {getCategoryIcon(measure.category)}
                        <span className="ml-1 text-gray-700 dark:text-gray-300">{measure.category}</span>
                      </div>
                    )}
                  </div>
                  
                  {measure.priority && (
                    <div className={`px-2 py-1 text-xs font-medium rounded-full 
                      ${measure.priority === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : 
                      measure.priority === 'medium' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' : 
                      'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'}`}>
                      {measure.priority.charAt(0).toUpperCase() + measure.priority.slice(1)} Priority
                    </div>
                  )}
                </div>
                
                {/* Main Content */}
                <div className="p-5">
                  {/* Title and Description */}
                  <h4 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                    {measure.title}
                  </h4>
                  
                  {measure.recommendation && (
                    <p className="text-gray-700 dark:text-gray-300 mb-5 text-base">
                      {measure.recommendation}
                    </p>
                  )}
                  
                  {/* Display photos if available */}
                  {measurePhotos.length > 0 && (
                    <div className="mb-4">
                      <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                        <Camera className="h-4 w-4 mr-1 text-blue-500" />
                        Referenced Photos
                      </h5>
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
                  
                  {/* Existing Condition and Recommendation */}
                  <div className="space-y-4">
                    {/* Existing Condition */}
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                      <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Existing Condition</h5>
                      <p className="text-gray-700 dark:text-gray-300 text-sm">{measure.existingCondition}</p>
                      
                      {(measure.existingEfficiency || measure.existingCapacity || measure.existingAge) && (
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 grid grid-cols-2 gap-3 text-xs">
                          {measure.existingEfficiency && (
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Efficiency: </span>
                              <span className="font-medium text-gray-700 dark:text-gray-300">{measure.existingEfficiency}</span>
                            </div>
                          )}
                          {measure.existingCapacity && (
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Capacity: </span>
                              <span className="font-medium text-gray-700 dark:text-gray-300">{measure.existingCapacity}</span>
                            </div>
                          )}
                          {measure.existingAge && (
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Age: </span>
                              <span className="font-medium text-gray-700 dark:text-gray-300">{measure.existingAge} years</span>
                            </div>
                          )}
                          {measure.existingRemainingLife && (
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Remaining Life: </span>
                              <span className="font-medium text-gray-700 dark:text-gray-300">{measure.existingRemainingLife} years</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Recommendation */}
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg border border-emerald-200 dark:border-emerald-900/30">
                      <h5 className="text-sm font-medium text-emerald-700 dark:text-emerald-400 mb-2">Recommendation</h5>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {measure.priority || 'medium'} priority
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {measure.category || 'General'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        {measure.recommendation}
                      </p>
                      
                      {(measure.recommendedEfficiency || measure.recommendedCapacity) && (
                        <div className="mt-3 pt-3 border-t border-emerald-200 dark:border-emerald-900/30 grid grid-cols-2 gap-3 text-xs">
                          {measure.recommendedEfficiency && (
                            <div>
                              <span className="text-emerald-600 dark:text-emerald-400">Recommended Efficiency: </span>
                              <span className="font-medium text-gray-700 dark:text-gray-300">{measure.recommendedEfficiency}</span>
                            </div>
                          )}
                          {measure.recommendedCapacity && (
                            <div>
                              <span className="text-emerald-600 dark:text-emerald-400">Recommended Capacity: </span>
                              <span className="font-medium text-gray-700 dark:text-gray-300">{measure.recommendedCapacity}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Calculation Methodology (if provided) */}
                    {measure.calculationMethodology && (
                      <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-200 dark:border-amber-900/30">
                        <h5 className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-1 flex items-center">
                          <Calculator className="h-3 w-3 mr-1" />
                          Calculation Methodology
                        </h5>
                        <p className="text-gray-700 dark:text-gray-300 text-xs">{measure.calculationMethodology}</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Financial Analysis */}
                  <div className="mb-6">
                    <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                      <ArrowUpDown className="h-4 w-4 mr-1 text-emerald-500" />
                      Financial Analysis
                    </h5>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {/* Annual Savings */}
                      <div className="bg-white dark:bg-gray-800/80 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Annual Savings</div>
                        <div className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(measure.estimatedSavings?.cost || 0)}
                        </div>
                      </div>
                      
                      {/* Resource Savings */}
                      <div className="bg-white dark:bg-gray-800/80 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          {type === 'eem' ? 'Energy Savings' : 
                           type === 'wem' ? 'Water Savings' : 
                           'Resource Savings'}
                        </div>
                        <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                          {type === 'eem' && measure.estimatedSavings?.energy ? 
                            `${formatNumber(measure.estimatedSavings.energy)} kWh` : 
                           type === 'wem' && measure.estimatedSavings?.water ? 
                            `${formatNumber(measure.estimatedSavings.water)} gallons` : 
                           measure.estimatedSavings?.therms ? 
                            `${formatNumber(measure.estimatedSavings.therms)} therms` :
                            'N/A'}
                        </div>
                        
                        {measure.estimatedSavings?.demand && type === 'eem' && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Demand Reduction: {formatNumber(measure.estimatedSavings.demand)} kW
                          </div>
                        )}
                      </div>
                      
                      {/* Payback Period */}
                      <div className="bg-white dark:bg-gray-800/80 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Payback Period</div>
                        <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                          {measure.estimatedSavings?.paybackPeriod ? 
                            `${measure.estimatedSavings.paybackPeriod.toFixed(1)} years` : 
                            'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Benefits */}
                  {measure.benefits && measure.benefits.length > 0 && (
                    <div className="mb-5">
                      <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                        <CheckCircle2 className="h-4 w-4 mr-1 text-emerald-500" />
                        Benefits
                      </h5>
                      <ul className="list-disc text-gray-600 dark:text-gray-400 pl-5 space-y-1 text-sm">
                        {measure.benefits.map((benefit, idx) => (
                          <li key={idx}>{benefit}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Implementation Notes */}
                  {measure.implementationNotes && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-900/30 mb-4">
                      <h5 className="text-sm font-medium text-blue-700 dark:text-blue-400 mb-1 flex items-center">
                        <Wrench className="h-4 w-4 mr-1" />
                        Implementation Notes
                      </h5>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {measure.implementationNotes || measure.recommendation}
                      </p>
                    </div>
                  )}
                  
                  {/* Applicable Codes/Standards and Rebate Programs */}
                  {(measure.applicableCodes?.length || measure.rebatePrograms?.length) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                      {measure.applicableCodes?.length && (
                        <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                          <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Applicable Codes</h5>
                          <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                            {measure.applicableCodes.map((code, idx) => (
                              <li key={idx}>{code}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {measure.rebatePrograms?.length && (
                        <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg border border-purple-200 dark:border-purple-900/30">
                          <h5 className="text-xs font-medium text-purple-700 dark:text-purple-400 mb-1">Available Rebates</h5>
                          <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                            {measure.rebatePrograms.map((program, idx) => (
                              <li key={idx}>{program}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Assumptions (if provided) */}
                  {measure.assumptionsUsed && measure.assumptionsUsed.length > 0 && (
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                      <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center">
                        <AlertTriangle className="h-3 w-3 mr-1 text-amber-500" />
                        Assumptions Used
                      </h5>
                      <ul className="text-xs text-gray-600 dark:text-gray-400 pl-4 list-disc space-y-0.5">
                        {measure.assumptionsUsed.map((assumption, idx) => (
                          <li key={idx}>{assumption}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render additional recommendations from ecoData
  const renderAdditionalRecommendations = () => {
    if (!ecoData.recommendations || ecoData.recommendations.length === 0) return null;
    
    const styles = getMeasureTypeStyles('other');
    
    return (
      <div className="mb-10">
        <div className={`flex items-center justify-between mb-4 px-4 py-3 rounded-md ${styles.headerBg} border ${styles.headerBorder}`}>
          <div className="flex items-center">
            {styles.icon}
            <h3 className={`ml-2 text-lg font-semibold ${styles.titleColor}`}>
              {styles.title}
            </h3>
          </div>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles.badgeBg} ${styles.badgeText}`}>
            {ecoData.recommendations.length}
          </span>
        </div>
        
        <div className="space-y-6">
          {ecoData.recommendations.map((recommendation, index) => (
            <div 
              key={index} 
              className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden shadow-sm"
            >
              <div className="px-4 py-3 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                  <CheckCircle2 className="h-5 w-5 text-gray-500" />
                  <span className="ml-2 font-medium text-gray-700 dark:text-gray-300">Recommendation {index + 1}</span>
                </div>
                
                {recommendation.priority && (
                  <div className={`px-2 py-1 text-xs font-medium rounded-full 
                    ${recommendation.priority === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : 
                    recommendation.priority === 'medium' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' : 
                    'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'}`}>
                    {recommendation.priority.charAt(0).toUpperCase() + recommendation.priority.slice(1)} Priority
                  </div>
                )}
              </div>
              
              <div className="p-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {recommendation.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {recommendation.recommendation || recommendation.description || 'No description available'}
                  </p>
                </div>
                
                {/* Cost & Savings Information */}
                <div className="grid grid-cols-1 gap-3 mt-4">
                  <div className="bg-white dark:bg-gray-800/80 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Estimated Savings</div>
                    <div className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                      {typeof recommendation.estimatedSavings === 'number' ? 
                        formatCurrency(recommendation.estimatedSavings) : 
                        (recommendation.estimatedSavings || 'N/A')}
                    </div>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-800/80 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Implementation Cost</div>
                    <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                      {typeof recommendation.implementationCost === 'number' ? 
                        formatCurrency(recommendation.implementationCost) : 
                        (recommendation.implementationCost || 'N/A')}
                    </div>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-800/80 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Payback Period</div>
                    <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                      {recommendation.paybackPeriod || 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-8">
        <div className="flex justify-center items-center h-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-400">Loading energy conservation measures...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-8">
        <div className="text-center py-6">
          <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">Failed to Load Measures</h3>
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-8">
      <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white flex items-center">
        <FileText className="h-5 w-5 mr-2 text-emerald-500" />
        Energy Conservation Measures
        <span className="ml-2 px-2 py-1 text-xs font-medium rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-800/20 dark:text-emerald-400">
          {totalMeasures} measures
        </span>
      </h2>
      
      {totalMeasures > 0 ? (
        <div>
          {renderMeasureCategory(eems, 'eem')}
          {renderMeasureCategory(wems, 'wem')}
          {renderMeasureCategory(rcms, 'rcm')}
          {renderAdditionalRecommendations()}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-600 dark:text-gray-400">
          <Lightbulb className="h-10 w-10 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
          <p>No energy conservation measures available for this project.</p>
        </div>
      )}
    </div>
  );
};

export default Recommendations; 