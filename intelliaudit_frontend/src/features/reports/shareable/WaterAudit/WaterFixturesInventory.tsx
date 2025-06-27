import { PlaceholderHighlight } from "@/components/ui/PlaceholderHighlight"

interface WaterFixturesInventoryProps {
  fixturesData?: {
    toilets?: FixtureData[]
    urinals?: FixtureData[]
    faucets?: FixtureData[]
    showerheads?: FixtureData[]
    waterPressure?: number
  }
}

interface FixtureData {
  id: string
  location: string
  type: string
  flowRate: number
  efficiency: string
  condition: string
  leakStatus: string
  replacementRecommended: boolean
}

export function WaterFixturesInventory({ fixturesData }: WaterFixturesInventoryProps) {
  // Only use actual data from the API
  const toilets = fixturesData?.toilets || []
  const faucets = fixturesData?.faucets || []
  const showerheads = fixturesData?.showerheads || []
  const urinals = fixturesData?.urinals || []
  const waterPressure = fixturesData?.waterPressure

  // Format flow rate with units
  const formatFlowRate = (rate: number, fixtureType: string): string => {
    if (fixtureType === "Toilet" || fixtureType === "Tank Toilet" || fixtureType === "Flush Valve Toilet") {
      return `${rate.toFixed(1)} gpf`
    } else if (fixtureType === "Urinal" || fixtureType === "Wall-mounted") {
      return `${rate.toFixed(1)} gpf`
    } else {
      return `${rate.toFixed(1)} gpm`
    }
  }

  // Helper function to determine text color based on replacement recommendation
  const getReplacementTextColor = (recommended: boolean): string => {
    return recommended ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"
  }

  // Helper function to determine text color based on leak status
  const getLeakStatusTextColor = (status: string): string => {
    if (status === "None") return "text-green-600 dark:text-green-400"
    if (status === "Minor") return "text-yellow-600 dark:text-yellow-400"
    return "text-red-600 dark:text-red-400"
  }

  // Render a table for fixture data
  const renderFixtureTable = (fixtures: FixtureData[], title: string, isPlaceholder: boolean) => {
    if (fixtures.length === 0) {
      return (
        <div className="mb-8">
          <h4 className="text-lg font-semibold mb-3 ml-4 text-emerald-700 dark:text-emerald-500">{title}</h4>
          <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-md text-gray-500 dark:text-gray-400">
            No {title.toLowerCase()} data available.
          </div>
        </div>
      )
    }

    return (
      <div className="mb-8">
        <h4 className="text-lg font-semibold mb-3 ml-4 text-emerald-700 dark:text-emerald-500">{title}</h4>

        <div className="overflow-x-auto">
          <table className="min-w-full bg-white dark:bg-gray-800 border-collapse">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700">
                <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">ID</th>
                <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">Location</th>
                <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">Type</th>
                <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">Flow Rate</th>
                <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">Efficiency</th>
                <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">Condition</th>
                <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">Leak Status</th>
                <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">Replacement</th>
              </tr>
            </thead>
            <tbody>
              {fixtures.map((fixture, index) => (
                <tr
                  key={index}
                  className={index % 2 === 0 ? "bg-white dark:bg-gray-800" : "bg-gray-50 dark:bg-gray-700"}
                >
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">{fixture.id}</td>
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">{fixture.location}</td>
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">{fixture.type}</td>
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">
                    {formatFlowRate(fixture.flowRate, fixture.type)}
                  </td>
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">{fixture.efficiency}</td>
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">{fixture.condition}</td>
                  <td
                    className={`border border-gray-300 dark:border-gray-600 px-4 py-2 ${getLeakStatusTextColor(fixture.leakStatus)}`}
                  >
                    {fixture.leakStatus}
                  </td>
                  <td
                    className={`border border-gray-300 dark:border-gray-600 px-4 py-2 ${getReplacementTextColor(fixture.replacementRecommended)}`}
                  >
                    {fixture.replacementRecommended ? "Recommended" : "Not needed"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  return (
    <section className="mb-10">
      <h2 className="text-2xl font-bold mb-3 text-emerald-700 dark:text-emerald-500">
        Plumbing Fixtures Inventory & Assessment
      </h2>

      <div className="mb-6">
        <p className="mb-4 text-gray-700 dark:text-gray-300">
          This section details the inventory and assessment of all plumbing fixtures throughout the facility. Each
          fixture was inspected for condition, efficiency, and potential maintenance issues. Flow rates were measured
          using a water flow rate bag, and leaks were quantified using a drip gauge.
        </p>

        <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg mb-6">
          <h3 className="text-lg font-semibold mb-2 text-blue-700 dark:text-blue-300">Water Pressure</h3>

          <p className="mb-2 text-blue-600 dark:text-blue-400">
            The building water pressure was measured at {waterPressure !== undefined ? `${waterPressure} PSI` : "N/A"}.
          </p>

          <p className="text-sm text-blue-700 dark:text-blue-300">
            <strong>Note:</strong> Optimal water pressure for commercial buildings is typically between 40-80 PSI.
            Pressure above 80 PSI can lead to excessive water use and strain on plumbing systems, while pressure below
            40 PSI may result in poor fixture performance.
          </p>
        </div>
      </div>

      {/* Fixtures Tables */}
      {renderFixtureTable(toilets, "Toilets", false)}
      {renderFixtureTable(urinals, "Urinals", false)}
      {renderFixtureTable(faucets, "Faucets", false)}
      {renderFixtureTable(showerheads, "Showerheads", false)}

      {/* Summary */}
      <div className="mt-8 mb-6">
        <h3 className="text-xl font-semibold mb-3 text-emerald-700 dark:text-emerald-500">Summary of Findings</h3>

        <p className="mb-4 text-gray-700 dark:text-gray-300">
          Based on our assessment, we found that <PlaceholderHighlight isPlaceholder={true}>30%</PlaceholderHighlight>{" "}
          of the fixtures are outdated and operating at low efficiency levels.{" "}
          <PlaceholderHighlight isPlaceholder={true}>15%</PlaceholderHighlight> of fixtures have minor leaks that should
          be addressed. Replacing outdated fixtures with WaterSense labeled models could reduce water consumption by an
          estimated <PlaceholderHighlight isPlaceholder={true}>25-30%</PlaceholderHighlight>.
        </p>

        <div className="bg-yellow-50 dark:bg-yellow-900 p-4 rounded-lg">
          <h4 className="font-semibold mb-2 text-yellow-700 dark:text-yellow-300">Priority Recommendations</h4>

          <ul className="list-disc ml-6 text-yellow-700 dark:text-yellow-300">
            <li className="mb-1">
              Replace all toilets with flow rates above 1.6 gpf with high-efficiency models (1.28 gpf or less)
            </li>
            <li className="mb-1">Replace faucet aerators with 0.5 gpm models in all restrooms</li>
            <li className="mb-1">Repair all fixtures with identified leaks</li>
            <li className="mb-1">Replace showerheads with WaterSense labeled models (1.5 gpm or less)</li>
            <li className="mb-1">Replace urinals with 0.5 gpf or waterless models</li>
          </ul>
        </div>
      </div>
    </section>
  )
}

export default WaterFixturesInventory
