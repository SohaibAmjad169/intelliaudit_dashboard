import React, { useState } from 'react';
import { ClipboardList, Lightbulb, Thermometer, Sparkles, Camera, Building, Sun, CalendarClock, BarChart, Cpu, FileSearch, Clipboard, FileText, Loader2 } from 'lucide-react';
import { Box } from '@/components/ui/box';
import { Button } from '@/components/ui/button';
// import { Badge } from '@/components/ui/badge';
import { useECOData } from '@/hooks/useECOData';
import { usePhotoManagement } from '@/hooks/usePhotoManagement';
import { useEnrichment } from '@/hooks/useEnrichment';
import { InfoCard } from './InfoCard';
// import { PhotoCard } from './PhotoCard';

import { PhotoDetailDialog } from './PhotoDetailDialog';
import { EnrichOptions } from './EnrichOptions';
import { Spinner } from '@/components/ui/spinner';

import { useProject } from '@/hooks/data/useProject';
import { ProjectData } from '@/types/project';
import { TooltipProvider } from '@/components/ui/tooltip';
interface ECOOverviewProps {
  projectId: string;
  publicView?: boolean;
}

export const ECOOverview: React.FC<ECOOverviewProps> = ({ projectId, publicView }) => {
  const [showEnrichOptions, setShowEnrichOptions] = useState(false);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [isGeneratingComprehensiveReport, setIsGeneratingComprehensiveReport] = useState(false);
  const [comprehensiveReportSuccess, setComprehensiveReportSuccess] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Fetch project data to get the property address
  const { data: projectData } = useProject(projectId) as unknown as { data: ProjectData | null };

  const {
    loading,
    error,
    data: analysis,
    generateComprehensiveReport,
    regenerateECOData
  } = useECOData(projectId, publicView);

  const {
    photos,
    selectedPhoto,
    setSelectedPhoto,
    // selectedCategory,
    // setSelectedCategory,
    // photoCategories,
    // filteredPhotos,
    fetchPhotos
  } = usePhotoManagement(projectId);

  const {
    fieldNotes,
    setFieldNotes,
    isProcessingNotes,
    fieldNotesError,
    fieldNotesSuccess,
    fieldNotesAlreadyEnhanced,
    equipmentAnalysisData,
    handleProcessFieldNotes
  } = useEnrichment(projectId);

  const handlePhotoUploadSuccess = async () => {
    setShowPhotoUpload(false);
    await fetchPhotos();
  };

  const handleGenerateComprehensiveReport = async () => {
    if (!projectId) return;

    setIsGeneratingComprehensiveReport(true);
    const success = await generateComprehensiveReport(
      equipmentAnalysisData,
      { photos },
      analysis?.recommendations || []
    );

    if (success) {
      setComprehensiveReportSuccess(true);
      setTimeout(() => {
        setComprehensiveReportSuccess(false);
      }, 5000);
    }

    setIsGeneratingComprehensiveReport(false);
  };

  const handleRegenerateECO = async () => {
    if (!projectId) return;

    setIsRegenerating(true);
    await regenerateECOData();
    setIsRegenerating(false);
  };

  // Removed unused function: formatFacilitySize

  // Helper functions to extract information from observations
  /*
  const extractFacilityInfo = (observations: string[] = []) => {
    const facilityObs = observations.find(obs => 
      obs.toLowerCase().includes('building') || 
      obs.toLowerCase().includes('facility')
    ) || '';

    return {
      type: facilityObs.includes('multifamily') ? 'Multifamily Housing' : 'Commercial Building',
      size: facilityObs.match(/(\d{1,3}(,\d{3})*(\.\d+)?\s*sq\s*ft)/i)?.[0] || 'Not available',
      purpose: facilityObs.includes('multifamily') ? 'Residential Housing' : 'Commercial Use',
      location: projectData?.property_address || projectData?.building_address || 'Address not available',
      inspectionDate: new Date().toLocaleDateString()
    };
  };

  // Extract facility information
  const facilityInfo = extractFacilityInfo(analysis?.observations);
  */

  return (
    <TooltipProvider>
      <>
        <div className="space-y-6 px-6">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Spinner className="w-8 h-8" />
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-600">
              {error}
            </div>
          ) : !analysis || !analysis.summary ? (
            <div className="p-8 text-center">
              <div className="mb-4">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No EC&O Data Available</h3>
              <p className="text-muted-foreground mb-6">
                To generate an EC&O (Existing Conditions and Observations) report, please:
              </p>
              {!publicView && (
                <div className="space-y-4">
                  <Button
                    onClick={() => setShowEnrichOptions(true)}
                    className="w-full sm:w-auto"
                  >
                    <Clipboard className="w-4 h-4 mr-2" />
                    Add Field Notes
                  </Button>
                  <Button
                    onClick={() => setShowPhotoUpload(true)}
                    variant="outline"
                    className="w-full sm:w-auto ml-0 sm:ml-2"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Upload Photos
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Box className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <ClipboardList className="w-8 h-8 text-emerald-500" />
                    <div>
                      <h2 className="text-2xl font-bold">{analysis.projectName || projectData?.property_address || projectData?.building_address || "Address not available"}</h2>
                      <p className="text-muted-foreground">
                        ASHRAE Level 2 Energy Audit
                      </p>
                    </div>
                  </div>
                  {!publicView && (
                    <div className="flex-shrink-0 flex space-x-2">
                      <Button
                        onClick={handleRegenerateECO}
                        variant="outline"
                        className=""
                        disabled={isRegenerating || loading}
                      >
                        {isRegenerating ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Regenerating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 mr-2" />
                            Regenerate
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={handleGenerateComprehensiveReport}
                        className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-600/30 transition-all duration-300"
                        disabled={isGeneratingComprehensiveReport || loading}
                      >
                        {isGeneratingComprehensiveReport || loading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <FileText className="w-4 h-4 mr-2" />
                            Comprehensive Report
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </Box>

              {showEnrichOptions && (
                <EnrichOptions
                  projectId={projectId}
                  fieldNotes={fieldNotes}
                  setFieldNotes={setFieldNotes}
                  isProcessingNotes={isProcessingNotes}
                  fieldNotesError={fieldNotesError}
                  fieldNotesSuccess={fieldNotesSuccess}
                  fieldNotesAlreadyEnhanced={fieldNotesAlreadyEnhanced}
                  showPhotoUpload={showPhotoUpload}
                  setShowPhotoUpload={setShowPhotoUpload}
                  onProcessFieldNotes={handleProcessFieldNotes}
                  onPhotoUploadSuccess={handlePhotoUploadSuccess}
                  onGenerateComprehensiveReport={handleGenerateComprehensiveReport}
                  isGeneratingComprehensiveReport={isGeneratingComprehensiveReport}
                  comprehensiveReportSuccess={comprehensiveReportSuccess}
                  equipmentAnalysisData={equipmentAnalysisData}
                  photos={photos}
                />
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <InfoCard
                    title="General Information"
                    icon={FileSearch}
                  >
                    <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-4 border border-slate-200 dark:border-slate-700">
                      <div className="text-xl font-bold mb-2">
                        {projectData?.property_address || projectData?.building_address || 'Address not available'}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {!publicView && (
                          <div>
                            <span className="text-sm text-muted-foreground">Date of Inspection:</span>
                            {/* <p className="font-medium">{new Date().toLocaleDateString()}</p> */}
                            <p className="font-medium">{projectData?.updated_at ? new Date(projectData.updated_at).toLocaleDateString() : new Date().toLocaleDateString()}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </InfoCard>

                  <InfoCard
                    title="Site Overview"
                    icon={Building}
                  >
                    <p className="text-muted-foreground mb-4">{analysis.summary}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="p-3 rounded-md border border-slate-200 dark:border-slate-700">
                        <h4 className="text-sm font-medium text-muted-foreground">Facility Type</h4>
                        <p className="font-medium">{projectData?.building_type || projectData?.property_primary_function || 'Not Specified'}</p>
                      </div>
                      <div className="p-3 rounded-md border border-slate-200 dark:border-slate-700">
                        <h4 className="text-sm font-medium text-muted-foreground">Facility Size</h4>
                        <p className="font-medium">
                          {projectData?.property_gross_floor_area
                            ? `${projectData.property_gross_floor_area.toLocaleString()} sq ft`
                            : 'Not Specified'}
                        </p>
                      </div>
                      <div className="p-3 rounded-md border border-slate-200 dark:border-slate-700">
                        <h4 className="text-sm font-medium text-muted-foreground">Facility Purpose</h4>
                        <p className="font-medium">{projectData?.property_primary_function || 'Not Specified'}</p>
                      </div>
                    </div>
                  </InfoCard>

                  <InfoCard
                    title="HVAC Systems"
                    icon={Thermometer}
                    tooltipContent="The building's HVAC system includes package units that provide heating, ventilation and air conditioning. The efficiency and operation of these HVAC components are major drivers of the building's overall energy use."
                  >
                    {analysis.hvacEquipment && analysis.hvacEquipment.length > 0 ? (
                      <>
                        <p className="text-muted-foreground mb-4">
                          {analysis.hvacSystemDescription || analysis.observations?.find(obs => obs.includes('HVAC'))}
                        </p>
                        <div className="mt-2">
                          <h4 className="text-sm font-medium mb-2">Equipment Inventory:</h4>
                          <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                            {Array.isArray(analysis.hvacEquipment) ? (
                              analysis.hvacEquipment.map((item, index) => (
                                <li key={index}>{item}</li>
                              ))
                            ) : (
                              <li>{analysis.hvacEquipment}</li>
                            )}
                          </ul>
                        </div>
                      </>
                    ) : (
                      <p className="text-muted-foreground mb-4">
                        {analysis.hvacSystemDescription || analysis.observations?.find(obs => obs.includes('HVAC')) || 'No HVAC system information available.'}
                      </p>
                    )}
                  </InfoCard>

                  <InfoCard
                    title="Lighting and Electrical Systems"
                    icon={Lightbulb}
                    tooltipContent="The interior lighting throughout the building consists primarily of fluorescent tube fixtures. Many of these lights are older models with low efficiency. Upgrading to LED lighting could provide significant energy savings."

                  >
                    <p className="text-muted-foreground mb-4">
                      {analysis.lightingSystemDescription || analysis.observations?.find(obs => obs.includes('lighting') || obs.includes('Lighting')) || 'No lighting system information available.'}
                    </p>
                    {analysis.lightingEquipment && analysis.lightingEquipment.length > 0 && (
                      <div className="mt-2">
                        <h4 className="text-sm font-medium mb-2">Equipment Inventory:</h4>
                        <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                          {Array.isArray(analysis.lightingEquipment) ? (
                            analysis.lightingEquipment.map((item, index) => (
                              <li key={index}>{item}</li>
                            ))
                          ) : (
                            <li>{analysis.lightingEquipment}</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </InfoCard>

                  <InfoCard
                    title="Utility Data"
                    icon={BarChart}
                    tooltipContent=" This section provides an overview of the building's utility consumption and costs. The data is pulled directly from the utility bills to give an accurate representation of the energy and water use."
                  >
                    {(analysis.utilityDataDescription || (analysis.utilitySummary && analysis.utilitySummary.length > 0)) ? (
                      <p className="text-muted-foreground mb-4">
                        {analysis.utilityDataDescription || analysis.observations?.find(obs => obs.includes('energy') || obs.includes('Energy')) || 'Review the summary below for utility details.'}
                      </p>
                    ) : (
                      <p className="text-muted-foreground mb-4">
                        {'No utility data available.'}
                      </p>
                    )}

                    {analysis.utilitySummary && analysis.utilitySummary.length > 0 && (
                      <div className="mt-2">
                        <h4 className="text-sm font-medium mb-2">Utility Summary:</h4>
                        <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                          {Array.isArray(analysis.utilitySummary) ? (
                            analysis.utilitySummary.map((item, index) => (
                              <li key={index}>{item}</li>
                            ))
                          ) : (
                            <li>{analysis.utilitySummary}</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </InfoCard>

                  <InfoCard
                    title="Equipment and Component Data"
                    icon={Cpu}
                    tooltipContent="This section provides detailed information on the major energy-consuming equipment and building components. The data is gathered through on-site inspections and measurements."
                  >
                    {analysis.equipmentInventory && analysis.equipmentInventory.length > 0 ? (
                      <>
                        <p className="text-muted-foreground mb-4">
                          {analysis.equipmentDataDescription || analysis.observations?.find(obs => obs.includes('equipment') || obs.includes('Equipment'))}
                        </p>
                        <div className="mt-2">
                          <h4 className="text-sm font-medium mb-2">Equipment Inventory:</h4>
                          <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                            {Array.isArray(analysis.equipmentInventory) ? (
                              analysis.equipmentInventory.map((item, index) => (
                                <li key={index}>{item}</li>
                              ))
                            ) : (
                              <li>{analysis.equipmentInventory}</li>
                            )}
                          </ul>
                        </div>
                      </>
                    ) : (
                      <p className="text-muted-foreground mb-4">
                        {analysis.equipmentDataDescription || analysis.observations?.find(obs => obs.includes('equipment') || obs.includes('Equipment')) || 'No equipment data available.'}
                      </p>
                    )}
                  </InfoCard>

                  <InfoCard
                    title="Building Envelope"
                    icon={Building}
                    tooltipContent="This section provides an overview of the building envelope, including walls, roofs, windows, and doors. The condition and performance of these components can significantly impact energy efficiency."
                  >
                    <p className="text-muted-foreground mb-4">
                      {analysis.buildingEnvelopeDescription || analysis.observations?.find(obs => obs.includes('building') || obs.includes('Building')) || 'No building envelope information available.'}
                    </p>
                    {analysis.buildingEnvelopeComponents && analysis.buildingEnvelopeComponents.length > 0 && (
                      <div className="mt-2">
                        <h4 className="text-sm font-medium mb-2">Envelope Components:</h4>
                        <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                          {Array.isArray(analysis.buildingEnvelopeComponents) ? (
                            analysis.buildingEnvelopeComponents.map((item, index) => (
                              <li key={index}>{item}</li>
                            ))
                          ) : (
                            <li>{analysis.buildingEnvelopeComponents}</li>
                          )}
                        </ul>
                      </div>
                    )}
                    
                  </InfoCard>
                </div>

                <div className="space-y-6">
                  <InfoCard
                    title="Helpful Links"
                    icon={Sparkles}
                    tooltipContent="This section contains details about the heating, ventilation, and air conditioning systems in the building."
                  >
                    <>
                      <a className="items-center text-center px-4 py-2 text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors" href={`https://www.ladbs.org/docs/default-source/forms/ebewe/ebewe-arcx-faqs-final-030223.pdf?sfvrsn=d4f3c053_12`} target='_blank'> EBEWE Audits & Retro-Commissioning FAQs </a>
                    </>
                  </InfoCard>

                  <InfoCard
                    title="Weather Conditions"
                    icon={Sun}
                    tooltipContent="This section provides information about the weather conditions during the inspection. Weather can significantly impact energy consumption and HVAC performance."
                  >
                    <p className="text-muted-foreground">{analysis.weatherConditions || 'Weather conditions data not available.'}</p>
                  </InfoCard>

                  <InfoCard
                    title="Occupancy Schedule"
                    icon={CalendarClock}
                    tooltipContent="This refers to the typical daily and weekly usage patterns for the building. The occupancy schedule outlines when the building is occupied and the hours of operation, which greatly impacts energy consumption."
                  >

                    {analysis.occupancyScheduleDetails && analysis.occupancyScheduleDetails.length > 0 ? (
                      <>
                        <p className="text-muted-foreground mb-2">Based on field notes assessment:</p>
                        <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                          {Array.isArray(analysis.occupancyScheduleDetails) ? (
                            analysis.occupancyScheduleDetails.map((item, index) => (
                              <li key={index}>{item}</li>
                            ))
                          ) : (
                            <li>{analysis.occupancyScheduleDetails}</li>
                          )}
                        </ul>
                      </>
                    ) : (
                      <p className="text-muted-foreground">Occupancy schedule data not available.</p>
                    )}
                  </InfoCard>


                  <InfoCard
                    title="Key Observations"
                    icon={FileSearch}
                    badge={{ text: `${analysis.observations.length} items` }}
                  >
                    <ul className="list-disc pl-5 space-y-2">
                      {analysis.observations && analysis.observations.length > 0 ? (
                        analysis.observations.map((observation, index) => (
                          <li key={index} className="text-muted-foreground">{observation}</li>
                        ))
                      ) : (
                        <li className="text-muted-foreground">No observations recorded</li>
                      )}
                    </ul>
                  </InfoCard>
                </div>
              </div>
            </>
          )}
        </div>

        <PhotoDetailDialog
          photo={selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
        />
      </>
    </TooltipProvider>
  );
};