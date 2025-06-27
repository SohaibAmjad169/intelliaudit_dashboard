interface WaterAuditReportProps {
  projectData?: {
    address?: string
    city?: string
    state?: string
    zip?: string
    auditDate?: string
  }
}

export function WaterAuditReport({ projectData }: WaterAuditReportProps) {
  // Format address
  const formatFullAddress = () => {
    const address = projectData?.address
    const city = projectData?.city
    const state = projectData?.state
    const zip = projectData?.zip

    return `${address}, ${city}, ${state} ${zip}`
  }

  // Format audit date
  const formatAuditDate = () => {
    return projectData?.auditDate
  }

  return (
    <section className="mb-10">
      <h2 className="text-2xl font-bold mb-3 text-emerald-700 dark:text-emerald-500">Water Audit Report</h2>

      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-3 text-emerald-700 dark:text-emerald-500">Introduction</h3>

        <p className="mb-4 text-gray-700 dark:text-gray-300">
          This report presents the results of the water audit conducted at{" "}
          {projectData?.address ? (
            <span>{formatFullAddress()}</span>
          ) : (
            <span className="text-gray-400">[Address not available]</span>
          )}
          .
        </p>

        <p className="mb-4 text-gray-700 dark:text-gray-300">
          A water audit (also known as an assessment) is a systematic survey of all water-using fixtures, appliances,
          equipment, and practices at a facility.
        </p>

        <p className="mb-4 text-gray-700 dark:text-gray-300">A water audit can:</p>

        <ul className="list-disc ml-8 mb-4 text-gray-700 dark:text-gray-300">
          <li className="mb-2">
            Identify leaks, areas of excessive consumption, and other opportunities for efficiency improvements.
          </li>
          <li className="mb-2">Identify the degradation of previously efficient devices.</li>
          <li className="mb-2">
            From the basis of efficiency improvement and investment planning (identifies best returns on investment)
          </li>
          <li className="mb-2">Provide a benchmark for measuring water efficiency program successes.</li>
        </ul>

        <p className="mb-6 text-gray-700 dark:text-gray-300">
          The multi-step water audit process was performed at{" "}
          {projectData?.address ? (
            <span>{formatFullAddress()}</span>
          ) : (
            <span className="text-gray-400">[Address not available]</span>
          )}{" "}
          on{" "}
          {projectData?.auditDate ? (
            <span>{formatAuditDate()}</span>
          ) : (
            <span className="text-gray-400">[Date not available]</span>
          )}
          . The water audit process includes collecting the data necessary to estimate water use at the equipment level,
          surveying the equipment to understand water consumption, investigating water-conservation opportunities, and
          conducting an economic analysis to determine the project's effectiveness.
        </p>
      </div>

      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-3 text-emerald-700 dark:text-emerald-500">Water Audit Procedures</h3>

        <p className="mb-4 text-gray-700 dark:text-gray-300">
          The water audit procedure consists of the following tasks:
        </p>

        <p className="mb-2 text-gray-700 dark:text-gray-300 italic">
          Note: Each task is an independent procedure and those that do not apply to the building are omitted.
        </p>

        <div className="ml-4 mb-6">
          <h4 className="font-semibold mb-2 text-emerald-700 dark:text-emerald-500">
            Documents Review (when available)
          </h4>
          <ul className="list-disc ml-6 mb-4 text-gray-700 dark:text-gray-300">
            <li>Metering/utility bills analysis</li>
            <li>Review Plumbing plans</li>
            <li>Review Irrigation site map</li>
            <li>
              Review a comprehensive maintenance report of fixtures kept by on-site staff to determine any potential
              maintenance needs
            </li>
          </ul>

          <h4 className="font-semibold mb-2 text-emerald-700 dark:text-emerald-500">
            Plumbing Fixtures Inventory & Assessment
          </h4>
          <ul className="list-disc ml-6 mb-4 text-gray-700 dark:text-gray-300">
            <li>Visually Inspect plumbing fixtures for leaks or other maintenance needs.</li>
            <li>Measure plumbing fixtures using water flow rate bag</li>
            <li>Measure plumbing fixtures water waste from leaks using drip gauge</li>
            <li>Measure water pressure using water pressure gauge</li>
          </ul>

          <h4 className="font-semibold mb-2 text-emerald-700 dark:text-emerald-500">Appliances Inventory</h4>
          <ul className="list-disc ml-6 mb-4 text-gray-700 dark:text-gray-300">
            <li>Collect name plate for water using appliances such as dishwashers and clothes washers</li>
            <li>Identify the water factors for the above</li>
          </ul>

          <h4 className="font-semibold mb-2 text-emerald-700 dark:text-emerald-500">Irrigation System Assessment</h4>
          <ul className="list-disc ml-6 mb-4 text-gray-700 dark:text-gray-300">
            <li>Measure irrigated area via google satellite imagery or by using surveyors' wheel</li>
            <li>
              Identify irrigation system controllers/ timers and determine the number of stations served by each
              controller
            </li>
            <li>Figure out how often each station is activated and for how long.</li>
            <li>Determine if there are rain or moisture sensors that determine system activation</li>
            <li>Turn on each watering station in the irrigation system and Inspect</li>
            <li>water delivery devices (sprinkler heads, bubblers, drip emitters, etc.),</li>
            <li>Check for water runoff/overspray and over watered areas</li>
            <li>Note paved areas wet but the irrigation devices,</li>
            <li>Identify the type of plants used</li>
          </ul>

          <h4 className="font-semibold mb-2 text-emerald-700 dark:text-emerald-500">Cooling Tower Assessment</h4>
          <ul className="list-disc ml-6 mb-4 text-gray-700 dark:text-gray-300">
            <li>Collect the Cooling tower name plate data (tonnage)</li>
            <li>Check float valves for proper operation.</li>
            <li>Check if water is overflowing into the sump</li>
            <li>Verify the CT Cycles of concentration</li>
            <li>Evaluate cooling towers for water leaks and excess water consumption.</li>
            <li>Verify that cooling tower is equipped with a conductivity meter</li>
            <li>Collect water supply & return setpoints</li>
          </ul>

          <h4 className="font-semibold mb-2 text-emerald-700 dark:text-emerald-500">Water Features</h4>
          <ul className="list-disc ml-6 mb-4 text-gray-700 dark:text-gray-300">
            <li>Check water feature (pools, fountains and ponds) for leaks</li>
            <li>Review water feature schedules</li>
            <li>Check if a recirculating water pump working properly</li>
          </ul>
        </div>
      </div>
    </section>
  )
}

export default WaterAuditReport
