"use client"
import { RetroCommissioningMeasures } from "./RetroCommissioningMeasures"
import { ProjectTeamTable } from "@/features/projects/ProjectTeamTable"
import { AppendicesReport } from "./AppendicesReport"
import { useQuery } from "@tanstack/react-query"
import { photosService } from "@/features/energy/site-photos/photosService"
import { useState, useEffect } from "react"

interface RetroCommissioningReportProps {
  projectId: string
  projectData: any
}

export function RetroCommissioningReport({ projectId, projectData }: RetroCommissioningReportProps) {
  const [rcxPhotos, setRcxPhotos] = useState<any[]>([])

  // Fetch all project photos
  const {
    data: allPhotos = [],
    isLoading: photosLoading,
    error: photosError,
  } = useQuery({
    queryKey: ["project-photos", projectId],
    queryFn: async () => {
      if (!projectId) return []
      return photosService.getProjectPhotos(projectId)
    },
    enabled: !!projectId,
  })

  // Filter photos related to RCx
  useEffect(() => {
    if (allPhotos.length > 0) {
      // Filter photos that are related to retro-commissioning
      const filteredPhotos = allPhotos.filter((photo) => {
        // Check photo metadata for RCx related keywords
        const category = (photo.category || "").toLowerCase()
        const equipmentType = (photo.equipment_type || "").toLowerCase()
        const notes = (photo.notes || "").toLowerCase()
        const location = typeof photo.location === "string" ? photo.location.toLowerCase() : ""

        return (
          category.includes("rcx") ||
          category.includes("commissioning") ||
          equipmentType.includes("commissioning") ||
          notes.includes("rcx") ||
          notes.includes("commissioning") ||
          notes.includes("retro-commissioning") ||
          location.includes("commissioning")
        )
      })

      setRcxPhotos(filteredPhotos)
    }
  }, [allPhotos])

  return (
    <div className="max-w-5xl mx-auto p-8">
      {/* Introduction */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-4 text-emerald-700 dark:text-emerald-500">A. Introduction</h2>
        <p className="mb-4 dark:text-gray-300">
          {projectData?.propertyAddress || "[Property Address]"} underwent a retro-commissioning assessment to identify
          opportunities for optimizing building systems and reducing energy consumption.
        </p>
      </section>

      {/* Objectives */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-4 text-emerald-700 dark:text-emerald-500">B. Objectives</h2>
        <p className="mb-4 dark:text-gray-300">The objectives of this retro-commissioning assessment were to:</p>
        <ul className="list-disc pl-6 mb-4 space-y-2 dark:text-gray-300">
          <li>Identify and implement low-cost operational improvements</li>
          <li>Optimize existing building systems</li>
          <li>Reduce energy consumption and costs</li>
          <li>Improve occupant comfort</li>
          <li>Document system operating parameters for ongoing performance</li>
        </ul>
      </section>

      {/* Overview of Results */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-4 text-emerald-700 dark:text-emerald-500">C. Overview of Results</h2>
        <p className="mb-4 dark:text-gray-300">
          The retro-commissioning assessment identified several opportunities for optimization through low-cost
          operational improvements and system adjustments. The recommended measures focus on optimizing HVAC system
          operation, improving controls, and implementing best practices for building operation and maintenance.
        </p>

        {/* RCMs Cost Savings Summary Table */}
        <div className="mt-8">
          <RetroCommissioningMeasures projectId={projectId} />
        </div>
      </section>

      {/* Overview of Project Steps */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-4 text-emerald-700 dark:text-emerald-500">D. Overview of Project Steps</h2>
        <p className="mb-4 dark:text-gray-300">The retro-commissioning process included the following steps:</p>
        <ul className="list-disc pl-6 mb-4 space-y-2 dark:text-gray-300">
          <li>Initial site assessment and data collection</li>
          <li>Review of building documentation and operational data</li>
          <li>Detailed system investigation and testing</li>
          <li>Development of findings and recommendations</li>
          <li>Implementation planning and support</li>
          <li>Verification of improvements</li>
          <li>Final documentation and training</li>
        </ul>
      </section>

      {/* Retro-commissioning Plan */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-4 text-emerald-700 dark:text-emerald-500">E. Retro-commissioning Plan</h2>
        <p className="mb-4 dark:text-gray-300">
          The retro-commissioning plan was developed based on initial findings and focused on the following systems:
        </p>
        <ul className="list-disc pl-6 mb-4 space-y-2 dark:text-gray-300">
          <li>HVAC systems and controls</li>
          <li>Building automation system</li>
          <li>Lighting controls</li>
          <li>Building envelope</li>
          <li>Domestic hot water systems</li>
        </ul>
      </section>

      {/* Functional Performance Test Methodology */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-4 text-emerald-700 dark:text-emerald-500">
          F. Functional Performance Test Methodology
        </h2>
        <p className="mb-4 dark:text-gray-300">
          Functional performance testing was conducted to verify proper system operation and identify improvement
          opportunities. Testing included:
        </p>
        <ul className="list-disc pl-6 mb-4 space-y-2 dark:text-gray-300">
          <li>Equipment operation verification</li>
          <li>Control sequence testing</li>
          <li>System performance measurement</li>
          <li>Energy efficiency analysis</li>
        </ul>
      </section>

      {/* Assessment Team */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-4 text-emerald-700 dark:text-emerald-500">G. Assessment Team</h2>
        <p className="mb-4 dark:text-gray-300">
          The assessment was conducted by a team of qualified professionals from Vert Energy Group, as well as Gabby
          Robles, Supervisor from {projectData?.propertyManagementCompany || "[Property Management Company]"}.
        </p>
      </section>

      {/* Project Team */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-4 text-emerald-700 dark:text-emerald-500">H. Project Team</h2>
        <ProjectTeamTable projectId={projectId} />
      </section>

      {/* Site Visit Date */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-4 text-emerald-700 dark:text-emerald-500">Date of site visit # 1</h2>
        <p className="dark:text-gray-300">{projectData?.siteVisitDate || "[Date]"}</p>
      </section>

      {/* Display RCx-related photos */}
      {rcxPhotos.length > 0 && (
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4 text-emerald-700 dark:text-emerald-500">I. Site Photos</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {rcxPhotos.map((photo, index) => (
              <div key={photo.id || index} className="border rounded-md overflow-hidden">
                <img
                  src={photo.photo_url || photo.thumbnail_url}
                  alt={photo.equipment_type || `RCx Photo ${index + 1}`}
                  className="w-full h-48 object-cover"
                />
                <div className="p-3 bg-muted/20">
                  <p className="font-medium text-sm">{photo.equipment_type || "Equipment"}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {typeof photo.location === "string"
                      ? photo.location
                      : photo.location?.room || "Location not specified"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Functional Performance Test Findings & Recommendations */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-4 text-emerald-700 dark:text-emerald-500">
          J. Functional Performance Test Findings & Recommendations
        </h2>

        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4">RCM1: HVAC Refrigerant Line Insulation</h3>

          <div className="mb-4">
            <h4 className="font-semibold mb-2">Existing Condition:</h4>
            <p className="dark:text-gray-300">
              The insulation on the HVAC suction lines were observed to be deteriorated or missing.
            </p>
          </div>

          <div className="mb-4">
            <h4 className="font-semibold mb-2">Recommendation:</h4>
            <p className="dark:text-gray-300">
              It is recommended to install insulation on suction lines that are exposed to the open air. The split
              system refrigerant lines are designed to carry refrigerant at very low temperatures; however, when the
              outside air contacts the pipping, it can change the temperature of the refrigerant. This disruption
              creates energy losses and deteriorates the useful life of the equipment.
            </p>
          </div>

          <div className="mb-4">
            <h4 className="font-semibold mb-2">Supporting Images:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rcxPhotos.length > 0 ? (
                // Use actual project photos if available
                rcxPhotos
                  .slice(0, 2)
                  .map((photo, index) => (
                    <div key={`supporting-${index}`}>
                      <img
                        src={photo.photo_url || photo.thumbnail_url}
                        alt={photo.equipment_type || `RCx Photo ${index + 1}`}
                        className="w-full rounded-lg shadow-lg mb-2"
                      />
                      <p className="text-sm text-center dark:text-gray-400">
                        {photo.equipment_type || `RCx Photo ${index + 1}`}
                      </p>
                    </div>
                  ))
              ) : (
                // Fallback to static images if no photos available
                <>
                  <div>
                    <img
                      src="/images/rcms/uninsulated-lines.jpg"
                      alt="Partially Uninsulated Refrigerant Lines"
                      className="w-full rounded-lg shadow-lg mb-2"
                    />
                    <p className="text-sm text-center dark:text-gray-400">Partially Uninsulated Refrigerant Lines</p>
                  </div>
                  <div>
                    <img
                      src="/images/rcms/pipe-insulation.jpg"
                      alt="Pipe Insulation"
                      className="w-full rounded-lg shadow-lg mb-2"
                    />
                    <p className="text-sm text-center dark:text-gray-400">Pipe Insulation</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Operational Training */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-4 text-emerald-700 dark:text-emerald-500">K. Operational Training</h2>
        <p className="mb-4 dark:text-gray-300">
          Operational training of Section 91.9706.1.3 of the LAMC was not necessary for this building due to one or more
          of the following reasons:
        </p>
        <ul className="list-disc pl-6 mb-4 space-y-2 dark:text-gray-300">
          <li>The building engineer is already well trained in these matters.</li>
          <li>The building does not have a dedicated building engineer responsible for day-to-day operations.</li>
          <li>Repairs and maintenance are conducted by third party vendors.</li>
          <li>There were no significant findings that require a formal training.</li>
        </ul>
        <p className="mb-4 dark:text-gray-300">
          However, Vert's engineer has discussed with the person in charge of the building about the operation and
          maintenance issues observed, and how to correct them. Many of these remarks involved general maintenance,
          scheduling, and control strategies.
        </p>
        <p className="dark:text-gray-300">
          These observations are included in the retro-commissioning report (RCMs) and were discussed during the report
          presentation.
        </p>
      </section>

      {/* Appendices */}
      <section className="mb-10">
        <AppendicesReport projectData={projectData} />
      </section>
    </div>
  )
}

export default RetroCommissioningReport
