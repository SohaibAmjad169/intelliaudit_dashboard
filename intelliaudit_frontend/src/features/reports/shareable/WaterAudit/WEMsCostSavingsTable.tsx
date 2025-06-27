"use client"

import { useState, useEffect } from "react"
import { waterAuditService, type WaterEfficiencyMeasure as WEM } from "@/services/water-audit/water-efficiency-service"

interface WEMsCostSavingsTableProps {
  projectId: string
}

export function WEMsCostSavingsTable({ projectId }: WEMsCostSavingsTableProps) {
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [measures, setMeasures] = useState<WEM[]>([])

  // Fetch water efficiency measures data
  useEffect(() => {
    const fetchWEMData = async () => {
      try {
        setIsLoading(true)
        const data = await waterAuditService.fetchWaterEfficiencyData(projectId)

        // Combine all measures for the table
        const allMeasures = [...data.recommendations, ...data.implemented, ...data.planned]

        setMeasures(allMeasures)
        setIsLoading(false)
      } catch (err) {
        console.error("Error fetching water efficiency measures:", err)
        setError("Failed to load water efficiency measures data")
        setIsLoading(false)
      }
    }

    if (projectId) {
      fetchWEMData()
    }
  }, [projectId])

  // Calculate totals for all measures
  const totals = measures.reduce(
    (acc, measure) => {
      if (measure.estimatedSavings) {
        acc.costSavings += measure.estimatedSavings.cost || 0
        acc.waterSavings += measure.estimatedSavings.water || 0
        acc.therms += measure.estimatedSavings.therms || 0
        acc.implementationCost += measure.implementationCost || 0
        acc.incentives += measure.incentives || 0
      }
      return acc
    },
    {
      costSavings: 0,
      waterSavings: 0,
      therms: 0,
      implementationCost: 0,
      incentives: 0,
    },
  )

  // Calculate net implementation cost and simple payback
  const netImplementationCost = totals.implementationCost - totals.incentives
  const simplePayback = totals.costSavings ? netImplementationCost / totals.costSavings : 0

  // Loading state
  if (isLoading) {
    return <div className="text-center py-6">Loading water efficiency measures summary...</div>
  }

  // Error state
  if (error) {
    return <div className="text-center py-6 text-red-500">Error: {error}</div>
  }

  // No data available
  if (measures.length === 0) {
    return (
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-4 text-emerald-700 dark:text-emerald-500">
          D. Water Efficiency Measures Summary
        </h2>
        <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-md p-4 mb-6">
          <p className="text-yellow-700 dark:text-yellow-500 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            No water efficiency measures have been identified for this project.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="mb-10">
      <h2 className="text-2xl font-bold mb-4 text-emerald-700 dark:text-emerald-500">
        D. Water Efficiency Measures Summary
      </h2>

      <div className="mb-6">
        <p className="mb-4 dark:text-gray-300">
          The following table summarizes the recommended water efficiency measures (WEMs) and their estimated savings.
          All of these measures are detailed in the next section of this report.
        </p>
      </div>

      <div className="overflow-x-auto mb-8">
        <table className="min-w-full bg-white dark:bg-gray-800 border border-emerald-200 dark:border-emerald-900">
          <thead>
            <tr className="bg-emerald-100 dark:bg-emerald-900/50">
              <th
                colSpan={7}
                className="py-3 px-4 text-left font-bold text-emerald-800 dark:text-emerald-200 border-b border-emerald-200 dark:border-emerald-800"
              >
                Water Efficiency Measures Summary
              </th>
            </tr>
            <tr className="bg-emerald-50 dark:bg-emerald-900/30">
              <th className="py-2 px-4 text-left font-semibold text-emerald-700 dark:text-emerald-300 border-b border-emerald-200 dark:border-emerald-800">
                ID & Description
              </th>
              <th className="py-2 px-4 text-right font-semibold text-emerald-700 dark:text-emerald-300 border-b border-emerald-200 dark:border-emerald-800">
                Annual Cost Savings
              </th>
              <th className="py-2 px-4 text-right font-semibold text-emerald-700 dark:text-emerald-300 border-b border-emerald-200 dark:border-emerald-800">
                Annual Water Savings (gal)
              </th>
              <th className="py-2 px-4 text-right font-semibold text-emerald-700 dark:text-emerald-300 border-b border-emerald-200 dark:border-emerald-800">
                Annual Therm Savings
              </th>
              <th className="py-2 px-4 text-right font-semibold text-emerald-700 dark:text-emerald-300 border-b border-emerald-200 dark:border-emerald-800">
                Implementation Cost
              </th>
              <th className="py-2 px-4 text-right font-semibold text-emerald-700 dark:text-emerald-300 border-b border-emerald-200 dark:border-emerald-800">
                Incentives
              </th>
              <th className="py-2 px-4 text-right font-semibold text-emerald-700 dark:text-emerald-300 border-b border-emerald-200 dark:border-emerald-800">
                Simple Payback (years)
              </th>
            </tr>
          </thead>
          <tbody>
            {measures.map((measure, index) => (
              <tr
                key={index}
                className={index % 2 === 0 ? "bg-white dark:bg-gray-800" : "bg-emerald-50/50 dark:bg-emerald-900/10"}
              >
                <td className="py-2 px-4 border-b border-emerald-100 dark:border-emerald-900/30">
                  <span className="font-medium">{measure.id}:</span> {measure.title}
                </td>
                <td className="py-2 px-4 border-b border-emerald-100 dark:border-emerald-900/30 text-right">
                  ${measure.estimatedSavings?.cost?.toLocaleString() || "0"}
                </td>
                <td className="py-2 px-4 border-b border-emerald-100 dark:border-emerald-900/30 text-right">
                  {measure.estimatedSavings?.water?.toLocaleString() || "0"}
                </td>
                <td className="py-2 px-4 border-b border-emerald-100 dark:border-emerald-900/30 text-right">
                  {measure.estimatedSavings?.therms?.toLocaleString() || "0"}
                </td>
                <td className="py-2 px-4 border-b border-emerald-100 dark:border-emerald-900/30 text-right">
                  ${measure.implementationCost?.toLocaleString() || "0"}
                </td>
                <td className="py-2 px-4 border-b border-emerald-100 dark:border-emerald-900/30 text-right">
                  ${measure.incentives?.toLocaleString() || "0"}
                </td>
                <td className="py-2 px-4 border-b border-emerald-100 dark:border-emerald-900/30 text-right">
                  {measure.paybackPeriod?.toFixed(1) || "0.0"}
                </td>
              </tr>
            ))}

            {/* Totals row */}
            <tr className="bg-emerald-100 dark:bg-emerald-900/40 font-bold">
              <td className="py-2 px-4 border-t border-emerald-200 dark:border-emerald-800">TOTAL</td>
              <td className="py-2 px-4 border-t border-emerald-200 dark:border-emerald-800 text-right">
                ${totals.costSavings.toLocaleString()}
              </td>
              <td className="py-2 px-4 border-t border-emerald-200 dark:border-emerald-800 text-right">
                {totals.waterSavings.toLocaleString()}
              </td>
              <td className="py-2 px-4 border-t border-emerald-200 dark:border-emerald-800 text-right">
                {totals.therms.toLocaleString()}
              </td>
              <td className="py-2 px-4 border-t border-emerald-200 dark:border-emerald-800 text-right">
                ${totals.implementationCost.toLocaleString()}
              </td>
              <td className="py-2 px-4 border-t border-emerald-200 dark:border-emerald-800 text-right">
                ${totals.incentives.toLocaleString()}
              </td>
              <td className="py-2 px-4 border-t border-emerald-200 dark:border-emerald-800 text-right">
                {simplePayback ? simplePayback.toFixed(1) : "0.0"}
              </td>
            </tr>

            {/* Net Implementation Cost row */}
            <tr className="bg-emerald-50 dark:bg-emerald-900/20">
              <td colSpan={4} className="py-2 px-4 text-right font-semibold">
                Net Implementation Cost:
              </td>
              <td colSpan={3} className="py-2 px-4 text-left font-semibold">
                ${netImplementationCost.toLocaleString()}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default WEMsCostSavingsTable
