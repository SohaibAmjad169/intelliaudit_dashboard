import { useEffect, useState } from "react";
import { ReportData, EcoData } from "../reports/shareable/types";
import { getProject } from "@/services";
import { Project, ProjectWithDetails } from "@/types/project";
import {
  fetchEndUseBreakdown,
  fetchMonthlyUtilityData,
  fetchTotalUtilityCost,
  fetchTotalUtilityUsage,
} from "@/services/energy-analysis";
import { fetchExistingMeasures } from "@/services/energy-analysis/measures-service";
import { mapToConservationMeasures } from "@/utils/mappers/reportMappers";
import { Box } from "@/components/ui/box";

import { useMeasures, DetailedMeasure } from "@/hooks/useMeasures";

interface ExecutiveSummaryProps {
  reportData?: ReportData;
  ecoData?: EcoData;
  projectId: string;
  projectDetails?: Project;
}

export function ExecutiveSummaryPage({
  projectId,
  projectDetails,
}: ExecutiveSummaryProps) {
  const [reportData, setReportData] = useState<ReportData>({
    project: null,
    endUseBreakdown: null,
    totalCost: { total: 0, electric: 0, naturalGas: 0, water: 0 },
    totalUsage: { total: 0, electric: 0, naturalGas: 0, water: 0 },
    monthlyData: { electric: [], naturalGas: [], water: [] },
    energyMeasures: [],
    isLoading: true,
    error: null,
  });

  const [ecoData, setEcoData] = useState<EcoData>({
    summary: "",
    observations: [],
    recommendations: [],
    hvacSystemDescription: "",
    lightingSystemDescription: "",
    buildingEnvelopeDescription: "",
    hvacEquipment: [],
    lightingEquipment: [],
    equipmentInventory: [],
    buildingEnvelopeComponents: [],
    weatherConditions: "",
    utilityDataDescription: "",
    utilitySummary: [],
    occupancyScheduleDetails: [],
    isLoading: true,
  });

  const [projectDet, setProjectDet] = useState<ProjectWithDetails | null>(null);

  const fetchReportData = async (projectId: string) => {
    try {
      setReportData((prev) => ({ ...prev, isLoading: true, error: null }));

      // Fetch project details
      const projectData = await getProject(projectId);

      // Handle array response by taking the first item
      const project = Array.isArray(projectData) ? projectData[0] : projectData;

      if (project) {
        // Create the base project data with optional customer-related fields
        const baseProject: Project = {
          id: project.id,
          name: project.name || "Untitled Project",
          building_address: project.building_address || "",
          property_name: project.property_name,
          property_address: project.property_address,
          property_city: project.property_city,
          property_state: project.property_state,
          property_postal_code: project.property_postal_code,
          company_name: project.company_name || "",
          contact_name: project.contact_name || "",
          contact_email: project.contact_email || "",
          status: project.status || "UNASSIGNED",
          project_type: project.project_type || "energy_audit",
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
          raw_notes: project.raw_notes,
        };

        // Add UI state
        const updatedProject: ProjectWithDetails = {
          ...baseProject,
          allowSkipStages: false,
          milestones: [],
          project_type: baseProject.project_type, // Ensure project_type is explicitly set
        };

        setProjectDet(updatedProject);
      }

      if (!project) {
        throw new Error("Project not found");
      }

      // Check if project has AI-analyzed energy data
      let energyAnalysisData = null;
      if (project.energy_analysis) {
        try {
          energyAnalysisData =
            typeof project.energy_analysis === "string"
              ? JSON.parse(project.energy_analysis)
              : project.energy_analysis;
        } catch (e) {
          console.error("Error parsing energy analysis data:", e);
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
        console.error("Error fetching end use breakdown:", error);
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
        water: utilityCostData.waterCost,
      };

      // Fetch utility usage data with built-in fallbacks
      utilityUsageData = await fetchTotalUtilityUsage(projectId);

      // Map the data to the format expected by the report
      utilityUsageData = {
        totalEnergyUsage: utilityUsageData.totalEnergyUsage,
        totalElectric: utilityUsageData.totalElectric,
        naturalGasInKWh: utilityUsageData.naturalGasInKWh,
        totalWater: utilityUsageData.totalWater,
      };

      try {
        // Try to fetch monthly electric data
        electricData = await fetchMonthlyUtilityData(projectId, "electric");
      } catch (error) {
        console.error("Error fetching monthly electric data:", error);
      }

      try {
        // Try to fetch monthly gas data
        gasData = await fetchMonthlyUtilityData(projectId, "natural-gas");
      } catch (error) {
        console.error("Error fetching monthly gas data:", error);
      }

      try {
        // Try to fetch monthly water data
        waterData = await fetchMonthlyUtilityData(projectId, "water");
      } catch (error) {
        console.error("Error fetching monthly water data:", error);
      }

      // Fetch energy conservation measures
      const measuresResult = await fetchExistingMeasures(projectId);
      const allMeasures = [
        ...measuresResult.eems,
        ...measuresResult.wems,
        ...measuresResult.rcms,
        ...measuresResult.customMeasures,
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
          water: utilityCostData?.water || 0,
        },
        totalUsage: {
          total: utilityUsageData?.totalEnergyUsage || 0,
          electric: utilityUsageData?.totalElectric || 0,
          naturalGas: utilityUsageData?.naturalGasInKWh || 0,
          water: utilityUsageData?.totalWater || 0,
        },
        monthlyData: {
          electric: electricData || [],
          naturalGas: gasData || [],
          water: waterData || [],
        },
        energyMeasures: mappedMeasures,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error("Error fetching report data:", error);
      setReportData((prev) => ({
        ...prev,
        isLoading: false,
        error:
          error instanceof Error ? error.message : "Failed to load report data",
      }));
    }
  };

  const fetchECOData = async () => {
    if (!reportData.project) return;

    try {
      // The ECO data is stored directly in the project's ec_o field
      const ec_o = reportData.project.ec_o;

      // Parse the EC_O data if it's a string
      let ecoAnalysisData;
      if (typeof ec_o === "string" && ec_o) {
        try {
          ecoAnalysisData = JSON.parse(ec_o);
        } catch (parseError) {
          console.error("Error parsing EC_O JSON:", parseError);
          ecoAnalysisData = {};
        }
      } else if (ec_o && typeof ec_o === "object") {
        // It's already an object
        ecoAnalysisData = ec_o;
      } else {
        console.log("No EC_O data found in project");
        ecoAnalysisData = {};
      }

      // Update ECO data with all available information
      setEcoData((prev: EcoData) => ({
        ...prev,
        summary: ecoAnalysisData.summary || "",
        observations: ecoAnalysisData.observations || [],
        recommendations: ecoAnalysisData.recommendations || [],
        hvacSystemDescription: ecoAnalysisData.hvacSystemDescription || "",
        lightingSystemDescription:
          ecoAnalysisData.lightingSystemDescription || "",
        buildingEnvelopeDescription:
          ecoAnalysisData.buildingEnvelopeDescription || "",
        hvacEquipment: ecoAnalysisData.hvacEquipment || [],
        lightingEquipment: ecoAnalysisData.lightingEquipment || [],
        equipmentInventory: ecoAnalysisData.equipmentInventory || [],
        buildingEnvelopeComponents:
          ecoAnalysisData.buildingEnvelopeComponents || [],
        weatherConditions: ecoAnalysisData.weatherConditions || "",
        utilityDataDescription: ecoAnalysisData.utilityDataDescription || "",
        utilitySummary: ecoAnalysisData.utilitySummary || [],
        occupancyScheduleDetails:
          ecoAnalysisData.occupancyScheduleDetails || [],
        isLoading: false,
      }));
    } catch (error) {
      console.error("Error processing ECO data:", error);
      setEcoData((prev: EcoData) => ({
        ...prev,
        isLoading: false,
      }));
    }
  };

  useEffect(() => {
    if (reportData.project) {
      fetchECOData();
    }
  }, [reportData.project]);

  useEffect(() => {
    if (projectId) {
      fetchReportData(projectId);
    }
  }, [projectId]);

  const project = projectDetails;

  // Extract data to fill in placeholders using available properties
  const clientName =
    project?.company_name || project?.property_name || "Client";
  const buildingAddress =
    project?.property_address ||
    project?.building_address ||
    "Property Address";
  const constructionYear =
    project?.property_year_built || project?.year_built || "N/A";
  const buildingType =
    project?.building_type ||
    project?.building_use_type ||
    project?.property_primary_function ||
    "commercial";
  const buildingDescription =
    project?.description || `${buildingType} building`;
  const squareFootage =
    project?.property_gross_floor_area ||
    project?.square_footage ||
    project?.building_sqft ||
    0;

  // Extract any secondary area data if available from building_info
  const secondaryAreaType = project?.building_info?.type
    ? `${project.building_info.type} common`
    : "common";
  const secondaryAreaSqft = Math.round(squareFootage * 0.1); // Estimate as 10% of total

  // Extract unit information if available
  const unitCountType1 =
    project?.total_units || project?.building_info?.total_units || 0;
  const unitType1 =
    project?.building_info?.unit_types?.[0]?.type || "residential";
  const unitCountType2 = project?.building_info?.unit_types?.[1]?.count || 0;
  const unitType2 =
    project?.building_info?.unit_types?.[1]?.type || "commercial";

  // Create executive summary from ecoData or placeholder
  const executiveSummaryContent =
    ecoData.summary ||
    `This report presents the findings of an ASHRAE Level II Energy Audit, Water Audit, and Retro-commissioning (RCx) study conducted at ${buildingAddress}. The analysis identified potential annual savings of $${formatCurrency(
      reportData.totalCost.total * 0.2
    )} through the implementation of energy and water efficiency measures. The property currently has an annual energy consumption of ${formatNumber(
      reportData.totalUsage.total
    )} kWh and water consumption of ${formatNumber(
      reportData.totalUsage.water
    )} gallons. The recommended measures include ${ecoData.recommendations
      .slice(0, 3)
      .map((r) => r.title || r.description)
      .join(", ")}.`;

  //===================================
  // Measures Summary Table
  //===================================

  // Fetch measures data
  const { eems, wems, rcms, isLoading, error } = useMeasures(projectId);

  // Calculate totals
  const calculateTotals = () => {
    let totalCostSavings = 0;
    let totalKwhSavings = 0;
    let totalKwSavings = 0;
    let totalThermsSavings = 0;
    let totalSteamSavings = 0;
    let totalGallonsSavings = 0;
    let totalProjectCost = 0;
    let totalIncentives = 0;
    let totalNetCost = 0;

    // Sum up all measures
    const allMeasures = [...eems, ...wems, ...rcms];

    allMeasures.forEach((measure) => {
      // Add cost savings
      totalCostSavings += measure.estimatedSavings?.cost || 0;

      // Add energy savings
      totalKwhSavings += measure.estimatedSavings?.energy || 0;
      totalKwSavings += measure.estimatedSavings?.demand || 0;
      totalThermsSavings += measure.estimatedSavings?.therms || 0;
      totalSteamSavings += measure.estimatedSavings?.steam || 0;

      // Add water savings
      totalGallonsSavings += measure.estimatedSavings?.water || 0;

      // Add project costs and incentives
      // We'll use detailedCost if available, otherwise estimate from payback period
      if (measure.detailedCost) {
        totalProjectCost += measure.detailedCost.total || 0;
        totalIncentives += measure.detailedCost.incentives || 0;
      } else if (
        measure.estimatedSavings?.cost &&
        measure.estimatedSavings?.paybackPeriod
      ) {
        // Estimate cost based on payback period
        const estimatedCost =
          measure.estimatedSavings.cost *
          measure.estimatedSavings.paybackPeriod;
        totalProjectCost += estimatedCost;
      }
    });

    // Calculate net cost
    totalNetCost = totalProjectCost - totalIncentives;

    return {
      totalCostSavings,
      totalKwhSavings,
      totalKwSavings,
      totalThermsSavings,
      totalSteamSavings,
      totalGallonsSavings,
      totalProjectCost,
      totalIncentives,
      totalNetCost,
    };
  };

  const totals = calculateTotals();

  if (isLoading) {
    return <div className="text-center py-6">Loading measures data...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-6 text-red-500">
        Error loading measures: {error}
      </div>
    );
  }

  // Prepare all measures for display
  const allMeasures = [
    ...eems.map((m, i) => ({ ...m, displayIndex: i + 1, type: "eem" })),
    ...wems.map((m, i) => ({ ...m, displayIndex: i + 1, type: "wem" })),
    ...rcms.map((m, i) => ({ ...m, displayIndex: i + 1, type: "rcm" })),
  ];

  // Function to estimate project cost from payback period
  const getProjectCost = (
    measure: DetailedMeasure & { displayIndex: number; type: string }
  ) => {
    if (measure.detailedCost?.total) {
      return measure.detailedCost.total;
    } else if (
      measure.estimatedSavings?.cost &&
      measure.estimatedSavings?.paybackPeriod
    ) {
      return (
        measure.estimatedSavings.cost * measure.estimatedSavings.paybackPeriod
      );
    }
    return 0;
  };

  // Function to get incentives amount
  const getIncentives = (
    measure: DetailedMeasure & { displayIndex: number; type: string }
  ) => {
    return measure.detailedCost?.incentives || 0;
  };

  // Function to get useful life
  const getUsefulLife = (
    measure: DetailedMeasure & { displayIndex: number; type: string }
  ) => {
    // Default useful life by measure type
    const defaultLife =
      measure.type === "eem" ? 15 : measure.type === "wem" ? 12 : 10;

    // Try to extract useful life from different possible locations
    if (typeof measure.equipmentDetails?.usefulLife === "number") {
      return measure.equipmentDetails.usefulLife;
    }

    return defaultLife;
  };

  // ====================================
  // Measures Financial Analysis
  // ====================================

  // Format percentage for display
  const formatPercent = (value?: number): string => {
    if (value === undefined || value === null || isNaN(value)) return "0%";
    return `${Math.round(value)}%`;
  };

  // Format decimal for display
  const formatDecimal = (value?: number): string => {
    if (value === undefined || value === null || isNaN(value)) return "0.0";
    return value.toFixed(1);
  };

  // Get measure type info
  const getMeasureTypePrefix = (type: string) => {
    switch (type) {
      case "eem":
        return "EEM";
      case "wem":
        return "WEM";
      case "rcm":
        return "RCM";
      default:
        return "Measure";
    }
  };

  if (isLoading) {
    return <div className="text-center py-6">Loading measures data...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-6 text-red-500">
        Error loading measures: {error}
      </div>
    );
  }

  // Function to get simple payback
  const getSimplePayback = (
    measure: DetailedMeasure & { displayIndex: number; type: string }
  ) => {
    return measure.estimatedSavings?.paybackPeriod || 0;
  };

  // Function to get ROI
  const getROI = (
    measure: DetailedMeasure & { displayIndex: number; type: string }
  ) => {
    // Check if roi exists, otherwise calculate a simple ROI based on cost and payback
    if ((measure.estimatedSavings as any)?.roi !== undefined) {
      return (measure.estimatedSavings as any).roi;
    }

    // Fallback calculation based on payback period
    const cost = getProjectCost(measure);
    if (cost === 0) return 0;

    const annualSavings = measure.estimatedSavings?.cost || 0;
    return (annualSavings / cost) * 100; // Simple ROI as a percentage
  };

  // Function to get NPV
  const getNPV = (
    measure: DetailedMeasure & { displayIndex: number; type: string }
  ) => {
    // Check if npv exists, otherwise estimate
    if ((measure.estimatedSavings as any)?.npv !== undefined) {
      return (measure.estimatedSavings as any).npv;
    }

    // Fallback calculation: For example, a very simplified NPV based on annual savings
    const annualSavings = measure.estimatedSavings?.cost || 0;
    const usefulLife = 15; // Default life
    const cost = getProjectCost(measure);

    // Simplified NPV (not accounting for discount rates properly)
    return annualSavings * usefulLife - cost;
  };

  // Function to get IRR
  const getIRR = (
    measure: DetailedMeasure & { displayIndex: number; type: string }
  ) => {
    // Check if irr exists, otherwise estimate
    if ((measure.estimatedSavings as any)?.irr !== undefined) {
      return (measure.estimatedSavings as any).irr;
    }

    // Fallback calculation: For example, a very simplified IRR approximation
    const annualSavings = measure.estimatedSavings?.cost || 0;
    const cost = getProjectCost(measure);
    if (cost === 0) return 0;

    // Simplified approximation (not a true IRR)
    return (annualSavings / cost) * 100;
  };

  // Function to calculate MIRR (Modified Internal Rate of Return)
  const getMIRR = (
    measure: DetailedMeasure & { displayIndex: number; type: string }
  ) => {
    // For demonstration, we'll use a simplified calculation based on IRR
    // In a real implementation, this would involve more complex financial calculations
    const irr = getIRR(measure);
    return irr * 0.6; // Simple estimation for demo purposes
  };

  // Function to calculate Annual Increase in NOI
  const getAnnualNOI = (
    measure: DetailedMeasure & { displayIndex: number; type: string }
  ) => {
    return measure.estimatedSavings?.cost || 0;
  };

  // Function to calculate Annual Savings per sq.ft
  const getAnnualSavingsPerSqFt = (
    measure: DetailedMeasure & { displayIndex: number; type: string },
    squareFootage2: number
  ) => {
    if (squareFootage <= 0) return 0;
    const annualSavings = measure.estimatedSavings?.cost || 0;
    return annualSavings / squareFootage2;
  };

  // Function to calculate Cost per sq.ft
  const getCostPerSqFt = (
    measure: DetailedMeasure & { displayIndex: number; type: string },
    squareFootage2: number
  ) => {
    if (squareFootage2 <= 0) return 0;
    const cost = getProjectCost(measure);
    return cost / squareFootage2;
  };

  // Function to calculate Increase in Asset Value
  const getAssetValueIncrease = (
    measure: DetailedMeasure & { displayIndex: number; type: string }
  ) => {
    // A common rule of thumb is that a property's value increases by 10-20 times the annual energy savings
    const annualSavings = measure.estimatedSavings?.cost || 0;
    return annualSavings * 15; // Using 15x as a multiplier
  };

  // Placeholder for building square footage - should be fetched from project data
  const squareFootage2 = 60000; // Example value

  return (
    <>
      <div className="space-y-6 px-6">
        {/* <Box className="p-4">
          <h2 className="text-2xl font-bold mb-4 text-emerald-700 dark:text-emerald-500">
            Building Energy and Water Efficiency Report
          </h2>
        </Box> */}

        <Box className="p-4">
          <h2 className="text-2xl font-bold mb-4 text-emerald-700 dark:text-emerald-500">
            1. Executive Summary
          </h2>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
            <p>{executiveSummaryContent}</p>
          </div>
        </Box>

        <Box className="p-4">
          <h2 className="text-2xl font-bold mb-4 text-emerald-700 dark:text-emerald-500">
            2. Introduction
          </h2>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
            <p>
              At the request of {clientName}, Vert Energy Group (VEG) performed ASHRAE Level II Energy Audit, Water Audit and a retro-commissioning (RCx) study of the base building systems at {buildingAddress}. Built in {constructionYear}, this building is comprised of {buildingType}. The {buildingType} portion of this property has a gross floor area of {formatNumber(squareFootage)} ft². {unitCountType1 > 0 && unitCountType2 > 0
                ? ` It has a total of ${unitCountType1} ${unitType1} and ${unitCountType2} ${unitType2} apartments.`
                : unitCountType1 > 0
                ? ` It has a total of ${unitCountType1} ${unitType1} units.`
                : ""}
            </p>

            <p className="mt-4">
              The study is referred to as The Existing Buildings Energy and
              Water Efficiency (EBEWE) Program, was established by Los Angeles
              Municipal Code (LAMC) Division 97, Article 1, Chapter IX with the
              purpose of reducing energy and water consumption by building in
              the City of Los Angeles. The efficiency improvements (if
              implemented) will lower the use of energy, water, and greenhouse
              gas emissions citywide.
            </p>

            <h4 className="text-lg font-semibold mt-6 mb-2">
              The Energy Efficiency Audit Scope of Work includes:
            </h4>
            <ol className="list-decimal list-outside ml-6">
              <li>
                Perform an on-site facility survey of existing mechanical,
                electrical, lighting, and control systems, and interview the
                critical operations and maintenance personnel.
              </li>
              <li>
                Summarize observations, existing conditions, necessities, and
                opportunities.
              </li>
              <li>Analyze energy use and ENERGY STAR® benchmarking.</li>
              <li>
                Identify and summarize Energy Efficiency Measures (EEMs) based
                on a 10-year ownership strategy.
              </li>
              <li>
                Prepare an Energy Management Plan to achieve the following
                objectives.
                <ul className="list-disc list-outside ml-6 mt-2">
                  <li>
                    Reduce energy usage and cost through equipment and control
                    upgrades
                  </li>
                  <li>Improve energy performance.</li>
                  <li>
                    Reduce water usage and cost through equipment and control
                    upgrades
                  </li>
                  <li>
                    Reduce water usage and cost thru operation and maintenance
                  </li>
                </ul>
              </li>
            </ol>

            <h4 className="text-lg font-semibold mt-6 mb-2">
              The Water Audit Scope of Work includes:
            </h4>
            <ol className="list-decimal list-outside ml-6">
              <li>
                Perform an on-site facility survey of existing water-using
                fixtures, equipment, systems, and processes, and interview the
                critical operations and maintenance personnel.
              </li>
              <li>
                Summarize observations, existing conditions, necessities, and
                opportunities.
              </li>
              <li>Analyze water use and water use intensity (WUI).</li>
              <li>
                Identify and summarize Water Efficiency Measures (WEMs) based on
                a 10-year ownership strategy.
              </li>
              <li>
                Prepare a Management Plan to achieve the following objectives.
                <ul className="list-disc list-outside ml-6 mt-2">
                  <li>
                    Reduce water usage and cost through equipment and control
                    upgrades.
                  </li>
                  <li>
                    Reduce water usage and cost through monitoring & repairs
                  </li>
                  <li>
                    Reduce water usage and cost thru operation and maintenance
                  </li>
                </ul>
              </li>
            </ol>

            <h4 className="text-lg font-semibold mt-6 mb-2">
              The Retro-commissioning (RCx) study Scope of Work included:
            </h4>
            <ol className="list-decimal list-outside ml-6">
              <li>
                Perform an on-site facility survey of existing mechanical,
                electrical, lighting, and control systems, and interview the
                critical operations and maintenance personnel.
              </li>
              <li>Summarize observations, necessities, and opportunities.</li>
              <li>
                Identify and summarize Retro-commissioning Measures (RCMs) to be
                implemented.
              </li>
              <li>
                Prepare a Retro-commissioning Plan to achieve the following
                objectives.
                <ul className="list-disc list-outside ml-6 mt-2">
                  <li>
                    Correct existing equipment and system problems and
                    deficiencies
                  </li>
                  <li>Optimize the building systems via tune-up activities</li>
                  <li>Improve operation and maintenance (O&M)</li>
                  <li>
                    Reduce maintenance costs and improve long-term equipment
                    reliability
                  </li>
                </ul>
              </li>
            </ol>
          </div>
        </Box>

        <Box className="p-4">
          <h2 className="text-2xl font-bold mb-4 text-emerald-700 dark:text-emerald-500">
            C. EEMs, WEMs & RCMs Performance Analysis Summary
          </h2>

          <p className="mb-6">
            The following table summarizes the overall performance of energy and
            water efficiency measures recommended as part of the Energy
            Management Plan.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse bg-green-50 dark:bg-green-900/20">
              <thead className="bg-green-600/80 text-white dark:bg-green-800">
                <tr className="bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200">
                  <th
                    colSpan={11}
                    className="text-center py-3 px-4 font-semibold text-base"
                  >
                    EEMs, WEMs & RCMs SUMMARY TABLE
                  </th>
                </tr>
                <tr>
                  <th className="px-4 py-2 border border-green-500 font-medium text-left">
                    Measure #
                  </th>
                  <th className="px-4 py-2 border border-green-500 font-medium text-left">
                    Descriptions
                  </th>
                  <th className="px-4 py-2 border border-green-500 font-medium text-right">
                    Cost Savings
                  </th>
                  <th className="px-4 py-2 border border-green-500 font-medium text-right">
                    KWH Savings
                  </th>
                  <th className="px-4 py-2 border border-green-500 font-medium text-right">
                    KW Savings
                  </th>
                  <th className="px-4 py-2 border border-green-500 font-medium text-right">
                    Therms Savings
                  </th>
                  <th className="px-4 py-2 border border-green-500 font-medium text-right">
                    Gallons Savings
                  </th>
                  <th className="px-4 py-2 border border-green-500 font-medium text-right">
                    Estimated Project Cost
                  </th>
                  <th className="px-4 py-2 border border-green-500 font-medium text-right">
                    Incentives
                  </th>
                  <th className="px-4 py-2 border border-green-500 font-medium text-right">
                    Net Cost
                  </th>
                  <th className="px-4 py-2 border border-green-500 font-medium text-right">
                    Useful Life (Years)
                  </th>
                </tr>
              </thead>

              {/* Body */}
              <tbody>
                {allMeasures.map((measure, index) => {
                  const projectCost = getProjectCost(measure);
                  const incentives = getIncentives(measure);
                  const netCost = projectCost - incentives;

                  return (
                    <tr key={measure.id || index}>
                      <td className="px-4 py-2 border border-green-200 dark:border-green-800 text-sm">
                        {getMeasureTypePrefix(measure.type)}
                        {measure.displayIndex}
                      </td>
                      <td className="px-4 py-2 border border-green-200 dark:border-green-800 text-sm">
                        {measure.title}
                      </td>
                      <td className="px-4 py-2 border border-green-200 dark:border-green-800 text-sm text-right">
                        {formatCurrency(measure.estimatedSavings?.cost)}
                      </td>
                      <td className="px-4 py-2 border border-green-200 dark:border-green-800 text-sm text-right">
                        {formatNumber(measure.estimatedSavings?.energy)}
                      </td>
                      <td className="px-4 py-2 border border-green-200 dark:border-green-800 text-sm text-right">
                        {formatNumber(measure.estimatedSavings?.demand)}
                      </td>
                      <td className="px-4 py-2 border border-green-200 dark:border-green-800 text-sm text-right">
                        {formatNumber(measure.estimatedSavings?.therms)}
                      </td>
                      <td className="px-4 py-2 border border-green-200 dark:border-green-800 text-sm text-right">
                        {formatNumber(measure.estimatedSavings?.water)}
                      </td>
                      <td className="px-4 py-2 border border-green-200 dark:border-green-800 text-sm text-right">
                        {formatCurrency(projectCost)}
                      </td>
                      <td className="px-4 py-2 border border-green-200 dark:border-green-800 text-sm text-right">
                        {formatCurrency(incentives)}
                      </td>
                      <td className="px-4 py-2 border border-green-200 dark:border-green-800 text-sm text-right">
                        {formatCurrency(netCost)}
                      </td>
                      <td className="px-4 py-2 border border-green-200 dark:border-green-800 text-sm text-right">
                        {getUsefulLife(measure)}
                      </td>
                    </tr>
                  );
                })}

                {/* Totals Row */}
                <tr>
                  <td
                    className="px-4 py-2 border border-green-200 dark:border-green-800 font-medium"
                    colSpan={2}
                  >
                    TOTAL
                  </td>
                  <td className="px-4 py-2 border border-green-200 dark:border-green-800 font-medium text-right">
                    {formatCurrency(totals.totalCostSavings)}
                  </td>
                  <td className="px-4 py-2 border border-green-200 dark:border-green-800 font-medium text-right">
                    {formatNumber(totals.totalKwhSavings)}
                  </td>
                  <td className="px-4 py-2 border border-green-200 dark:border-green-800 font-medium text-right">
                    {formatNumber(totals.totalKwSavings)}
                  </td>
                  <td className="px-4 py-2 border border-green-200 dark:border-green-800 font-medium text-right">
                    {formatNumber(totals.totalThermsSavings)}
                  </td>
                  <td className="px-4 py-2 border border-green-200 dark:border-green-800 font-medium text-right">
                    {formatNumber(totals.totalGallonsSavings)}
                  </td>
                  <td className="px-4 py-2 border border-green-200 dark:border-green-800 font-medium text-right">
                    {formatCurrency(totals.totalProjectCost)}
                  </td>
                  <td className="px-4 py-2 border border-green-200 dark:border-green-800 font-medium text-right">
                    {formatCurrency(totals.totalIncentives)}
                  </td>
                  <td className="px-4 py-2 border border-green-200 dark:border-green-800 font-medium text-right">
                    {formatCurrency(totals.totalNetCost)}
                  </td>
                  <td className="px-4 py-2 border border-green-200 dark:border-green-800 font-medium text-right">
                    {/* No total for useful life */}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Box>

        <Box className="p-4">
          <h2 className="text-2xl font-bold mb-4 text-emerald-700 dark:text-emerald-500">
            D. EEM, WEM & RCM Financial Analysis Summary
          </h2>

          <p className="mb-6 dark:text-gray-300">
            The following table summarizes the analysis of key financial metrics
            for each energy, water & retro-commissioning measure.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse bg-green-50 dark:bg-green-900/20">
              <thead className="bg-green-600/80 text-white dark:bg-green-800">
                <tr className="bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200">
                  <th
                    colSpan={11}
                    className="text-center py-3 px-4 font-semibold text-base border border-gray-300 dark:border-gray-600"
                  >
                    EEMs, WEMs & RCMs FINANCIAL ANALYSIS
                  </th>
                </tr>
                <tr>
                  <th className="px-4 py-2 border border-green-500 font-medium text-left">
                    Measure #
                  </th>
                  <th className="px-4 py-2 border border-green-500 font-medium text-left">
                    Descriptions
                  </th>
                  <th className="px-4 py-2 border border-green-500 font-medium text-right">
                    Simple Payback (yrs)
                  </th>
                  <th className="px-4 py-2 border border-green-500 font-medium text-right">
                    NPV
                  </th>
                  <th className="px-4 py-2 border border-green-500 font-medium text-right">
                    ROI
                  </th>
                  <th className="px-4 py-2 border border-green-500 font-medium text-right">
                    IRR
                  </th>
                  <th className="px-4 py-2 border border-green-500 font-medium text-right">
                    MIRR
                  </th>
                  <th className="px-4 py-2 border border-green-500 font-medium text-right">
                    Annual Increase in NOI
                  </th>
                  <th className="px-4 py-2 border border-green-500 font-medium text-right">
                    Annual Savings / sq.ft
                  </th>
                  <th className="px-4 py-2 border border-green-500 font-medium text-right">
                    Cost / sq.ft
                  </th>
                  <th className="px-4 py-2 border border-green-500 font-medium text-right">
                    Increase in Asset Value
                  </th>
                </tr>
              </thead>

              {/* Body */}
              <tbody>
                {allMeasures.map((measure, index) => {
                  return (
                    <tr
                      key={`financial-${measure.id || index}`}
                      className="bg-gray-100 dark:bg-gray-800 even:bg-white even:dark:bg-gray-700"
                    >
                      <td className="px-4 py-2 border border-green-200 dark:border-green-800 text-sm">
                        {getMeasureTypePrefix(measure.type)}
                        {measure.displayIndex}
                      </td>
                      <td className="px-4 py-2 border border-green-200 dark:border-green-800 text-sm">
                        {measure.title}
                      </td>
                      <td className="px-4 py-2 border border-green-200 dark:border-green-800 text-sm text-right">
                        {formatDecimal(getSimplePayback(measure))}
                      </td>
                      <td className="px-4 py-2 border border-green-200 dark:border-green-800 text-sm text-right">
                        {formatCurrency(getNPV(measure))}
                      </td>
                      <td className="px-4 py-2 border border-green-200 dark:border-green-800 text-sm text-right">
                        {formatPercent(getROI(measure))}
                      </td>
                      <td className="px-4 py-2 border border-green-200 dark:border-green-800 text-sm text-right">
                        {formatPercent(getIRR(measure))}
                      </td>
                      <td className="px-4 py-2 border border-green-200 dark:border-green-800 text-sm text-right">
                        {formatPercent(getMIRR(measure))}
                      </td>
                      <td className="px-4 py-2 border border-green-200 dark:border-green-800 text-sm text-right">
                        {formatCurrency(getAnnualNOI(measure))}
                      </td>
                      <td className="px-4 py-2 border border-green-200 dark:border-green-800 text-sm text-right">
                        $
                        {formatDecimal(
                          getAnnualSavingsPerSqFt(measure, squareFootage2)
                        )}
                      </td>
                      <td className="px-4 py-2 border border-green-200 dark:border-green-800 text-sm text-right">
                        $
                        {formatDecimal(getCostPerSqFt(measure, squareFootage2))}
                      </td>
                      <td className="px-4 py-2 border border-green-200 dark:border-green-800 text-sm text-right">
                        {formatCurrency(getAssetValueIncrease(measure))}
                      </td>
                    </tr>
                  );
                })}

                {/* Totals Row */}
                <tr className="bg-gray-300 dark:bg-gray-600 font-semibold">
                  <td
                    className="px-4 py-2 border border-green-200 dark:border-green-800 font-medium"
                    colSpan={2}
                  >
                    TOTAL
                  </td>
                  <td className="px-4 py-2 border border-green-200 dark:border-green-800 font-medium text-right">
                    {formatDecimal(
                      allMeasures.length > 0
                        ? allMeasures.reduce(
                            (sum, m) => sum + getSimplePayback(m),
                            0
                          ) / allMeasures.length
                        : 0
                    )}
                  </td>
                  <td className="px-4 py-2 border border-green-200 dark:border-green-800 font-medium text-right">
                    {formatCurrency(
                      allMeasures.reduce((sum, m) => sum + getNPV(m), 0)
                    )}
                  </td>
                  <td className="px-4 py-2 border border-green-200 dark:border-green-800 font-medium text-right">
                    {formatPercent(
                      allMeasures.length > 0
                        ? allMeasures.reduce((sum, m) => sum + getROI(m), 0) /
                            allMeasures.length
                        : 0
                    )}
                  </td>
                  <td className="px-4 py-2 border border-green-200 dark:border-green-800 font-medium text-right">
                    {formatPercent(
                      allMeasures.length > 0
                        ? allMeasures.reduce((sum, m) => sum + getIRR(m), 0) /
                            allMeasures.length
                        : 0
                    )}
                  </td>
                  <td className="px-4 py-2 border border-green-200 dark:border-green-800 font-medium text-right">
                    {formatPercent(
                      allMeasures.length > 0
                        ? allMeasures.reduce((sum, m) => sum + getMIRR(m), 0) /
                            allMeasures.length
                        : 0
                    )}
                  </td>
                  <td className="px-4 py-2 border border-green-200 dark:border-green-800 font-medium text-right">
                    {formatCurrency(
                      allMeasures.reduce((sum, m) => sum + getAnnualNOI(m), 0)
                    )}
                  </td>
                  <td className="px-4 py-2 border border-green-200 dark:border-green-800 font-medium text-right">
                    $
                    {formatDecimal(
                      allMeasures.reduce(
                        (sum, m) =>
                          sum + getAnnualSavingsPerSqFt(m, squareFootage2),
                        0
                      )
                    )}
                  </td>
                  <td className="px-4 py-2 border border-green-200 dark:border-green-800 font-medium text-right">
                    $
                    {formatDecimal(
                      allMeasures.reduce(
                        (sum, m) => sum + getCostPerSqFt(m, squareFootage2),
                        0
                      )
                    )}
                  </td>
                  <td className="px-4 py-2 border border-green-200 dark:border-green-800 font-medium text-right">
                    {formatCurrency(
                      allMeasures.reduce(
                        (sum, m) => sum + getAssetValueIncrease(m),
                        0
                      )
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Box>

        <Box className="p-4">
          <h2 className="text-2xl font-bold mb-4 text-emerald-700 dark:text-emerald-500">
            E. Next Steps
          </h2>

          <div className="prose prose-emerald max-w-none dark:prose-invert">
            <p className="mb-4">
              The Energy Efficiency Measures summarized above and throughout the
              report are conceptual. Additional technical due-diligence,
              planning and design are required prior to implementation.
              Specifically, management and Vert Energy Group should first set up
              a planning meeting to determine which measures should be
              considered for further development and if they contribute to the
              overall goals of ownership.
            </p>

            <p className="mb-4">
              The following additional tasks are recommended to implement the
              proposed Energy Management Plan:
            </p>

            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li>
                Engineering due-diligence, analysis, and preliminary design to
                confirm overall project performance.
              </li>
              <li>
                LADWP research and negotiation to determine final rebate
                amounts.
              </li>
              <li>Project engineering and permitting as applicable.</li>
              <li>Contractor solicitation and budgeting.</li>
              <li>Financing and execution of construction contracts.</li>
            </ul>

            <p className="mb-4">
              To commence the proposed Energy Management Program (EMP) Property
              Management should first consider proceeding with energy efficiency
              measures which have the highest Net Present Values (NPV), and the
              lowest pay back periods. Additionally, VEG has provided the
              following guidelines to assist in prioritizing energy efficiency
              measures.
            </p>

            <h3 className="text-lg font-semibold mt-6 mb-3 text-emerald-600 dark:text-emerald-400">
              Implementation Priority Guidelines
            </h3>

            <p className="mb-3">
              EEMs & RCM recommended to be implemented first may result in one
              or more of the following benefits:
            </p>

            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li>Independent of all other EEM's.</li>
              <li>The simplest to implement.</li>
              <li>The most cost effective.</li>
              <li>Visible to occupants and guests.</li>
            </ul>
          </div>
        </Box>
      </div>
    </>
  );
}

// Helper functions for formatting
function formatNumber(value: number): string {
  return new Intl.NumberFormat().format(Math.round(value));
}

const formatCurrency = (value?: number): string => {
  if (value === undefined || value === null || isNaN(value)) return "$0";
  return `$${Math.round(value).toLocaleString()}`;
};
