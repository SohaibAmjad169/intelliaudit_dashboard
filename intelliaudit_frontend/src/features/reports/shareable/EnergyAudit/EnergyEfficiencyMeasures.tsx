import React, { useState, useEffect } from "react";
import { getProject } from "@/services/projects";
import { measuresV2Service } from "@/services/measures/measures-v2";
import { usePhotoManagement } from "@/hooks/usePhotoManagement";
import { Photo } from "@/types/eco";
import { useMeasures } from "@/hooks/useMeasures";

interface EnergyEfficiencyMeasuresProps {
  projectId: string;
}

interface EstimatedSavings {
  cost: number;
  steam: number;
  water: number;
  demand: number;
  energy: number;
  therms: number;
  paybackPeriod: number;
  implementationCost?: number;
}

interface Measure {
  id: string;
  title: string;
  description: string;
  existingCondition: string;
  recommendation: string;
  benefits: string[];
  estimatedSavings?: EstimatedSavings;
  photoReferences?: string[];
  implementationNotes?: string;
  supportingImages?: {
    existing?: string;
    replacement?: string;
  };
  images?: {
    existingFixture?: string;
    newFixture?: string;
    cfl?: string;
    ledBulb?: string;
  };
  type?: string;
  status?: "implemented" | "recommended" | "consider";
  roi?: "high" | "medium" | "low";
}

interface MeasuresData {
  eems: Measure[];
  wems: Measure[];
  rcms: Measure[];
  customMeasures: Measure[];
}

// Default image URLs if not provided in the project data
const DEFAULT_IMAGES = {
  fluorescent: "/images/reports/existing-fluorescent.jpg",
  ledTube: "/images/reports/led-tube-replacement.jpg",
  cfl: "/images/reports/cfl-example.jpg",
  ledBulb: "/images/reports/led-bulb-replacement.jpg",
};

// Create a MissingData component for consistent warnings
const MissingData = () => (
  <span className="inline-flex items-center text-yellow-700 dark:text-yellow-500">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4 mr-1"
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
    No data available
  </span>
);

