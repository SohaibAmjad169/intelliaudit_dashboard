import React, { useState, useEffect, useRef } from 'react';
import { apiClient } from '@/services/common/api-client';
// Project metadata service removed as it's legacy
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Building2, 
  // Info, 
  RefreshCw, 
  ExternalLink,
  Droplets,
  Flame,
  Zap,
  CircleDot,
  CheckCircle,
  Clock
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from 'sonner';
// Lodash isEqual removed as it's not being used

interface PortfolioManagerFormProps {
  projectId: string;
  portfolioManagerId?: string;
  onDataLoaded?: (isComplete: boolean, metadata?: any) => void;
}

// Add this type definition for the Portfolio Manager API response
interface PortfolioManagerResponse {
  success?: boolean;
  message?: string;
  data?: any;
  source?: string;
  property?: {
    postal_code?: string;
    [key: string]: any;
  };
  meters?: any[];
  utilityData?: any[];
  rollingAverages?: any[];
  [key: string]: any;
}

const PortfolioManagerForm: React.FC<PortfolioManagerFormProps> = ({ 
  projectId, 
  portfolioManagerId,
  onDataLoaded 
}) => {
  // Rendering component
  
  const [propertyId, setPropertyId] = useState<string>(portfolioManagerId || '');
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('property');
  
  // Year selection
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear - 1);
  const availableYears = Array.from({ length: 5 }, (_, i) => currentYear - i);

  // Add state to track the last saved metadata
  const [lastSavedMetadata, setLastSavedMetadata] = useState<any>(null);
  // Add a debounce ref to prevent multiple rapid calls
  const metadataUpdateTimerRef = useRef<number | null>(null);
  // Debug counter to track render cycles
  const renderCount = useRef(0);

  // State to track initial loading
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [detailedDataLoading, setDetailedDataLoading] = useState<boolean>(false);
  const [basicData, setBasicData] = useState<any>(null);

  // Calculate date range for utility data (13 months)
  const endDate = new Date();
  const startDate = new Date(endDate);
  startDate.setMonth(startDate.getMonth() - 13); // Go back 13 months

  // Log a more focused message on render for debugging
  useEffect(() => {
    renderCount.current += 1;
  });

  // Helper function to get icon for meter type
  const getMeterTypeIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'electric':
      case 'electricity':
        return <Zap className="h-4 w-4 text-yellow-500" />;
      case 'natural gas':
        return <Flame className="h-4 w-4 text-orange-500" />;
      case 'water':
        return <Droplets className="h-4 w-4 text-blue-500" />;
      default:
        return <CircleDot className="h-4 w-4 text-gray-500" />;
    }
  };

  // Group utility data by meter type for display
  const groupUtilityDataByMeterType = (dataArray: any[] = []) => {
    // Get utility data from either data.utilityData or directly from data if it's an array
    const utilityData = dataArray || [];
    
    if (!utilityData || utilityData.length === 0) return {};
    
    const grouped: Record<string, any[]> = {};
    
    utilityData.forEach((item: any) => {
      const type = item.meterType || 'Unknown';
      if (!grouped[type]) {
        grouped[type] = [];
      }
      grouped[type].push(item);
    });
    
    // Sort each group by date
    Object.keys(grouped).forEach((key) => {
      grouped[key].sort((a, b) => {
        return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
      });
    });
    
    return grouped;
  };

  // Improved useEffect for initial data loading
  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      if (!projectId || !portfolioManagerId || !isMounted) return;
      
      setInitialLoading(true);
      
      try {
        // Direct API client call with proper typing
        interface ProjectMetadata {
          portfolio_manager_id?: string;
          zip_code?: string;
          [key: string]: any;
        }
        const metadata = await apiClient.get<ProjectMetadata>(`projects/${projectId}/metadata`);
        
        if (!isMounted) return;
        
        setLastSavedMetadata({
          portfolio_manager_id: metadata?.portfolio_manager_id || '',
          zip_code: metadata?.zip_code || ''
        });
        
        setPropertyId(portfolioManagerId);
        await fetchBasicData(portfolioManagerId);
        
      } catch (error) {
        if (!isMounted) return;
        
        console.error('[ERROR] Failed to load existing metadata:', error);
        setPropertyId(portfolioManagerId);
        if (portfolioManagerId && isMounted) {
          await fetchBasicData(portfolioManagerId);
        } else {
          setInitialLoading(false);
        }
      }
    };
    
    loadData();
    
    return () => {
      isMounted = false;
      if (metadataUpdateTimerRef.current) {
        window.clearTimeout(metadataUpdateTimerRef.current);
      }
    };
  }, [projectId, portfolioManagerId]);

  const updateProjectMetadata = async (pmId: string, postalCode?: string) => {
    try {
      const postalCodeToUse = postalCode || data?.property?.postal_code || null;
      
      const metadataUpdate = {
        ...lastSavedMetadata,
        portfolio_manager_id: pmId,
        zip_code: postalCodeToUse || lastSavedMetadata?.zip_code || null
      };

      const hasChanged = !lastSavedMetadata || 
        lastSavedMetadata.portfolio_manager_id !== metadataUpdate.portfolio_manager_id ||
        lastSavedMetadata.zip_code !== metadataUpdate.zip_code;

      if (!hasChanged) {
        return true;
      }

      if (metadataUpdateTimerRef.current) {
        window.clearTimeout(metadataUpdateTimerRef.current);
      }

      return new Promise<boolean>((resolve) => {
        metadataUpdateTimerRef.current = window.setTimeout(async () => {
          try {
            // Direct API client call instead of using the legacy service
            await apiClient.put(`projects/${projectId}/metadata`, metadataUpdate);
            setLastSavedMetadata(metadataUpdate);
            resolve(true);
          } catch (error: any) {
            toast.error('Failed to update property metadata, but you can continue working');
            resolve(true);
          }
        }, 300);
      });
    } catch (error: any) {
      toast.error('Failed to update property metadata, but you can continue working');
      return true;
    }
  };

  // Function to fetch basic property data
  const fetchBasicData = async (propertyId: string) => {
    if (!projectId || !propertyId) {
      setError('Project ID and Portfolio Manager Property ID are required');
      setInitialLoading(false);
      return;
    }
    
    setError(null);

    try {
      const response = await apiClient.get<PortfolioManagerResponse>(`portfolio-manager-prisma/properties/${propertyId}/consolidated`, {
        projectId: projectId,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      });
      
      if (response && response.data && response.data.property) {
        setBasicData(response);
        
        const postalCode = response.data.property.postal_code || 
                          response.data.property.postalCode || 
                          null;
        
        if (postalCode) {
          await updateProjectMetadata(propertyId, postalCode);
        } else {
          try {
            const postalCodeResponse = await apiClient.get<{ postalCode: string | null }>(`portfolio-manager-prisma/projects/${projectId}/postal-code`);
            if (postalCodeResponse && postalCodeResponse.postalCode) {
              await updateProjectMetadata(propertyId, postalCodeResponse.postalCode);
            } else {
              await updateProjectMetadata(propertyId);
            }
          } catch (error) {
            await updateProjectMetadata(propertyId);
          }
        }
        
        fetchDetailedData(propertyId);
      } else {
        setError('Failed to fetch basic property data: Invalid response structure');
      }
    } catch (error: any) {
      setError('Failed to fetch basic property data: ' + (error.message || 'Unknown error'));
    } finally {
      setInitialLoading(false);
    }
  };

  // Function to fetch detailed property data (meters and utility data)
  const fetchDetailedData = async (portfolioManagerPropertyId: string) => {
    if (!projectId || !portfolioManagerPropertyId) {
      setInitialLoading(false);
      return;
    }
    
    setDetailedDataLoading(true);

    try {
      // First set up the project with Portfolio Manager
      await setupProject(portfolioManagerPropertyId);
      
      const response = await apiClient.get<PortfolioManagerResponse>(
        `portfolio-manager-prisma/properties/${portfolioManagerPropertyId}/consolidated`, 
        {
          projectId: projectId,
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0]
        }
      );
      
      if (response) {
        let processedData: PortfolioManagerResponse = response;
        
        if (!processedData.property) {
          if (processedData.data?.property) {
            processedData.property = processedData.data.property;
          } else if (basicData?.data?.property) {
            processedData.property = basicData.data.property;
          }
        }
        
        if (!Array.isArray(processedData.meters)) {
          processedData.meters = processedData.data?.meters || [];
        }
        
        if (!Array.isArray(processedData.utilityData)) {
          processedData.utilityData = processedData.data?.utilityData || [];
        }
        
        if (!Array.isArray(processedData.rollingAverages)) {
          processedData.rollingAverages = processedData.data?.rollingAverages || [];
        }
        
        setData(processedData);
        setSuccess('Data successfully imported from Portfolio Manager');

        if (onDataLoaded) {
          try {
            const postalCodeResponse = await apiClient.get<{ postalCode: string | null }>(`portfolio-manager-prisma/projects/${projectId}/postal-code`);
            
            onDataLoaded(true, { 
              portfolio_manager_id: propertyId,
              zip_code: postalCodeResponse?.postalCode || processedData.property?.postal_code || null
            });
          } catch (error: any) {
            onDataLoaded(true, { 
              portfolio_manager_id: propertyId,
              zip_code: processedData.property?.postal_code || null
            });
          }
        }
      }
    } catch (error: any) {
      setError('Failed to fetch detailed data: ' + (error.message || 'Unknown error'));
    } finally {
      setDetailedDataLoading(false);
      setInitialLoading(false);
    }
  };

  // Add a useEffect to ensure property data is available
  useEffect(() => {
    if (data && !data.property && basicData?.data?.property) {
      setData((prevData: PortfolioManagerResponse) => ({
        ...prevData,
        property: basicData.data.property
      }));
    }
  }, [data, basicData]);

  // Add new setupProject function
  const setupProject = async (portfolioManagerPropertyId: string) => {
    try {
      console.log('Setting up project with Portfolio Manager:', {
        portfolioManagerPropertyId, // Portfolio Manager ID (e.g. "6241848") - goes in URL
        projectId  // Project UUID (e.g. "4402aa85-...") - goes in body
      });
      
      // URL should have Portfolio Manager ID
      // Body should have our project UUID
      const response = await apiClient.post<{
        success: boolean;
        message?: string;
        data?: any;
      }>(
        `portfolio-manager-prisma/properties/${portfolioManagerPropertyId}/setup-project`,
        { 
          projectId: projectId, // Our project UUID goes in the body
          year: selectedYear 
        }
      );

      if (!response.success) {
        throw new Error(response.message || 'Failed to set up project');
      }

      return response;
    } catch (error: any) {
      console.error('Error setting up project:', error);
      throw error;
    }
  };

  // Simplified UI with better loading states
  return (
    <div className="space-y-4">
      {initialLoading ? (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="mt-2 text-muted-foreground">Loading Portfolio Manager data...</p>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium flex items-center">
                <Building2 className="mr-2 h-5 w-5 text-primary" />
                Portfolio Manager Data
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                View and manage data from ENERGY STAR Portfolio Manager
              </p>
            </div>
            
            <Button
              onClick={() => fetchDetailedData(propertyId)}
              variant="outline"
              size="sm"
              disabled={detailedDataLoading}
              title="Force refresh data from Portfolio Manager"
            >
              {detailedDataLoading ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              {detailedDataLoading ? "Refreshing data..." : "Update Data"}
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert variant="default" className="bg-green-50 border-green-200 text-green-800">
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {/* Tabs for Property, Meters, and Utility Data */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2 border rounded-md p-4">
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="property">Building Data</TabsTrigger>
              <TabsTrigger value="meters">Meters</TabsTrigger>
              <TabsTrigger value="utility">Meter Data</TabsTrigger>
              <TabsTrigger value="rolling">Rolling Averages</TabsTrigger>
            </TabsList>
            
            {detailedDataLoading ? (
              <div className="flex items-center justify-center p-8">
                <div className="text-center">
                  <RefreshCw className="h-6 w-6 animate-spin mx-auto text-primary" />
                  <p className="mt-2 text-muted-foreground">Loading data...</p>
                </div>
              </div>
            ) : (
              <>
                {/* Property Tab Content */}
                <TabsContent value="property">
                  {/* Try to find property data in different possible locations */}
                  {(data?.property || data?.data?.property) ? (
                    <div className="space-y-4">
                      {/* Use a helper variable to simplify access to property data */}
                      {(() => {
                        const property = data?.data?.property || data?.property || {};
                        return (
                          <>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="border rounded p-3">
                                <div className="text-sm text-muted-foreground">Building Name</div>
                                <div className="font-medium">{property.name || property.property_name || 'N/A'}</div>
                              </div>
                              <div className="border rounded p-3">
                                <div className="text-sm text-muted-foreground">Address</div>
                                <div className="font-medium">
                                  {[
                                    property.address || property.property_address,
                                    property.city || property.property_city,
                                    property.state || property.property_state,
                                    property.postal_code || property.postalCode || property.property_postal_code
                                  ].filter(Boolean).join(', ')}
                                </div>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div className="border rounded p-3">
                                <div className="text-sm text-muted-foreground">Building Type</div>
                                <div className="font-medium">{property.primary_function || property.primaryFunction || property.property_type || 'N/A'}</div>
                              </div>
                              <div className="border rounded p-3">
                                <div className="text-sm text-muted-foreground">Gross Floor Area</div>
                                <div className="font-medium">
                                  {property.gross_floor_area || property.grossFloorArea
                                    ? `${property.gross_floor_area || property.grossFloorArea} ${property.grossFloorAreaUnits || 'sq ft'}` 
                                    : 'N/A'}
                                </div>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div className="border rounded p-3">
                                <div className="text-sm text-muted-foreground">Year Built</div>
                                <div className="font-medium">{property.year_built || property.yearBuilt || 'N/A'}</div>
                              </div>
                              <div className="border rounded p-3">
                                <div className="text-sm text-muted-foreground">Construction Status</div>
                                <div className="font-medium">{property.construction_status || property.constructionStatus || 'N/A'}</div>
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      <div className="mb-2">No property data available</div>
                      {error && <div className="mt-2 text-sm text-destructive">{error}</div>}
                      <div className="mt-4">
                        <Button 
                          onClick={() => fetchBasicData(propertyId)}
                          variant="outline"
                          size="sm"
                        >
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Load Property Data
                        </Button>
                      </div>
                    </div>
                  )}
                </TabsContent>
                
                {/* Meters Tab Content */}
                <TabsContent value="meters">
                  {Array.isArray(data?.meters) && data.meters.length > 0 ? (
                    <div className="space-y-4">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Type</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Units</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data.meters.map((meter: any, index: number) => (
                            <TableRow key={index}>
                              <TableCell>
                                <div className="flex items-center">
                                  {getMeterTypeIcon(meter.type)}
                                  <span className="ml-2">{meter.type || 'Unknown'}</span>
                                </div>
                              </TableCell>
                              <TableCell>{meter.name || 'Unnamed Meter'}</TableCell>
                              <TableCell>{meter.unitOfMeasure || 'N/A'}</TableCell>
                              <TableCell>
                                {meter.status === 'Active' ? (
                                  <span className="flex items-center text-green-600">
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Active
                                  </span>
                                ) : (
                                  <span className="flex items-center text-amber-600">
                                    <Clock className="h-4 w-4 mr-1" />
                                    {meter.status || 'Unknown'}
                                  </span>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      No meter data available
                      <div className="mt-4">
                        <Button 
                          onClick={() => fetchDetailedData(propertyId)}
                          variant="outline"
                          size="sm"
                        >
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Refresh Meter Data
                        </Button>
                      </div>
                    </div>
                  )}
                </TabsContent>
                
                {/* Utility Data Tab Content */}
                <TabsContent value="utility">
                  <div className="mb-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="year-select">Select Year:</Label>
                      <Select value={selectedYear.toString()} onValueChange={(value) => {
                        setSelectedYear(parseInt(value));
                        fetchDetailedData(propertyId);
                      }}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select Year" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableYears.map((year) => (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {Array.isArray(data?.utilityData) && data.utilityData.length > 0 ? (
                    <div className="space-y-4">
                      {Object.entries(groupUtilityDataByMeterType(data.utilityData)).map(([type, items]: [string, any[]]) => (
                        <div key={type} className="space-y-2">
                          <h3 className="flex items-center text-sm font-medium">
                            {getMeterTypeIcon(type)}
                            <span className="ml-2">{type}</span>
                          </h3>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Period</TableHead>
                                <TableHead>Usage</TableHead>
                                <TableHead>Cost</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {items.map((item: any, index: number) => (
                                <TableRow key={index}>
                                  <TableCell>
                                    {new Date(item.startDate).toLocaleDateString()} - {new Date(item.endDate).toLocaleDateString()}
                                  </TableCell>
                                  <TableCell>
                                    {item.usage} {item.units}
                                  </TableCell>
                                  <TableCell>
                                    {item.cost ? `$${parseFloat(item.cost).toFixed(2)}` : 'N/A'}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      No utility data available
                      <div className="mt-4">
                        <Button 
                          onClick={() => fetchDetailedData(propertyId)}
                          variant="outline"
                          size="sm"
                        >
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Refresh Utility Data
                        </Button>
                      </div>
                    </div>
                  )}
                </TabsContent>
                
                {/* Rolling Averages Tab Content */}
                <TabsContent value="rolling">
                  <div className="mb-4">
                    <div className="flex items-center justify-between">
                      <Label>Rolling Averages (Current + Next Month)</Label>
                    </div>
                  </div>
                  
                  {Array.isArray(data?.rollingAverages) && data.rollingAverages.length > 0 ? (
                    <div className="space-y-4">
                      {Object.entries(groupUtilityDataByMeterType(data.rollingAverages)).map(([type, items]: [string, any[]]) => (
                        <div key={type} className="space-y-2">
                          <h3 className="flex items-center text-sm font-medium">
                            {getMeterTypeIcon(type)}
                            <span className="ml-2">{type}</span>
                          </h3>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Month</TableHead>
                                <TableHead>Original</TableHead>
                                <TableHead>Next Month</TableHead>
                                <TableHead>Rolling Avg</TableHead>
                                <TableHead>Original Cost</TableHead>
                                <TableHead>Avg Cost</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {items.map((item: any, index: number) => (
                                <TableRow key={index}>
                                  <TableCell>
                                    {item.month} {item.year}
                                  </TableCell>
                                  <TableCell>
                                    {item.originalUsage} {item.units}
                                  </TableCell>
                                  <TableCell>
                                    {item.nextMonthUsage} {item.units}
                                  </TableCell>
                                  <TableCell className="font-medium">
                                    {item.usage} {item.units}
                                  </TableCell>
                                  <TableCell>
                                    {item.originalCost ? `$${parseFloat(item.originalCost).toFixed(2)}` : 'N/A'}
                                  </TableCell>
                                  <TableCell className="font-medium">
                                    {item.cost ? `$${parseFloat(item.cost).toFixed(2)}` : 'N/A'}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      No rolling average data available
                      <div className="mt-4">
                        <Button 
                          onClick={() => fetchDetailedData(propertyId)}
                          variant="outline"
                          size="sm"
                        >
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Refresh Data
                        </Button>
                      </div>
                    </div>
                  )}
                </TabsContent>
              </>
            )}
          </Tabs>
          
          {/* External link to Portfolio Manager */}
          <div className="mt-4 text-center">
            <a 
              href={`https://portfoliomanager.energystar.gov/pm/property/${propertyId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-sm text-primary hover:underline"
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              View in Portfolio Manager
            </a>
          </div>
        </>
      )}
    </div>
  );
};

export default PortfolioManagerForm; 