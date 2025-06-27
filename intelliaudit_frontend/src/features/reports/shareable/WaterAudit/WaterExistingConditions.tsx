"use client"

import { useState, useEffect } from "react"
import { waterAuditService, type WaterConditionsData } from "@/services/water-audit/water-efficiency-service"

interface WaterExistingConditionsProps {
  projectId: string
}

export function WaterExistingConditions({ projectId }: WaterExistingConditionsProps) {
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [conditionsData, setConditionsData] = useState<WaterConditionsData | null>(null)

  // Fetch water conditions data
  useEffect(() => {
    const fetchConditions = async () => {
      try {
        setIsLoading(true)
        const data = await waterAuditService.fetchWaterConditionsData(projectId)
        setConditionsData(data)
        setIsLoading(false)
      } catch (err) {
        console.error("Error fetching water conditions data:", err)
        setError("Failed to load water conditions data")
        setIsLoading(false)
      }
    }

    if (projectId) {
      fetchConditions()
    }
  }, [projectId])

  // Only use actual data from the API
  const fixtures = conditionsData?.fixtures || []
  const outdoor = conditionsData?.outdoor || null

  const leaksObserved = conditionsData ? conditionsData.leaksObserved : false

  // Loading state
  if (isLoading) {
    return <div className="text-center py-6">Loading water conditions data...</div>
  }

  // Error state
  if (error) {
    return <div className="text-center py-6 text-red-500">Error: {error}</div>
  }

  // No data available
  if (!fixtures.length && !outdoor) {
    return (
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-4 text-emerald-700 dark:text-emerald-500">
          C. Existing Conditions and Observations
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
            No existing conditions data has been recorded for this project.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="mb-10">
      <h2 className="text-2xl font-bold mb-4 text-emerald-700 dark:text-emerald-500">
        C. Existing Conditions and Observations
      </h2>

      {/* Domestic Indoor Water Use Section */}
      {fixtures.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4 text-emerald-700 dark:text-emerald-500">
            Domestic Indoor Water Use
          </h3>
          <p className="mb-4 dark:text-gray-300">
            The following table summarizes the existing water fixtures in the building:
          </p>

          <div className="overflow-x-auto mb-6">
            <table className="min-w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700 text-left">
                  <th className="py-2 px-4 font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600">
                    Fixture Type
                  </th>
                  <th className="py-2 px-4 font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600 text-right">
                    Flow Rate
                  </th>
                  <th className="py-2 px-4 font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600 text-right">
                    Unit
                  </th>
                  <th className="py-2 px-4 font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600 text-right">
                    Quantity
                  </th>
                </tr>
              </thead>
              <tbody>
                {fixtures.map((fixture, index) => (
                  <tr
                    key={index}
                    className={index % 2 === 0 ? "bg-white dark:bg-gray-800" : "bg-gray-50 dark:bg-gray-700/50"}
                  >
                    <td className="py-2 px-4 border-b border-gray-200 dark:border-gray-700">{fixture.type}</td>
                    <td className="py-2 px-4 border-b border-gray-200 dark:border-gray-700 text-right">
                      {fixture.flowRate}
                    </td>
                    <td className="py-2 px-4 border-b border-gray-200 dark:border-gray-700 text-right">
                      {fixture.unit}
                    </td>
                    <td className="py-2 px-4 border-b border-gray-200 dark:border-gray-700 text-right">
                      {fixture.quantity}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Outdoor Water Use Section */}
      {outdoor && (
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4 text-emerald-700 dark:text-emerald-500">Outdoor Water Use</h3>

          <p className="mb-4 dark:text-gray-300">The property has the following outdoor water use areas:</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Landscape Areas</h4>
              <ul className="space-y-2">
                <li className="flex justify-between">
                  <span className="text-gray-700 dark:text-gray-300">Turf area:</span>
                  <span className="font-medium">{outdoor.turfArea.toLocaleString()} sq ft</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-700 dark:text-gray-300">Trees and shrubs area:</span>
                  <span className="font-medium">{outdoor.treesAndShrubsArea.toLocaleString()} sq ft</span>
                </li>
              </ul>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Irrigation Methods</h4>
              <ul className="space-y-2">
                <li className="flex justify-between">
                  <span className="text-gray-700 dark:text-gray-300">Sprinklers:</span>
                  <span className="font-medium">{outdoor.hasSprinklers ? "Yes" : "No"}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-700 dark:text-gray-300">Drip irrigation:</span>
                  <span className="font-medium">{outdoor.hasDripIrrigation ? "Yes" : "No"}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Leaks Section */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-4 text-emerald-700 dark:text-emerald-500">Leaks</h3>

        <div
          className={`p-4 rounded-lg ${leaksObserved ? "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800" : "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"}`}
        >
          <p
            className={`flex items-center ${leaksObserved ? "text-red-700 dark:text-red-400" : "text-green-700 dark:text-green-400"}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              {leaksObserved ? (
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              ) : (
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              )}
            </svg>
            {leaksObserved
              ? "During the site inspection, leaks were observed in the building water system. These should be addressed immediately to prevent water waste and potential structural damage."
              : "No leaks were observed during the site inspection."}
          </p>
        </div>
      </div>
    </section>
  )
}

export default WaterExistingConditions
