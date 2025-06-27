import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getProject } from '@/services/projects';
import { useProjectPhotos } from '@/hooks/data/usePhotoData';
import {
  fetchEndUseBreakdown,
  fetchTotalUtilityCost,
  fetchTotalUtilityUsage,
  fetchMonthlyUtilityData
} from '@/services/energy-analysis';
import { fetchExistingMeasures } from '@/services/energy-analysis/measures-service';
import { mapToConservationMeasures } from '@/utils/mappers/reportMappers';
import { reportsService } from '@/services/reports/index';

// Import the components
import { Header } from '@/features/reports/shareable/Header';
import { Footer } from '@/features/reports/shareable/Footer';
import { ProjectInfo } from '@/features/reports/shareable/ProjectInfo';
import { EnergyUsageBreakdown } from '@/features/reports/shareable/EnergyUsageBreakdown';
import { EndUseBreakdown } from '@/features/reports/shareable/EndUseBreakdown';
import { SiteOverview } from '@/features/reports/shareable/SiteOverview';
import { Recommendations } from '@/features/reports/shareable/Recommendations';
import { EquipmentAnalysis } from '@/features/reports/shareable/EquipmentAnalysis';
import { SitePhotos } from '@/features/reports/shareable/SitePhotos';
import { FloatingSidebar } from '@/features/reports/shareable/FloatingSidebar';
import { SectionState } from '@/features/reports/shareable/SectionControls';
import { UtilityDataTable } from '@/features/reports/shareable/UtilityDataTable';
import { WaterDataTable } from '@/features/reports/shareable/WaterDataTable';
import { ExecutiveSummary } from '@/features/reports/shareable/ExecutiveSummary';
import { SummaryTables } from '@/features/reports/shareable/SummaryTables';
import { MeasuresSummaryTable } from '@/features/reports/shareable/MeasuresSummaryTable';
import { MeasuresFinancialAnalysis } from '@/features/reports/shareable/MeasuresFinancialAnalysis';
import { NextSteps } from '@/features/reports/shareable/NextSteps';
import { AuditIntroduction } from '@/features/reports/shareable/EnergyAudit';
import { WaterAudit } from '@/features/reports/shareable/WaterAudit';
import { RetroCommissioning } from '@/features/reports/shareable/RetroCommissioning';

// Import types
import { ReportData, EcoData } from '@/features/reports/shareable/types';

// Add print styles
import './components/shareableReport.css';
import { Project, ProjectWithDetails } from '@/types/project';

