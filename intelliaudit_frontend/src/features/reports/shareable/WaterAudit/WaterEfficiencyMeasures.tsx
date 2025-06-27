"use client";
import { useState, useEffect } from "react";
import { waterAuditService } from "@/services/water-audit/water-efficiency-service";

interface WEMType {
  id: string;
  title: string;
  existingCondition: string;
  recommendation: string;
  benefits: string[]; // <-- Array of strings (matches your API!)
  pricingNote?: string;
  images?: {
    existingImage?: string;
    replacementImage?: string;
    existingCaption?: string;
    replacementCaption?: string;
  };
  estimatedSavings?: {
    cost: number;
    water: number;
    energy: number;
    therms: number;
    paybackPeriod?: number; // moved inside estimatedSavings as in your data
  };
  implementationCost?: number | string; // string in your API, number is preferred
  incentives?: number | string; // string in your API, number is preferred
  calculationNotes?: string;
  photoReferences?: string[];
  implementationNotes?: string | null;
  usefulLife?: number;
}

export function WaterEfficiencyMeasures({ projectId }) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [measures, setMeasures] = useState<WEMType[]>([]);

  useEffect(() => {
    const fetchWEMData = async () => {
      try {
        setIsLoading(true);
        const data = await waterAuditService.fetchMeasures(
          projectId
        );
        setMeasures(data?.wems || []);
        setIsLoading(false);
      } catch (err) {
        setError("Failed to load water efficiency measures data");
        setIsLoading(false);
      }
    };
    if (projectId) fetchWEMData();
  }, [projectId]);

  if (isLoading) return <div className="text-center py-6">Loading...</div>;
  if (error)
    return <div className="text-center py-6 text-red-500">{error}</div>;
  if (measures.length === 0)
    return (
      <div className="text-center py-6">
        No water efficiency measures identified.
      </div>
    );

  return (
    <section className="mb-10">
      <div className="space-y-8">
        {measures.map((measure, idx) => (
          <div key={measure.id || idx} className="relative">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 dark:from-emerald-900/10 dark:via-blue-900/10 dark:to-purple-900/10 rounded-2xl pointer-events-none"></div>

            <div className="relative p-6 rounded-2xl border border-emerald-200 dark:border-emerald-800 shadow-sm">
              <h3 className="text-lg font-semibold text-emerald-700 dark:text-emerald-400 mb-2">
                {idx + 1}. {measure.title}
              </h3>

              <div className="mb-2">
                <span className="font-bold text-emerald-600">
                  Existing Condition:{" "}
                </span>
                <span className="dark:text-gray-300">
                  {measure.existingCondition}
                </span>
              </div>

              <div className="mb-4">
                <span className="font-bold text-emerald-600">
                  Recommendation:{" "}
                </span>
                <span className="dark:text-gray-300">
                  {measure.recommendation}
                </span>
              </div>

              {measure.benefits?.length > 0 && (
                <div className="mb-4">
                  <span className="font-bold text-emerald-600">Benefits:</span>
                  <ul className="list-disc ml-6 mt-1 space-y-1 text-gray-700 dark:text-gray-300">
                    {measure.benefits.map((benefit, i) => (
                      <li key={i}>{benefit}</li>
                    ))}
                  </ul>
                </div>
              )}

              {measure.photoReferences &&
                measure.photoReferences.length > 0 && (
                  <div className="mb-4">
                    <span className="font-bold text-emerald-600">
                      Photo Reference:
                    </span>
                    <ul className="list-disc ml-6 mt-1">
                      {measure.photoReferences.map((url, i) => (
                        <li key={i}>
                          <a
                            href={url.replace(/^Photo URL /, "")}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 underline"
                          >
                            View Photo {i + 1}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

              {measure.calculationNotes && (
                <div className="mb-4 text-xs text-gray-500 dark:text-gray-400">
                  <span className="font-bold">Calculation Notes: </span>
                  {measure.calculationNotes}
                </div>
              )}

              {/* --- SUMMARY BOX --- */}
              <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4 mt-4 mb-2">
                <h4 className="text-emerald-600 font-semibold mb-3">
                  Measure Summary
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Annual Cost Savings
                    </div>
                    <div className="text-lg font-semibold">
                      ${measure.estimatedSavings?.cost?.toLocaleString() || "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Water Savings
                    </div>
                    <div className="text-lg font-semibold">
                      {measure.estimatedSavings?.water?.toLocaleString() || "—"}{" "}
                      gal/year
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Payback Period
                    </div>
                    <div className="text-lg font-semibold">
                      {measure.estimatedSavings?.paybackPeriod
                        ? measure.estimatedSavings.paybackPeriod.toFixed(2)
                        : "—"}{" "}
                      years
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-emerald-200 dark:border-emerald-800">
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Implementation Cost
                    </div>
                    <div className="text-lg font-semibold">
                      ${measure.implementationCost || "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Incentives/Rebates
                    </div>
                    <div className="text-lg font-semibold">
                      ${measure.incentives || "—"}
                    </div>
                  </div>
                  {/* If you have ROI, add here */}
                </div>
              </div>
              {/* --- END SUMMARY BOX --- */}

              {measure.implementationNotes && (
                <div className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                  <span className="font-bold">Implementation Notes: </span>
                  {measure.implementationNotes}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default WaterEfficiencyMeasures;