export function EnergyEfficiencyMeasures({
  projectId,
}: EnergyEfficiencyMeasuresProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [measures, setMeasures] = useState<Measure[]>([]);
  const [projectData, setProjectData] = useState<any>(null);
  const { photos } = usePhotoManagement(projectId);

  // Use the working measures hook that's used in other components
  const {
    eems,
    wems,
    rcms,
    customMeasures,
    isLoading: measuresLoading,
  } = useMeasures(projectId);

  // Add a function to filter photos by ID
  const getPhotosByIds = (photoIds: string[] = []): Photo[] => {
    if (!photoIds || photoIds.length === 0 || photos.length === 0) return [];

    // Try to match photos by different ID formats
    const matchedPhotos = photos.filter((photo) => {
      // Try to match the ID exactly
      const exactMatch = photoIds.includes(photo.id);
      if (exactMatch) return true;

      // As fallback, check if any photo ID contains the reference ID or vice versa
      return photoIds.some(
        (refId) => photo.id.includes(refId) || refId.includes(photo.id)
      );
    });

    return matchedPhotos;
  };

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Fetch project data for any supplementary information
        const projectResponse = await getProject(projectId);
        const project = Array.isArray(projectResponse)
          ? projectResponse[0]
          : projectResponse;
        setProjectData(project);

        // No need to fetch measures again, the useMeasures hook is doing it
        // Just convert them to the format this component expects
        if (!measuresLoading) {
          // Convert hook data to the format this component expects
          const allMeasures: Measure[] = [
            ...eems.map((m) => ({
              id: m.id,
              title: m.title || "",
              description: m.title || "", // Use title as fallback for description
              existingCondition: m.existingCondition || "",
              recommendation: m.recommendation || "",
              benefits: m.benefits || [],
              implementationNotes: m.implementationNotes || "",
              type: "EEM", // This is already an EEM
              estimatedSavings: {
                cost: m.estimatedSavings?.cost || 0,
                energy: m.estimatedSavings?.energy || 0,
                water: m.estimatedSavings?.water || 0,
                steam: m.estimatedSavings?.steam || 0,
                demand: m.estimatedSavings?.demand || 0,
                therms: m.estimatedSavings?.therms || 0,
                paybackPeriod: m.estimatedSavings?.paybackPeriod || 0,
              },
              supportingImages: m.supportingImages,
              photoReferences: m.photoReferences,
            })),
            ...wems.map((m) => ({
              id: m.id,
              title: m.title || "",
              description: m.title || "", // Use title as fallback for description
              existingCondition: m.existingCondition || "",
              recommendation: m.recommendation || "",
              benefits: m.benefits || [],
              implementationNotes: m.implementationNotes || "",
              type: "WEM", // This is a WEM
              estimatedSavings: {
                cost: m.estimatedSavings?.cost || 0,
                energy: m.estimatedSavings?.energy || 0,
                water: m.estimatedSavings?.water || 0,
                steam: m.estimatedSavings?.steam || 0,
                demand: m.estimatedSavings?.demand || 0,
                therms: m.estimatedSavings?.therms || 0,
                paybackPeriod: m.estimatedSavings?.paybackPeriod || 0,
              },
              supportingImages: m.supportingImages,
              photoReferences: m.photoReferences,
            })),
            ...rcms.map((m) => ({
              id: m.id,
              title: m.title || "",
              description: m.title || "", // Use title as fallback for description
              existingCondition: m.existingCondition || "",
              recommendation: m.recommendation || "",
              benefits: m.benefits || [],
              implementationNotes: m.implementationNotes || "",
              type: "RCM", // This is a RCM
              estimatedSavings: {
                cost: m.estimatedSavings?.cost || 0,
                energy: m.estimatedSavings?.energy || 0,
                water: m.estimatedSavings?.water || 0,
                steam: m.estimatedSavings?.steam || 0,
                demand: m.estimatedSavings?.demand || 0,
                therms: m.estimatedSavings?.therms || 0,
                paybackPeriod: m.estimatedSavings?.paybackPeriod || 0,
              },
              supportingImages: m.supportingImages,
              photoReferences: m.photoReferences,
            })),
          ];

          setMeasures(allMeasures);
        }
      } catch (error) {
        console.error("Error fetching measures data:", error);
        setError("Failed to load measures data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [projectId, eems, wems, rcms, measuresLoading]);

  // Get image URLs from project data if available, otherwise use defaults
  const getImageUrls = (measure: Measure) => {
    return {
      fluorescent:
        measure.supportingImages?.existing ||
        measure.images?.existingFixture ||
        projectData?.supportingImages?.existing ||
        projectData?.images?.fluorescent ||
        DEFAULT_IMAGES.fluorescent,

      ledTube:
        measure.supportingImages?.replacement ||
        measure.images?.newFixture ||
        projectData?.supportingImages?.replacement ||
        projectData?.images?.ledTube ||
        DEFAULT_IMAGES.ledTube,

      cfl:
        measure.images?.cfl || projectData?.images?.cfl || DEFAULT_IMAGES.cfl,

      ledBulb:
        measure.images?.ledBulb ||
        projectData?.images?.ledBulb ||
        DEFAULT_IMAGES.ledBulb,
    };
  };

  // Convert estimatedSavings to the format expected by the component
  const getAnnualSavings = (measure: Measure) => {
    if (!measure.estimatedSavings) return null;

    // Annual cost savings (the recurring benefit)
    const annualCostSavings = measure.estimatedSavings.cost || 0;

    // Total implementation cost
    let implementationCost = 0;

    // Get implementation cost either directly or calculate it from payback period
    if (measure.estimatedSavings.implementationCost) {
      // If we have an explicit implementation cost, use it
      implementationCost = measure.estimatedSavings.implementationCost;
    } else if (
      measure.estimatedSavings.paybackPeriod &&
      annualCostSavings > 0
    ) {
      // Otherwise calculate it based on annual savings × payback period
      implementationCost =
        annualCostSavings * measure.estimatedSavings.paybackPeriod;
    }

    // Calculate ROI as (Annual Return / Implementation Cost) * 100
    // This is the standard simple ROI formula
    const roi =
      implementationCost > 0
        ? Math.round((annualCostSavings / implementationCost) * 100)
        : 0;

    return {
      energy: measure.estimatedSavings.energy || 0,
      cost: annualCostSavings,
      co2: Math.round((measure.estimatedSavings.energy || 0) * 0.0007), // Rough CO2 estimate based on kWh
      implementationCost: implementationCost,
      roi: roi,
      paybackPeriod: measure.estimatedSavings.paybackPeriod || 0,
    };
  };

  if (isLoading) {
    return (
      <div className="text-center py-6">
        Loading energy efficiency measures...
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-6 text-red-500">Error: {error}</div>;
  }

  // Filter to show energy-related measures by their status
  const recommendedMeasures = measures.filter(
    (m) => m.type === "EEM" && (!m.status || m.status === "recommended")
  );
  const implementedMeasures = measures.filter(
    (m) => m.type === "EEM" && m.status === "implemented"
  );
  const consideredMeasures = measures.filter(
    (m) => m.type === "EEM" && m.status === "consider"
  );

  // If there are no measures of any type, show the empty state
  if (
    (!recommendedMeasures || recommendedMeasures.length === 0) &&
    (!implementedMeasures || implementedMeasures.length === 0) &&
    (!consideredMeasures || consideredMeasures.length === 0)
  ) {
    return (
      <section className="mb-10">
        {/* <h2 className="text-2xl font-bold mb-6 text-emerald-700 dark:text-emerald-500">
          Energy Efficiency Measures (EEMs)
        </h2> */}

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
              No Energy Efficiency Measures Found
            </span>
            <p className="text-gray-600 dark:text-gray-400 text-center">
              No energy efficiency measures have been defined for this project.
            </p>
          </div>
        </div>
      </section>
    );
  }

  // Create a function to render measures by type
  const renderMeasureSection = (
    measures: Measure[],
    title: string,
    description?: string,
    showEmpty: boolean = false
  ) => {
    if (!measures || measures.length === 0) {
      if (!showEmpty) return null;

      // Show empty section with warning
      return (
        <div className="mb-12">
          {/* <h2 className="text-2xl font-bold mb-3 text-emerald-700 dark:text-emerald-500">
            {title}
          </h2> */}

          {description && (
            <p className="mb-6 text-gray-700 dark:text-gray-300">
              {description}
            </p>
          )}

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
                No Measures Found
              </span>
              <p className="text-gray-600 dark:text-gray-400 text-center">
                No measures have been identified for this category.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="mb-12">
        {/* <h2 className="text-2xl font-bold mb-3 text-emerald-700 dark:text-emerald-500">
          {title}
        </h2> */}

        {description && (
          <p className="mb-6 text-gray-700 dark:text-gray-300">{description}</p>
        )}

        {measures.map((measure, measureIndex) => {
          // For LED lighting measures, show more detailed layout with images
          const isLightingMeasure =
            measure.title.toLowerCase().includes("led") &&
            measure.title.toLowerCase().includes("light");

          const annualSavings = getAnnualSavings(measure);
          const imageUrls = getImageUrls(measure);

          return (
            <div
              key={measure.id || `measure-${measureIndex}`}
              className="mb-8 relative"
            >
              {/* Background gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 dark:from-emerald-900/10 dark:via-blue-900/10 dark:to-purple-900/10 rounded-2xl"></div>

              <div className="p-4 border rounded-md relative">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {measureIndex + 1}. {measure.title}
                </h3>

                <div className="mb-4">
                  <h4 className="text-emerald-600 font-medium">
                    Existing Condition:
                  </h4>
                  <p className="mb-4 dark:text-gray-300">
                    {measure.existingCondition}
                  </p>
                </div>

                <div className="mb-4">
                  <h4 className="text-emerald-600 font-medium">
                    Recommendation:
                  </h4>
                  <p className="mb-4 dark:text-gray-300">
                    {measure.recommendation}
                  </p>

                  {measure.benefits && measure.benefits.length > 0 ? (
                    <ol className="list-disc pl-6 mb-4 dark:text-gray-300">
                      {measure.benefits.map((benefit, index) => {
                        // Parse benefits that may be formatted as "Title: Description"
                        const parts = benefit.split(":");
                        const title = parts.length > 1 ? parts[0] : "";
                        const desc =
                          parts.length > 1 ? parts.slice(1).join(":") : benefit;

                        return (
                          <li key={`benefit-${index}`} className="mb-2">
                            {title && (
                              <span className="font-semibold">{title}:</span>
                            )}
                            {desc}
                          </li>
                        );
                      })}
                    </ol>
                  ) : (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-3 mb-4">
                      <div className="flex items-center gap-2">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-yellow-500"
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
                        <span className="text-yellow-700 dark:text-yellow-400">
                          No benefit information available
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {isLightingMeasure && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="border border-gray-300 dark:border-gray-600 rounded overflow-hidden">
                      <div className="bg-gray-200 dark:bg-gray-700 p-2 text-center font-semibold">
                        Existing T-8 & T-12 Fluorescent Lamp
                      </div>
                      <div className="p-2 flex justify-center bg-white dark:bg-gray-800">
                        {measure.images?.existingFixture ||
                        projectData?.images?.fluorescent ? (
                          <img
                            src={imageUrls.fluorescent}
                            alt="Existing T-8 & T-12 Fluorescent Lamp"
                            className="h-48 object-contain"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = "none";
                              target.parentElement!.innerHTML = `
                                <div class="h-48 w-full flex flex-col items-center justify-center gap-2 bg-yellow-50 dark:bg-yellow-900/20">
                                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <span class="text-yellow-700 dark:text-yellow-400 text-sm">Image failed to load</span>
                                </div>
                              `;
                            }}
                          />
                        ) : (
                          <div className="h-48 w-full flex flex-col items-center justify-center gap-2 bg-yellow-50 dark:bg-yellow-900/20">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-6 w-6 text-yellow-500"
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
                            <span className="text-yellow-700 dark:text-yellow-400 text-sm">
                              No image available
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="border border-gray-300 dark:border-gray-600 rounded overflow-hidden">
                      <div className="bg-gray-200 dark:bg-gray-700 p-2 text-center font-semibold">
                        LED Replacement
                      </div>
                      <div className="p-2 flex justify-center bg-white dark:bg-gray-800">
                        {measure.images?.newFixture ||
                        projectData?.images?.ledTube ? (
                          <img
                            src={imageUrls.ledTube}
                            alt="LED Tube Replacement"
                            className="h-48 object-contain"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = "none";
                              target.parentElement!.innerHTML = `
                                <div class="h-48 w-full flex flex-col items-center justify-center gap-2 bg-yellow-50 dark:bg-yellow-900/20">
                                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <span class="text-yellow-700 dark:text-yellow-400 text-sm">Image failed to load</span>
                                </div>
                              `;
                            }}
                          />
                        ) : (
                          <div className="h-48 w-full flex flex-col items-center justify-center gap-2 bg-yellow-50 dark:bg-yellow-900/20">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-6 w-6 text-yellow-500"
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
                            <span className="text-yellow-700 dark:text-yellow-400 text-sm">
                              No image available
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {measure.photoReferences &&
                  measure.photoReferences.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-emerald-600 font-medium">
                        Supporting Images:
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {getPhotosByIds(measure.photoReferences).map(
                          (photo) => (
                            <div
                              key={photo.id}
                              className="border border-gray-300 dark:border-gray-600 rounded overflow-hidden"
                            >
                              <div className="aspect-video relative">
                                <img
                                  src={photo.url}
                                  alt={photo.caption || `Photo ${photo.id}`}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = "none";
                                    target.parentElement!.innerHTML = `
                                  <div class="w-full h-full flex flex-col items-center justify-center gap-2 bg-yellow-50 dark:bg-yellow-900/20">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span class="text-yellow-700 dark:text-yellow-400 text-sm">Photo not available</span>
                                  </div>
                                `;
                                  }}
                                />
                              </div>
                              <div className="p-2 bg-gray-100 dark:bg-gray-800 text-xs">
                                <p className="font-medium text-gray-700 dark:text-gray-300 truncate">
                                  {photo.caption || "Photo"}
                                </p>
                                {photo.category && (
                                  <p className="text-gray-500 dark:text-gray-400 truncate">
                                    Category: {photo.category}
                                  </p>
                                )}
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                {annualSavings && (
                  <div className="mb-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-md">
                    <h4 className="text-emerald-600 font-medium">
                      Measure Summary
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Annual Energy Savings
                        </p>
                        <p className="text-lg font-semibold">
                          {annualSavings.energy ? (
                            `${annualSavings.energy.toLocaleString()} kWh`
                          ) : (
                            <MissingData />
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Annual Cost Savings
                        </p>
                        <p className="text-lg font-semibold">
                          {annualSavings.cost ? (
                            `$${annualSavings.cost.toLocaleString()}`
                          ) : (
                            <MissingData />
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          CO₂ Reduction
                        </p>
                        <p className="text-lg font-semibold">
                          {annualSavings.co2 ? (
                            `${annualSavings.co2.toLocaleString()} tons/year`
                          ) : (
                            <MissingData />
                          )}
                        </p>
                      </div>
                    </div>

                    {measure.estimatedSavings?.paybackPeriod && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-emerald-200 dark:border-emerald-800">
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Implementation Cost
                          </p>
                          <p className="text-lg font-semibold">
                            {annualSavings.implementationCost ? (
                              `$${annualSavings.implementationCost.toLocaleString()}`
                            ) : (
                              <MissingData />
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Simple Payback
                          </p>
                          <p className="text-lg font-semibold">
                            {measure.estimatedSavings?.paybackPeriod ? (
                              `${measure.estimatedSavings.paybackPeriod.toLocaleString()} years`
                            ) : (
                              <MissingData />
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            ROI
                          </p>
                          <p className="text-lg font-semibold">
                            {annualSavings.roi ? (
                              `${annualSavings.roi.toLocaleString()}%`
                            ) : (
                              <MissingData />
                            )}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {measure.implementationNotes && (
                  <div className="mb-4">
                    <h4 className="text-emerald-600 font-medium">
                      Implementation Notes:
                    </h4>
                    <p className="dark:text-gray-300">
                      {measure.implementationNotes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <section className="mb-10 text-sm leading-relaxed text-muted-foreground">
      {/* Recommended Measures */}
      {renderMeasureSection(
        recommendedMeasures,
        "Energy Efficiency Measures (EEMs)",
        undefined,
        false // Don't show if empty since it's the default section
      )}

      {/* Already Implemented Measures */}
      {renderMeasureSection(
        implementedMeasures,
        "EEMs Already Implemented",
        "The management has taken proactive steps in increasing the energy efficiency of the property. The following upgraded equipment was observed to be installed during the site visit.",
        true // Always show section even if empty
      )}

      {/* Measures to Consider */}
      {renderMeasureSection(
        consideredMeasures,
        "EEMs to Consider",
        "The following measures have been identified to increase the energy efficiency of the property; however, these measures were priced using standard cost estimates, which were unable to justify the Return on Investment (ROI). Nonetheless, the viability of these measures should be investigated further by the client.",
        true // Always show section even if empty
      )}
    </section>
  );
}