export default function ShareableReport() {
  const { reportId } = useParams<{ reportId: string }>();
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check localStorage for saved preference, default to false
    const saved = localStorage.getItem('reportDarkMode');
    return saved ? JSON.parse(saved) : false;
  });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [generatingHtmlPdf, setGeneratingHtmlPdf] = useState(false);

  // Section visibility state - only key sections visible by default
  const initialSections: SectionState = {
    executiveSummary: true,
    measuresAnalysis: true,
    financialAnalysis: true,
    nextSteps: true,
    energyAudit: true,
    waterAudit: true,
    retroCommissioning: true,
    projectInfo: false,
    summaryTables: false,
    energyUsage: false,
    endUseBreakdown: false,
    utilityData: false,
    waterData: false,
    siteOverview: false,
    recommendations: false,
    equipment: false,
    photos: false,
    appendices: true
  };

  const [sectionOrder, setSectionOrder] = useState<Array<keyof SectionState>>(
    Object.keys(initialSections) as Array<keyof SectionState>
  );
  const [visibleSections, setVisibleSections] = useState<SectionState>(initialSections);

  const [reportData, setReportData] = useState<ReportData>({
    project: null,
    endUseBreakdown: null,
    totalCost: { total: 0, electric: 0, naturalGas: 0, water: 0 },
    totalUsage: { total: 0, electric: 0, naturalGas: 0, water: 0 },
    monthlyData: { electric: [], naturalGas: [], water: [] },
    energyMeasures: [],
    isLoading: true,
    error: null
  });

  const [ecoData, setEcoData] = useState<EcoData>({
    summary: '',
    observations: [],
    recommendations: [],
    hvacSystemDescription: '',
    lightingSystemDescription: '',
    buildingEnvelopeDescription: '',
    hvacEquipment: [],
    lightingEquipment: [],
    equipmentInventory: [],
    buildingEnvelopeComponents: [],
    weatherConditions: '',
    utilityDataDescription: '',
    utilitySummary: [],
    occupancyScheduleDetails: [],
    isLoading: true
  });

  
  const [projectDet, setProjectDet] = useState<ProjectWithDetails | null>(null);

  // Fetch project photos
  const { data: photos = [], isLoading: photosLoading } = useProjectPhotos(reportId || '');

  // Toggle section visibility
  const toggleSection = (section: keyof SectionState) => {
    setVisibleSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Handle PDF download
  const handleDownloadPdf = async () => {
    if (!reportId) return;

    try {
      // Show loading state
      setGeneratingPdf(true);

      // Generate and download the PDF
      const pdfBlob = await reportsService.generateProjectReportPdf(reportId);

      // Create a URL for the blob
      const url = URL.createObjectURL(pdfBlob);

      // Create a temporary link element
      const link = document.createElement('a');
      link.href = url;
      link.download = `energy-audit-report-${reportId}.pdf`;

      // Append to the document, click it, and remove it
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Release the blob URL
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setGeneratingPdf(false);
    }
  };

  // Handle HTML-based PDF download
  const handleDownloadHtmlPdf = async () => {
    if (!reportId) return;

    try {
      // Show loading state
      setGeneratingHtmlPdf(true);

      // Generate and download the HTML-based PDF
      const pdfBlob = await reportsService.generateProjectReportHtmlPdf(reportId);

      // Create a URL for the blob
      const url = URL.createObjectURL(pdfBlob);

      // Create a temporary link element
      const link = document.createElement('a');
      link.href = url;
      link.download = `enhanced-energy-audit-report-${reportId}.pdf`;

      // Append to the document, click it, and remove it
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Release the blob URL
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating enhanced PDF:', error);
      alert('Failed to generate enhanced PDF. Please try again.');
    } finally {
      setGeneratingHtmlPdf(false);
    }
  };

  useEffect(() => {
    if (reportId) {
      fetchReportData(reportId);
    }
  }, [reportId]);

  useEffect(() => {
    const fetchECOData = async () => {
      if (!reportData.project) return;

      try {
        // The ECO data is stored directly in the project's ec_o field
        const ec_o = reportData.project.ec_o;

        // Parse the EC_O data if it's a string
        let ecoAnalysisData;
        if (typeof ec_o === 'string' && ec_o) {
          try {
            ecoAnalysisData = JSON.parse(ec_o);
          } catch (parseError) {
            console.error('Error parsing EC_O JSON:', parseError);
            ecoAnalysisData = {};
          }
        } else if (ec_o && typeof ec_o === 'object') {
          // It's already an object
          ecoAnalysisData = ec_o;
        } else {
          console.log('No EC_O data found in project');
          ecoAnalysisData = {};
        }

        // Update ECO data with all available information
        setEcoData((prev: EcoData) => ({
          ...prev,
          summary: ecoAnalysisData.summary || '',
          observations: ecoAnalysisData.observations || [],
          recommendations: ecoAnalysisData.recommendations || [],
          hvacSystemDescription: ecoAnalysisData.hvacSystemDescription || '',
          lightingSystemDescription: ecoAnalysisData.lightingSystemDescription || '',
          buildingEnvelopeDescription: ecoAnalysisData.buildingEnvelopeDescription || '',
          hvacEquipment: ecoAnalysisData.hvacEquipment || [],
          lightingEquipment: ecoAnalysisData.lightingEquipment || [],
          equipmentInventory: ecoAnalysisData.equipmentInventory || [],
          buildingEnvelopeComponents: ecoAnalysisData.buildingEnvelopeComponents || [],
          weatherConditions: ecoAnalysisData.weatherConditions || '',
          utilityDataDescription: ecoAnalysisData.utilityDataDescription || '',
          utilitySummary: ecoAnalysisData.utilitySummary || [],
          occupancyScheduleDetails: ecoAnalysisData.occupancyScheduleDetails || [],
          isLoading: false
        }));
      } catch (error) {
        console.error('Error processing ECO data:', error);
        setEcoData((prev: EcoData) => ({
          ...prev,
          isLoading: false
        }));
      }
    };

    if (reportData.project) {
      fetchECOData();
    }
  }, [reportData.project]);

  const fetchReportData = async (projectId: string) => {
    try {
      setReportData(prev => ({ ...prev, isLoading: true, error: null }));

      // Fetch project details
      const projectData = await getProject(projectId);

      // Handle array response by taking the first item
      const project = Array.isArray(projectData) ? projectData[0] : projectData;
            
      if (project) {
          // Create the base project data with optional customer-related fields
        const baseProject: Project = {
          id: project.id,
          name: project.name || 'Untitled Project',
          building_address: project.building_address || '',
          property_name: project.property_name,
          property_address: project.property_address,
          property_city: project.property_city,
          property_state: project.property_state,
          property_postal_code: project.property_postal_code,
          company_name: project.company_name || '',
          contact_name: project.contact_name || '',
          contact_email: project.contact_email || '',
          status: project.status || 'UNASSIGNED',
          project_type: project.project_type || 'energy_audit',
          property_gross_floor_area: project.property_gross_floor_area,
          property_primary_function: project.property_primary_function,
          property_year_built: project.property_year_built,
          total_units: project.total_units,
          total_electric_usage: project.total_electric_usage,
          total_gas_usage: project.total_gas_usage,
          total_utility_cost: project.total_utility_cost,
          energy_star_score: project.energy_star_score,
          site_total_energy: project.site_total_energy,
          source_total_energy: project.source_total_energy,
          site_intensity: project.site_intensity,
          direct_ghg_emissions: project.direct_ghg_emissions,
          created_at: project.created_at || new Date().toISOString(),
          updated_at: project.updated_at || new Date().toISOString(),
          created_by: project.created_by,
          updated_by: project.updated_by,
          raw_notes: project.raw_notes
        };

        // Add UI state
        const updatedProject: ProjectWithDetails = {
          ...baseProject,
          allowSkipStages: false,
          milestones: [],
          project_type: baseProject.project_type // Ensure project_type is explicitly set
        };
        
        setProjectDet(updatedProject);
      }

      if (!project) {
        throw new Error('Project not found');
      }

      // Check if project has AI-analyzed energy data
      let energyAnalysisData = null;
      if (project.energy_analysis) {
        try {
          energyAnalysisData = typeof project.energy_analysis === 'string'
            ? JSON.parse(project.energy_analysis)
            : project.energy_analysis;
        } catch (e) {
          console.error('Error parsing energy analysis data:', e);
        }
      }

      // Try to get data from various sources with fallbacks
      let endUseData = null;
      let utilityCostData = null;
      let utilityUsageData = null;
      let electricData = [];
      let gasData = [];
      let waterData = [];

      try {
        // Try to fetch end use breakdown
        endUseData = await fetchEndUseBreakdown(projectId);
      } catch (error) {
        console.error('Error fetching end use breakdown:', error);
        // Use AI analysis data if available
        if (energyAnalysisData?.end_use_breakdown) {
          endUseData = energyAnalysisData.end_use_breakdown;
        }
      }

      // Fetch utility cost data with built-in fallbacks
      utilityCostData = await fetchTotalUtilityCost(projectId);

      // Map the data to the format expected by the report
      utilityCostData = {
        total: utilityCostData.totalCost,
        electric: utilityCostData.electricCost,
        natural_gas: utilityCostData.naturalGasCost,
        water: utilityCostData.waterCost
      };

      // Fetch utility usage data with built-in fallbacks
      utilityUsageData = await fetchTotalUtilityUsage(projectId);

      // Map the data to the format expected by the report
      utilityUsageData = {
        totalEnergyUsage: utilityUsageData.totalEnergyUsage,
        totalElectric: utilityUsageData.totalElectric,
        naturalGasInKWh: utilityUsageData.naturalGasInKWh,
        totalWater: utilityUsageData.totalWater
      };

      try {
        // Try to fetch monthly electric data
        electricData = await fetchMonthlyUtilityData(projectId, 'electric');
      } catch (error) {
        console.error('Error fetching monthly electric data:', error);
      }

      try {
        // Try to fetch monthly gas data
        gasData = await fetchMonthlyUtilityData(projectId, 'natural-gas');
      } catch (error) {
        console.error('Error fetching monthly gas data:', error);
      }

      try {
        // Try to fetch monthly water data
        waterData = await fetchMonthlyUtilityData(projectId, 'water');
      } catch (error) {
        console.error('Error fetching monthly water data:', error);
      }

      // Fetch energy conservation measures
      const measuresResult = await fetchExistingMeasures(projectId);
      const allMeasures = [
        ...measuresResult.eems,
        ...measuresResult.wems,
        ...measuresResult.rcms,
        ...measuresResult.customMeasures
      ];

      // Map measures to the correct format
      const mappedMeasures = mapToConservationMeasures(allMeasures);

      // Update state with all fetched data
      setReportData({
        project,
        endUseBreakdown: endUseData,
        totalCost: {
          total: utilityCostData?.total || 0,
          electric: utilityCostData?.electric || 0,
          naturalGas: utilityCostData?.natural_gas || 0,
          water: utilityCostData?.water || 0
        },
        totalUsage: {
          total: utilityUsageData?.totalEnergyUsage || 0,
          electric: utilityUsageData?.totalElectric || 0,
          naturalGas: utilityUsageData?.naturalGasInKWh || 0,
          water: utilityUsageData?.totalWater || 0
        },
        monthlyData: {
          electric: electricData || [],
          naturalGas: gasData || [],
          water: waterData || []
        },
        energyMeasures: mappedMeasures,
        isLoading: false,
        error: null
      });
    } catch (error) {
      console.error('Error fetching report data:', error);
      setReportData(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load report data'
      }));
    }
  };

  // Update dark mode effect to save preference
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    // Save preference to localStorage
    localStorage.setItem('reportDarkMode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  // Get square footage value from project
  const getSquareFootage = () => {
    if (!reportData.project) return 0;
    return reportData.project.property_gross_floor_area ||
           reportData.project.square_footage ||
           reportData.project.building_sqft || 0;
  };

  // Get project name for display in header
  const getProjectName = () => {
    if (!reportData.project) return '';
    return reportData.project.property_name ||
           reportData.project.name ||
           'Building Energy Report';
  };

  if (reportData.isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!reportData.project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h2 className="text-2xl font-semibold mb-4">Report Not Found</h2>
        <p className="text-gray-600 dark:text-gray-400">The requested report could not be found.</p>
        <p className="text-sm text-gray-500 mt-4">This may be because the project ID is invalid or the project has been deleted.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header Component */}
      <Header
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        projectName={getProjectName()}
      />

      {/* Floating Sidebar */}
      <FloatingSidebar
        visibleSections={visibleSections}
        toggleSection={toggleSection}
        onDownloadPdf={handleDownloadPdf}
        onDownloadHtmlPdf={handleDownloadHtmlPdf}
        onCollapseChange={setIsSidebarCollapsed}
        onSectionOrderChange={setSectionOrder}
      />

      <main className={`transition-all duration-300 ease-in-out
        ${isSidebarCollapsed ? 'md:pl-12' : 'md:pl-72'}
        pt-16 md:pt-0
      `}>
        <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          {/* Render sections in the correct order */}
          {sectionOrder.map((sectionKey) => {
            if (!visibleSections[sectionKey]) return null;

            // Render the appropriate section based on the key
            switch (sectionKey) {
              case 'executiveSummary':
                return (
                  <div id="executiveSummary" key={sectionKey} className="mb-8">
                    <ExecutiveSummary reportData={reportData} ecoData={ecoData} />
                  </div>
                );

              case 'projectInfo':
                return <ProjectInfo key={sectionKey} reportData={reportData} />;

              case 'summaryTables':
                return <SummaryTables key={sectionKey} reportData={reportData} ecoData={ecoData} />;

              case 'energyAudit':
                return (
                  <div id="energyAudit" key={sectionKey} className="mb-8">
                    <AuditIntroduction projectId={reportId || ''} project={projectDet} />
                  </div>
                );

              case 'waterAudit':
                return (
                  <div id="waterAudit" key={sectionKey} className="mb-8">
                    <WaterAudit projectId={reportId || ''} />
                  </div>
                );

              case 'retroCommissioning':
                return (
                  <div id="retroCommissioning" key={sectionKey} className="mb-8">
                    <RetroCommissioning projectId={reportId || ''} />
                  </div>
                );

              case 'measuresAnalysis':
                return (
                  <div id="measuresAnalysis" key={sectionKey} className="mb-8">
                    <MeasuresSummaryTable projectId={reportId || ''} />
                  </div>
                );

              case 'financialAnalysis':
                return (
                  <div id="financialAnalysis" key={sectionKey} className="mb-8">
                    <MeasuresFinancialAnalysis projectId={reportId || ''} />
                  </div>
                );

              case 'nextSteps':
                return (
                  <div id="nextSteps" key={sectionKey} className="mb-8">
                    <NextSteps />
                  </div>
                );

              case 'energyUsage':
                return (
                  <div key={sectionKey} className="page-break-before">
                    <EnergyUsageBreakdown
                      reportData={reportData}
                      squareFootage={getSquareFootage()}
                    />
                  </div>
                );

              case 'endUseBreakdown':
                return (
                  <div key={sectionKey} className="page-break-before">
                    <EndUseBreakdown reportData={reportData} />
                  </div>
                );

              case 'utilityData':
                return (
                  <div key={sectionKey} className="page-break-before">
                    <UtilityDataTable projectId={reportId || ''} />
                  </div>
                );

              case 'waterData':
                return (
                  <div key={sectionKey} className="page-break-before">
                    <WaterDataTable projectId={reportId || ''} />
                  </div>
                );

              case 'siteOverview':
                return (
                  <div key={sectionKey} className="page-break-before">
                    <SiteOverview reportData={reportData} ecoData={ecoData} />
                  </div>
                );

              case 'recommendations':
                return (
                  <div key={sectionKey} className="page-break-before">
                    <Recommendations ecoData={ecoData} reportData={reportData} projectId={reportId || ''} />
                  </div>
                );

              case 'equipment':
                return (
                  <div key={sectionKey} className="page-break-before">
                    <EquipmentAnalysis reportData={reportData} />
                  </div>
                );

              case 'photos':
                return (
                  <div key={sectionKey} className="page-break-before">
                    <SitePhotos photos={photos} isLoading={photosLoading} />
                  </div>
                );

              default:
                return null;
            }
          })}

          {/* Footer Component */}
          <Footer />
        </div>
      </main>
    </div>
  );
}