// Debug logging
console.log("[ProjectDetailsPage] Module loading started");

// These imports will run first
import { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { ProjectWithDetails, Project } from "../../types/project";
import { getProject, getProjectWithDetails } from "@/services/projects";
import { useSidebar } from "@/contexts/SidebarContext";
import {
  fetchTotalUtilityCost,
  fetchTotalUtilityUsage,
} from "@/services/energy-analysis";
import axiosInstance from "@/services/common/axios-config";
import pmLogo from "/assets/espm_logo.png";

console.log("[ProjectDetailsPage] Core imports successful");

// Feature component imports
import { ArrowLeft, Download } from "lucide-react";
import { Box } from "@/components/ui/box";
console.log("[ProjectDetailsPage] UI imports successful");

// Energy components
import { EnergyNavigation } from "@/features/energy/EnergyNavigation";
import { EnergyOverview } from "@/features/energy/EnergyOverview";
import { ECOOverview } from "@/features/energy/ECOOverview";
import { ECMs } from "@/features/energy/ECMs";
import { Equipment } from "@/features/energy/Equipment";

// Report components
import { ShareReportButton } from "@/features/reports/ShareReportButton";

// Water components
import { WaterOverview } from "@/features/water/WaterOverview";
import { PhotosOverview } from "@/features/energy/site-photos/PhotosOverview";

// Import PhotoMetadataComponent
import { PhotoMetadataComponent } from "@/features/equipment/components/PhotoMetadataComponent";
import { reportsService } from "@/services";
import { ExecutiveSummaryPage } from "@/features/energy/ExecutiveSummaryPage";
import { AppendicesReport } from "@/features/energy/AppendicesReport";

// Error handling wrapper component
function ErrorFallback() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-4">
      <h2 className="text-lg font-medium mb-2">Error Loading Project</h2>
      <p className="text-muted-foreground text-center mb-4">
        There was an error loading this project. Please try refreshing the page.
      </p>
      <button
        className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
        onClick={() => window.location.reload()}
      >
        Refresh Page
      </button>
    </div>
  );
}

// Main component export
export default function ProjectDetailsPage() {
  console.log("[ProjectDetailsPage] Component rendering");
  try {
    return <ProjectDetailsContent />;
  } catch (error) {
    console.error("[ProjectDetailsPage] Error rendering component:", error);
    return <ErrorFallback />;
  }
}

