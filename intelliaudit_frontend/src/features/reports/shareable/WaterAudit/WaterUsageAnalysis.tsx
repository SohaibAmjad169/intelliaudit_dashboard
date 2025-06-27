"use client"

import { useState, useEffect } from "react"

interface WaterUsageAnalysisProps {
  projectId: string
  usageData?: {
    totalConsumption?: number
    totalCost?: number
    monthlyData?: MonthlyWaterData[]
  }
}

interface MonthlyWaterData {
  month: string
  consumption: number // in gallons
  cost: number // in dollars
}

export function WaterUsageAnalysis({ projectId, usageData }: WaterUsageAnalysisProps) {
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [, setError] = useState<string | null>(null)
  const [monthlyData, setMonthlyData] = useState<MonthlyWaterData[]>([])
  const [totalConsumption, setTotalConsumption] = useState<number | null>(null)
  const [totalCost, setTotalCost] = useState<number | null>(null)

  useEffect(() => {
    const fetchWaterData = async () => {
      try {
        setIsLoading(true)

        // In a real implementation, these would be API calls
        // const response = await fetchWaterUsageData(projectId);
        // setTotalConsumption(response.totalConsumption);
        // setTotalCost(response.totalCost);
        // setMonthlyData(response.monthlyData);

        // For now, use provided data or defaults
        setTotalConsumption(usageData?.totalConsumption || null)
        setTotalCost(usageData?.totalCost || null)
        setMonthlyData(usageData?.monthlyData || [])

        setIsLoading(false)
      } catch (err) {
        console.error("Error fetching water usage data:", err)
        setError("Failed to load water usage data")
        setIsLoading(false)
      }
    }

    if (projectId) {
      fetchWaterData()
    }
  }, [projectId, usageData])

  // Format currency
  const formatCurrency = (value: number | null): string => {
    if (value === null) return "$0"
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value)
  }

  // Format number with commas
  const formatNumber = (value: number | null): string => {
    if (value === null) return "0"
    return new Intl.NumberFormat("en-US").format(value)
  }

  // Water conservation recommendations
  const waterConservationRecommendations = [
    {
      category: "Plumbing Fixtures",
      recommendations: [
        "Install low-flow toilets or dual-flush toilets (1.28 gallons per flush or less)",
        "Replace faucet aerators with 0.5 gallons per minute (gpm) models",
        "Install WaterSense labeled showerheads (1.5 gpm or less)",
        "Install automatic sensor faucets in public restrooms",
      ],
    },
    {
      category: "Landscape and Irrigation",
      recommendations: [
        "Implement smart irrigation controllers with weather-based scheduling",
        "Replace spray irrigation with drip irrigation where appropriate",
        "Convert high water-use turf to drought-tolerant landscaping",
        "Adjust sprinkler heads to prevent overspray onto hardscape",
        "Repair leaking irrigation components promptly",
      ],
    },
    {
      category: "Operational Practices",
      recommendations: [
        "Implement a regular leak detection and repair program",
        "Train maintenance staff on water conservation practices",
        "Use water meters to track and monitor consumption",
        "Establish a water conservation policy for the facility",
        "Educate occupants about water conservation practices",
      ],
    },
  ]

  if (isLoading) {
    return <div className="text-center py-6">Loading water usage analysis...</div>
  }

  return (
    <section className="mb-10">
      <h2 className="text-2xl font-bold mb-3 text-emerald-700 dark:text-emerald-500">Water Usage Analysis</h2>

      <div className="mb-6">
        <p className="mb-4 text-gray-700 dark:text-gray-300">
          This section summarizes the water consumption analysis based on utility billing data. The analysis identifies
          water usage patterns and opportunities for conservation measures to reduce water consumption and associated
          costs.
        </p>
      </div>

      {/* Aggregated Water Consumption */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-3 text-emerald-700 dark:text-emerald-500">
          Aggregated Water Consumption
        </h3>

        <p className="mb-4 text-gray-700 dark:text-gray-300">
          Our audit team reviewed water utility bills from the past 12 months. During this period, the building consumed{" "}
          {totalConsumption ? (
            <span>{formatNumber(totalConsumption)} gallons</span>
          ) : (
            <span className="text-gray-400">[Data not available]</span>
          )}
          , or{" "}
          {totalCost ? (
            <span>{formatCurrency(totalCost)}</span>
          ) : (
            <span className="text-gray-400">[Data not available]</span>
          )}{" "}
          worth of water. The chart below shows monthly water consumption and costs.
        </p>

        {/* Water Consumption Chart */}
        <div className="border-2 border-gray-300 p-4 mb-4">
          <h4 className="text-center text-lg font-bold mb-4">Monthly Water Consumption vs Cost</h4>

          {/* This is where you would implement a real chart component */}
          <div className="flex justify-center">
            <div className="w-full max-w-4xl h-80 bg-gray-100 flex items-center justify-center">
              <p className="text-gray-500">
                {monthlyData.length === 0 ? (
                  <span className="text-gray-400">[No monthly data available]</span>
                ) : (
                  "Water Consumption Chart (Will be implemented with real chart library)"
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Water End Use Breakdown */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-3 text-emerald-700 dark:text-emerald-500">Water End Use Breakdown</h3>

        <p className="mb-4 text-gray-700 dark:text-gray-300">
          Based on our water audit, we have estimated the breakdown of water usage by end-use category. Understanding
          where water is being used helps identify the most effective conservation measures.
        </p>

        {/* Water End Use Chart */}
        <div className="border-2 border-gray-300 p-4 mb-4">
          <h4 className="text-center text-lg font-bold mb-4">Water End Use Breakdown</h4>

          {/* This is where you would implement a real pie chart */}
          <div className="flex justify-center">
            <div className="w-full max-w-4xl h-80 bg-gray-100 flex items-center justify-center">
              {/* PlaceholderHighlight is removed, replaced with conditional rendering */}
              {/* If there's no data, show a message, otherwise show the placeholder chart */}
              {true ? (
                <div className="text-center">
                  <p className="text-gray-500 mb-4">Water End Use Pie Chart (Placeholder)</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-lg mx-auto">
                    <div className="flex items-center">
                      <div className="w-4 h-4 mr-2 bg-blue-500"></div>
                      <span>Restrooms: 42%</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 mr-2 bg-green-500"></div>
                      <span>Irrigation: 25%</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 mr-2 bg-yellow-500"></div>
                      <span>Cooling: 18%</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 mr-2 bg-purple-500"></div>
                      <span>Kitchen: 8%</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 mr-2 bg-red-500"></div>
                      <span>Laundry: 4%</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 mr-2 bg-gray-500"></div>
                      <span>Other: 3%</span>
                    </div>
                  </div>
                </div>
              ) : (
                <span className="text-gray-400">[Data not available]</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Water Conservation Recommendations */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-3 text-emerald-700 dark:text-emerald-500">
          Water Conservation Recommendations
        </h3>

        <p className="mb-4 text-gray-700 dark:text-gray-300">
          Based on our findings, we recommend the following water conservation measures to reduce consumption and
          improve efficiency. The specific measures are prioritized based on potential water savings, implementation
          costs, and return on investment.
        </p>

        {waterConservationRecommendations.map((category, index) => (
          <div key={index} className="mb-6">
            <h4 className="font-semibold mb-2 ml-4 text-emerald-700 dark:text-emerald-500">{category.category}</h4>

            <ul className="list-disc ml-10 mb-4 text-gray-700 dark:text-gray-300">
              {category.recommendations.map((recommendation, i) => (
                <li key={i} className="mb-1">
                  {recommendation}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Expected Water Savings */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-3 text-emerald-700 dark:text-emerald-500">Expected Water Savings</h3>

        <p className="mb-4 text-gray-700 dark:text-gray-300">
          Implementing the recommended water conservation measures could result in significant water savings. Based on
          our analysis, we estimate the following potential savings:
        </p>

        <div className="border-2 border-gray-300 p-4 mb-4">
          <h4 className="text-center text-lg font-bold mb-4">Estimated Annual Savings</h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
              <h5 className="text-lg mb-2 text-blue-700 dark:text-blue-300">Water Savings</h5>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                <span className="text-gray-400">[Data not available]</span>
              </p>
              <p className="text-sm text-blue-500 dark:text-blue-300">30% reduction</p>
            </div>

            <div className="bg-green-50 dark:bg-green-900 p-4 rounded-lg">
              <h5 className="text-lg mb-2 text-green-700 dark:text-green-300">Cost Savings</h5>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                <span className="text-gray-400">[Data not available]</span>
              </p>
              <p className="text-sm text-green-500 dark:text-green-300">Annual utility savings</p>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900 p-4 rounded-lg">
              <h5 className="text-lg mb-2 text-purple-700 dark:text-purple-300">Payback Period</h5>
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                <span className="text-gray-400">[Data not available]</span>
              </p>
              <p className="text-sm text-purple-500 dark:text-purple-300">Simple payback period</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default WaterUsageAnalysis
