import { useState, useEffect } from "react";
import {
  energyStarBenchmarkingService,
  BenchmarkData,
} from "./EnergyStarBenchmarkingService";
import { PlaceholderHighlight } from "@/components/ui/PlaceholderHighlight";
import { getProject } from "@/services/projects";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";

interface EnergyStarBenchmarkingProps {
  projectId: string;
}

export function EnergyStarBenchmarking({
  projectId,
}: EnergyStarBenchmarkingProps) {
  const [benchmarkData, setBenchmarkData] = useState<BenchmarkData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [projectData, setProjectData] = useState<any>(null);
  const [summaryData, setSummaryData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // First fetch the project data to get accurate building info
        const project = await getProject(projectId);
        setProjectData(project);

        // Get actual building data from project
        const propertyAddress =
          project?.property_address || project?.building_address;
        const propertyType =
          project?.building_type || project?.property_primary_function;
        const grossFloorArea = project?.property_gross_floor_area;
        const builtYear = project?.property_year_built;

        // Then fetch the benchmarking data
        const benchData = await energyStarBenchmarkingService.getBenchmarkData(
          projectId
        );

        console.log("Benchmark data:", benchData);

        // If no benchmark data AND no project energy data, show "no data available"
        if (
          !benchData &&
          !project?.energy_star_score &&
          !project?.site_intensity
        ) {
          setBenchmarkData(null);
          return;
        }

        // Create data object using only real data
        const realData: BenchmarkData = {
          energyStarScore: project?.energy_star_score,
          siteEUI: project?.site_intensity,
          sourceEUI: project?.source_intensity,
          nationalMedianSiteEUI: undefined, // Will calculate if we have the data
          percentDifference: undefined, // Will calculate if we have the data
          buildingInfo: {
            address: propertyAddress,
            propertyType: propertyType,
            grossFloorArea: grossFloorArea,
            builtYear: builtYear,
            reportingPeriodEnd: "December 31, 2025",
            dateGenerated: new Date().toLocaleDateString(),
          },
        };

        // Calculate percentage difference if we have the necessary data
        // In many systems, this would be calculated rather than stored
        if (project?.site_intensity) {
          // Using the standard 44.8 as the median for multifamily if we don't have it
          const medianEUI = 44.8;
          realData.nationalMedianSiteEUI = medianEUI;
          realData.percentDifference = Math.round(
            ((project.site_intensity - medianEUI) / medianEUI) * 100
          );
        }

        // If we have benchmark data, merge it with our project data
        if (benchData) {
          setBenchmarkData({
            ...realData,
            ...benchData,
            buildingInfo: {
              ...realData.buildingInfo,
              ...benchData.buildingInfo,
            },
          });
        } else {
          // Otherwise just use project data
          setBenchmarkData(realData);
        }

        // Then fetch the benchmarking data
        const summaryData =
          await energyStarBenchmarkingService.getEnergySummary(projectId);

        setSummaryData(summaryData);

        console.log("Summary data:", summaryData);
      } catch (err) {
        console.error("Error fetching benchmark data:", err);
        setBenchmarkData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [projectId]);

  const hasRealEnergyData =
    benchmarkData &&
    (benchmarkData.energyStarScore !== undefined ||
      benchmarkData.siteEUI !== undefined ||
      benchmarkData.sourceEUI !== undefined);

  if (isLoading) {
    return <div className="text-center py-6">Loading benchmarking data...</div>;
  }

  // If no real energy data is available, show a warning
  if (!hasRealEnergyData) {
    return (
      <section className="mb-10">
        <h2 className="text-emerald-600 font-medium">
          Current ENERGY STAR® Benchmarking
        </h2>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-6 mb-4">
          <div className="flex flex-col items-center justify-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-10 w-10 text-yellow-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="font-medium text-yellow-700 dark:text-yellow-400 text-lg text-center">
              Missing Energy Star Benchmarking Data
            </span>
            <p className="text-gray-600 dark:text-gray-400 text-center">
              This building is missing real energy benchmarking data. Please
              upload Portfolio Manager data for this building.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <TooltipProvider>
      <section className="mb-10">
        <h2 className="text-emerald-600 font-medium">
          Current ENERGY STAR® Benchmarking
        </h2>

        <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
          Using the Department of Energy's Portfolio Manager Software, an
          analysis of the previous 12-month electricity and natural gas usage
          has determined that this property receives an energy benchmark score
          on energy consumption. Benchmarking a building's energy use is similar
          to an MPG rating for automobiles. It gives the property a score of
          1-100 to compare its energy efficiency to similar buildings. This
          score is the benchmark rating for a facility relative to similar
          buildings nationwide and normalized for weather conditions. The
          benchmark rating is based on the facility source energy use, level of
          business activity, and geographical location.
        </p>

        {hasRealEnergyData ? (
          <div className="space-y-6">
            {/* Energy Star Score Card */}
            {benchmarkData?.energyStarScore !== undefined && (
              <div className="relative">
                {/* Background gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 dark:from-emerald-900/10 dark:via-blue-900/10 dark:to-purple-900/10 rounded-2xl"></div>

                <div className="bg-white dark:bg-[#0d0d0d] dark:text-white p-6 rounded-xl space-y-6 max-w-6xl mx-auto relative">
                  {/* Header Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div className="border-2 border-blue-500 rounded-lg py-4">
                      <div className="text-3xl font-bold text-blue-400">
                        {benchmarkData.energyStarScore || "N/A"}
                      </div>
                      <div className="text-sm">ENERGY STAR Score</div>
                    </div>
                    <div className="border-2 border-orange-500 rounded-lg py-4">
                      <div className="text-2xl font-bold text-orange-400">
                        {benchmarkData.buildingInfo?.grossFloorArea?.toLocaleString() ||
                          "N/A"}
                      </div>
                      <div className="text-sm">Floor Area</div>
                    </div>
                    <div className="border-2 border-gray-600 rounded-lg py-4">
                      <div className="text-2xl font-bold">
                        {benchmarkData.buildingInfo?.builtYear || "N/A"}
                      </div>
                      <div className="text-sm">Year Built</div>
                    </div>
                    <div className="border-2 border-green-500 rounded-lg py-4">
                      <div className="text-2xl font-bold text-green-400">
                        {benchmarkData.buildingInfo?.reportingPeriodEnd ||
                          "N/A"}
                      </div>
                      <div className="text-sm">Data As Of</div>
                    </div>
                  </div>

                  {/* Benchmark & Property Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-[#111] p-5 rounded-lg border border-gray-700">
                      <h2 className="text-blue-400 text-lg font-semibold">
                        ENERGY STAR® Benchmark
                      </h2>
                      <p className="text-green-400 text-sm mb-2">
                        Current ENERGY STAR® Benchmarking
                      </p>
                      <p className="text-sm dark:text-gray-300">
                        Currently the facility has a Site Energy Use Index (EUI)
                        of <strong> {benchmarkData?.siteEUI || "N/A"}</strong>
                        kBtu per square foot while the national median site EUI
                        is
                        <strong>
                          {benchmarkData?.nationalMedianSiteEUI || "N/A"}
                        </strong>
                        kBtu per square foot. The building Site Energy Use Index
                        is
                        <strong>
                          {Math.abs(benchmarkData?.percentDifference || 0)}%
                        </strong>
                        <strong>
                          {(benchmarkData?.percentDifference || -14) < 0
                            ? "lower"
                            : "higher"}
                        </strong>
                        than the national median.
                      </p>
                    </div>

                    <div className="bg-white dark:bg-[#111] p-5 rounded-lg border border-gray-700">
                      <h2 className="dark:text-white text-lg font-semibold mb-3">
                        Property Info
                      </h2>
                      <ul className="text-sm dark:text-gray-300 space-y-2">
                        <li>
                          📍
                          <span className="dark:text-white">
                            {benchmarkData.buildingInfo?.address ||
                              "Property Address"}
                          </span>
                        </li>
                        <li>
                          🏢 Property Type:
                          <span className="dark:text-white">
                            {benchmarkData.buildingInfo?.propertyType ||
                              "Multifamily Housing"}
                          </span>
                        </li>
                        <li>
                          🏢 Property Area:
                          <span className="dark:text-white">
                            {benchmarkData.buildingInfo?.grossFloorArea?.toLocaleString()}
                          </span>
                        </li>
                        <li>
                          📅 Build Year:
                          <span className="dark:text-white">
                            {benchmarkData.buildingInfo?.builtYear || "N/A"}
                          </span>
                        </li>
                        <li>
                          🕒 Report Generated:
                          <span className="dark:text-white">
                            {benchmarkData.buildingInfo?.reportingPeriodEnd ||
                              "N/A"}
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* EUI Description */}
            {/* <div className="mt-6">
              <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
                Currently the facility has a Site Energy Use Index (EUI) of
                <strong> {benchmarkData?.siteEUI || 38.5}</strong>
                kBtu per square foot while the national median site EUI is
                <strong> {benchmarkData?.nationalMedianSiteEUI || 44.8}</strong>
                kBtu per square foot. The building Site Energy Use Index is
                <strong>
                  {Math.abs(benchmarkData?.percentDifference || 14)}%
                </strong>
                <strong>
                  {(benchmarkData?.percentDifference || -14) < 0
                    ? "lower"
                    : "higher"}
                </strong>
                than the national median.
              </p>
            </div> */}

            {/* Energy Consumption Table */}
            <div className="relative">
              {/* Background gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 dark:from-emerald-900/10 dark:via-blue-900/10 dark:to-purple-900/10 rounded-2xl"></div>

              <div className="dark:bg-[#13181c] dark:text-white mx-auto p-6 rounded-xl relative">
                {/* Title */}
                <h2 className="text-xl font-bold text-center mb-6">
                  Energy Consumption and Energy Use Intensity (EUI)
                </h2>

                {/* Top Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                  {/* Site EUI */}
                  <div className="flex flex-col items-center justify-center border-2 border-cyan-500 rounded-lg py-6 dark:bg-[#171c21]">
                    <div className="text-4xl font-bold text-cyan-400 mb-1">
                      {benchmarkData?.siteEUI || 38.5}
                    </div>
                    <div className="text-base font-semibold dark:text-cyan-200">
                      Site EUI
                    </div>
                    <div className="text-sm dark:text-gray-400">kBtu/ft²</div>
                  </div>

                  {/* Annual Energy by Fuel */}
                  <div className="flex-1 dark:bg-[#171c21] rounded-lg border border-gray-700 py-4 px-2">
                    <div className="font-bold text-lg mb-3">
                      Annual Energy by Fuel
                    </div>
                    <div className="flex flex-col items-center justify-center">
                      <div className="text-base dark:text-gray-200 mb-1">
                        Electric - Grid (kBtu)
                      </div>
                      <div className="text-2xl font-bold dark:text-white">
                        {summaryData?.summary?.electricUsage}
                        <span className="dark:text-gray-400 text-base font-normal">
                          (45%)
                        </span>
                      </div>
                      <div className="text-base dark:text-gray-200 mt-2 mb-1">
                        Natural Gas (kBtu)
                      </div>
                      <div className="text-2xl font-bold dark:text-white">
                        {summaryData?.summary?.gasUsage}
                        <span className="dark:text-gray-400 text-base font-normal">
                          (55%)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Annual Emissions */}
                  <div className="flex flex-col items-center justify-center border-2 border-red-500 rounded-lg py-6 dark:bg-[#171c21]">
                    <div className="font-semibold mb-1">Annual Emissions</div>
                    <div className="text-sm dark:text-gray-300 mb-1">
                      Total (Location-Based) GHG Emissions
                    </div>
                    <div className="text-sm dark:text-gray-400 mb-1">
                      (Metric Tons CO₂e/year)
                    </div>
                    <div className="text-4xl font-bold text-red-400">
                      {projectData?.direct_ghg_emissions}
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t dark:border-gray-700 my-3"></div>

                {/* Bottom Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Source EUI */}
                  <div className="flex flex-col items-center justify-center border-2 border-yellow-500 rounded-lg py-6 dark:bg-[#171c21]">
                    <div className="text-4xl font-bold text-yellow-300 mb-1">
                      {benchmarkData?.sourceEUI || 70.8}
                    </div>
                    <div className="text-base font-semibold dark:text-yellow-200">
                      Source EUI
                    </div>
                    <div
                      className={`text-sm ${
                        benchmarkData?.percentDifference > 0
                          ? "text-green-500"
                          : "text-red-500"
                      }`}
                    >
                      {benchmarkData?.percentDifference || "-14"}%
                    </div>
                  </div>

                  {/* National Median Comparison */}
                  <div className="dark:bg-[#171c21] rounded-lg border border-gray-700 px-4 py-4">
                    <div className="font-bold text-lg mb-3">
                      National Median Comparison
                    </div>
                    <div className="text-sm flex flex-col gap-1">
                      <div className="flex justify-between">
                        <span>National Median Site EUI (kBtu/ft²)</span>
                        <span className="font-semibold dark:text-white">
                          {benchmarkData?.nationalMedianSiteEUI || 44.8}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>National Median Source EUI (kBtu/ft²)</span>
                        <span className="font-semibold dark:text-white">82.2</span>
                      </div>
                      <div className="flex justify-between">
                        <span>% Diff from National Median Source EUI</span>
                        <span
                          className={`font-semibold ${
                            benchmarkData?.percentDifference > 0
                              ? "text-green-400"
                              : "text-red-400"
                          }`}
                        >
                          {benchmarkData?.percentDifference || "-14"}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Green Power */}
                  <div className="dark:bg-[#171c21] rounded-lg border border-gray-700 px-4 py-4">
                    <div className="font-bold text-lg mb-3">Green Power</div>
                    <div className="text-sm flex flex-col gap-1">
                      <div className="flex justify-between">
                        <span>Green Power – Onsite (kWh)</span>
                        <span className="font-semibold text-gray-400">N/A</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Green Power – Offsite (kWh)</span>
                        <span className="font-semibold text-gray-400">0</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Percent of RECs Retained</span>
                        <span className="font-semibold text-gray-400">N/A</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-6 mb-4">
            <div className="flex flex-col items-center justify-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-10 w-10 text-yellow-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="font-medium text-yellow-700 dark:text-yellow-400 text-lg text-center">
                No Energy Star Benchmarking Data Available
              </span>
              <p className="text-gray-600 dark:text-gray-400 text-center">
                Energy Star benchmarking data has not been provided for this
                property.
              </p>
            </div>
          </div>
        )}
      </section>
    </TooltipProvider>
  );
}

export default EnergyStarBenchmarking;