function ProjectDetailsContent() {
  console.log("ProjectDetailsContent rendering started");
  const { projectId } = useParams<{ projectId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { setSidebarContent } = useSidebar();

  const [project, setProject] = useState<ProjectWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showProjectId, setShowProjectId] = useState(false);
  const [utilityData, setUtilityData] = useState<{
    electric: number;
    gas: number;
    cost: number;
  }>({
    electric: 0,
    gas: 0,
    cost: 0,
  });
  const [currentView, setCurrentView] = useState<string>(() => {
    // Initialize from localStorage or default to 'summary'
    const savedView = localStorage.getItem(`project_${projectId}_currentView`);
    return savedView || "summary";
  });

  // State to hold monthly summary data for cost calculation
  const [monthlySummaryData, setMonthlySummaryData] = useState<any>(null);

  const toggleProjectId = useCallback(() => {
    setShowProjectId((prev) => !prev);
  }, []);

  useEffect(() => {
    if (projectId) {
      fetchProject();
    }
  }, [projectId]);

  const fetchProject = async () => {
    try {
      setIsLoading(true);
      if (!projectId) return;

      // Use getProject directly with ID instead of getProjectBySlug
      const response = await getProject(projectId);

      // Handle array response by taking the first item
      const projectData = Array.isArray(response) ? response[0] : response;

      if (projectData) {
        // Create the base project data with optional customer-related fields
        const baseProject: Project = {
          id: projectData.id,
          name: projectData.name || "Untitled Project",
          building_address: projectData.building_address || "",
          property_name: projectData.property_name,
          property_address: projectData.property_address,
          property_city: projectData.property_city,
          property_state: projectData.property_state,
          property_postal_code: projectData.property_postal_code,
          company_name: projectData.company_name || "",
          contact_name: projectData.contact_name || "",
          contact_email: projectData.contact_email || "",
          status: projectData.status || "UNASSIGNED",
          project_type: projectData.project_type || "energy_audit",
          property_gross_floor_area: projectData.property_gross_floor_area,
          property_primary_function: projectData.property_primary_function,
          property_year_built: projectData.property_year_built,
          total_units: projectData.total_units,
          total_electric_usage: projectData.total_electric_usage,
          total_gas_usage: projectData.total_gas_usage,
          total_utility_cost: projectData.total_utility_cost,
          energy_star_score: projectData.energy_star_score,
          pm_id: projectData.pm_id,
          water_score: projectData.water_score,
          site_total_energy: projectData.site_total_energy,
          source_total_energy: projectData.source_total_energy,
          site_intensity: projectData.site_intensity,
          direct_ghg_emissions: projectData.direct_ghg_emissions,
          created_at: projectData.created_at || new Date().toISOString(),
          updated_at: projectData.updated_at || new Date().toISOString(),
          created_by: projectData.created_by,
          updated_by: projectData.updated_by,
          raw_notes: projectData.raw_notes,
        };

        // Add UI state
        const updatedProject: ProjectWithDetails = {
          ...baseProject,
          allowSkipStages: false,
          milestones: [],
          project_type: baseProject.project_type, // Ensure project_type is explicitly set
        };

        setProject(updatedProject);
      }
    } catch (error) {
      console.error("[ProjectDetailsPage] Error fetching project:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Add new effect to fetch utility data
  useEffect(() => {
    async function fetchUtilityData() {
      if (!projectId) return;

      try {
        const [usageData, costData] = await Promise.all([
          fetchTotalUtilityUsage(projectId),
          fetchTotalUtilityCost(projectId),
        ]);

        setUtilityData({
          electric: usageData?.totalElectric || 0,
          gas: usageData?.usageByType?.["Natural Gas"]?.total || 0,
          cost: costData?.totalCost || 0,
        });
      } catch (error) {
        console.error("Error fetching utility data:", error);
        // Set default values on error
        setUtilityData({
          electric: 0,
          gas: 0,
          cost: 0,
        });
      }
    }

    fetchUtilityData();
  }, [projectId]);

  // Fetch monthly summary data (similar to EnergyDataTable)
  useEffect(() => {
    async function fetchMonthlySummary() {
      if (!projectId) return;
      try {
        // Use the same endpoint as EnergyDataTable
        const response = await axiosInstance.get(
          `/api/reports/energy-summary?projectId=${projectId}`
        );
        setMonthlySummaryData(response.data);
      } catch (error) {
        console.error(
          "Error fetching monthly summary data for sidebar:",
          error
        );
        setMonthlySummaryData(null); // Handle error state
      }
    }
    fetchMonthlySummary();
  }, [projectId]);

  // Calculate total cost from monthly data using useMemo
  const calculatedTotalCost = useMemo(() => {
    let totalElectricCost = 0;
    let totalGasCost = 0;

    monthlySummaryData?.monthlyElectric?.forEach((d: any) => {
      totalElectricCost += d.cost || 0;
    });
    monthlySummaryData?.monthlyGas?.forEach((d: any) => {
      totalGasCost += d.cost || 0;
    });

    return totalElectricCost + totalGasCost;
  }, [monthlySummaryData]);

  // Create the dynamic sidebar content
  useEffect(() => {
    if (project) {
      // Sidebar with glowing effect
      const projectSidebarContent = (
        <div className="flex-1 flex flex-col overflow-auto">
          {/* Project Header */}
          <div className="flex flex-col p-4">
            {/* <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => navigate("/projects")}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>
            </div> */}

            <div className="space-y-4 text-sm">
              {/* Project Info */}
              <div>
                <div className="text-muted-foreground">
                  {project.property_address || project.building_address}
                </div>
              </div>

              {/* Building Details */}
              <div className="space-y-1">
                {project.property_primary_function && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type</span>
                    <span>{project.property_primary_function}</span>
                  </div>
                )}
                {project.property_gross_floor_area && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Area</span>
                    <span>
                      {Number(
                        project.property_gross_floor_area
                      ).toLocaleString()}{" "}
                      ft²
                    </span>
                  </div>
                )}
                {project.property_year_built && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Built</span>
                    <span>{project.property_year_built}</span>
                  </div>
                )}
                {project.total_units && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Units</span>
                    <span>{project.total_units}</span>
                  </div>
                )}
              </div>

              {/* Energy Usage */}
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Electric</span>
                  <span>
                    {Number(utilityData.electric).toLocaleString()} kWh
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gas</span>
                  <span>{Number(utilityData.gas).toLocaleString()} therms</span>
                </div>
              </div>

              {/* Energy Performance */}
              <div className="space-y-1">
                {project.site_total_energy && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Site Energy</span>
                    <span>
                      {Number(project.site_total_energy).toLocaleString()} kWh
                    </span>
                  </div>
                )}
                {project.source_total_energy && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Source Energy</span>
                    <span>
                      {Number(project.source_total_energy).toLocaleString()} kWh
                    </span>
                  </div>
                )}
                {project.site_intensity && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Site EUI</span>
                    <span>
                      {Number(project.site_intensity).toLocaleString()} kBtu/ft²
                    </span>
                  </div>
                )}
                {project.source_total_energy &&
                  project.property_gross_floor_area && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Source EUI</span>
                      <span>
                        {(
                          project.source_total_energy /
                          project.property_gross_floor_area
                        ).toLocaleString()}{" "}
                        kBtu/ft²
                      </span>
                    </div>
                  )}
                {project.direct_ghg_emissions && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">GHG Emissions</span>
                    <span>
                      {Number(project.direct_ghg_emissions).toLocaleString()}{" "}
                      kgCO2e
                    </span>
                  </div>
                )}
              </div>

              {/* Energy Star Rating Added In Public View */}
              {project.energy_star_score && (
                <div className="space-y-1">
                  <div className="border-2 border-gray-800 p-0 overflow-hidden">
                    <div className="p-3">
                      <img src={pmLogo} alt="" />
                      <div className="flex items-center justify-center text-7xl font-bold">
                      {project.energy_star_score}
                      </div>
                    </div>
                    
                    {/* <div className="bg-gray-100 p-2 text-xs border-t border-gray-300">1. The ENERGY STAR score is a 1-100 assessment of a building's energy efficiency as compared with similar buildings nationwide, adjusting for climate and business activity.</div> */}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Reporting Navigation Section */}
          <div className="p-4">
            <div className="rounded-lg overflow-hidden border border-emerald-500/20">
              <div className="p-3 bg-card/50">
                <EnergyNavigation
                  projectId={project.id}
                  projectSlug={projectId || ""}
                  currentPath={currentView}
                  onNavigate={(path) => {
                    setCurrentView(path);
                    localStorage.setItem(
                      `project_${projectId}_currentView`,
                      path
                    );
                  }}
                  publicView={true}
                />
              </div>
            </div>
          </div>
        </div>
      );

      setSidebarContent(projectSidebarContent);
    }
  }, [
    project,
    location.pathname,
    showProjectId,
    toggleProjectId,
    currentView,
    projectId,
    navigate,
    utilityData,
    calculatedTotalCost,
  ]);

  // Render based on the selected view
  const renderView = () => {
    if (!project) return null;

    try {
      switch (currentView) {
        case "eco":
          return <ECOOverview projectId={project.id} publicView={true} />;
        case "energy":
          return (
            <Equipment
              projectId={project.id}
              project={project}
              publicView={true}
            />
          );
        case "water":
          return <WaterOverview projectId={project.id} projectDetails={project} setProjectDetails={setProject} publicView={true} />;
        case "photos-overview":
          return <PhotosOverview projectId={project.id} publicView={true} />;
        case "ecms":
          return <ECMs projectId={project.id} publicView={true} />;
        case "energy-overview":
          console.log(
            "Attempting to render EnergyOverview with projectId:",
            project.id
          );
          return <EnergyOverview projectId={project.id} publicView={true} />;
        case "water-overview":
          return <WaterOverview projectId={project.id} projectDetails={project} setProjectDetails={setProject} publicView={true} />;
        case "photo-metadata":
          return (
            <PhotoMetadataComponent projectId={project.id} publicView={true} />
          );
        case 'summary':
          return <ExecutiveSummaryPage projectId={project.id} projectDetails={project} />;
        case 'appendices':
          return <AppendicesReport projectId={project.id} projectData={project} />;
        default:
          // Default to ECO view
          // return <ECOOverview projectId={project.id} />;
          return <ExecutiveSummaryPage projectId={project.id} projectDetails={project} />;
      }
    } catch (error) {
      console.error("Error rendering view:", error);
      return (
        <div className="flex flex-col items-center justify-center p-8">
          <h2 className="text-xl font-semibold mb-4 text-red-500">
            Error Loading View
          </h2>
          <p className="mb-4 text-center">
            There was an error loading this view. Please try a different view.
          </p>
          <pre className="p-4 bg-muted/30 rounded-md text-sm overflow-auto w-full max-w-2xl">
            {error instanceof Error ? error.message : "Unknown error"}
          </pre>
        </div>
      );
    }
  };

  // Handle PDF download
  const handleDownloadPdf = async () => {
    const reportId = project?.id; // Assuming project.id is the report ID

    if (!reportId) return;

    try {
      // Show loading state
      // setGeneratingPdf(true);

      // Generate and download the PDF
      const pdfBlob = await reportsService.generateProjectReportPdf(reportId);

      // Create a URL for the blob
      const url = URL.createObjectURL(pdfBlob);

      // Create a temporary link element
      const link = document.createElement("a");
      link.href = url;
      link.download = `energy-audit-report-${reportId}.pdf`;

      // Append to the document, click it, and remove it
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Release the blob URL
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      // setGeneratingPdf(false);
    }
  };

  return (
    <div className="flex-1 h-full pt-4">
      {isLoading ? (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
        </div>
      ) : !project ? (
        <div className="flex flex-col items-center justify-center h-full">
          <h2 className="text-lg font-medium mb-2">Project not found</h2>
          <p className="text-muted-foreground">
            The project you're looking for could not be found.
          </p>
          <button
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md"
            onClick={() => navigate("/projects")}
          >
            Go back to projects
          </button>
        </div>
      ) : (
        <>
          {/* Hide download button in public view */}
          {false && (
            <div className="flex justify-end space-y-6 px-6 mb-4 mt-2">
              <button
                onClick={handleDownloadPdf}
                className="flex items-center px-4 py-2 text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Full Report (PDF)
              </button>
            </div>
          )}

          {renderView()}
        </>
      )}
    </div>
  );
}
