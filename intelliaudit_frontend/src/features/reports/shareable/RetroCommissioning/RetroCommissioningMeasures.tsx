"use client"

import { useState, useEffect } from "react"
import { measuresV2Service } from "@/services/measures/measures-v2"
import { photosService } from "@/features/energy/site-photos/photosService"

interface RetroCommissioningMeasureProps {
  projectId: string
}

interface RCM {
  id: string
  title: string
  existingCondition: string
  recommendation: string
  benefits: {
    title: string
    description: string
  }[]
  implementationSteps: string[]
  estimatedSavings: {
    cost: number
    energy: number
    therms: number
  }
  implementationCost: number
  paybackPeriod: number
  images?: {
    existingImage?: string
    replacementImage?: string
    existingCaption?: string
    replacementCaption?: string
  }
  usefulLife?: number
  photoIds?: string[] // IDs of related photos
  photos?: any[] // Actual photo objects
}

export function RetroCommissioningMeasures({ projectId }: RetroCommissioningMeasureProps): JSX.Element {
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [rcms, setRcms] = useState<RCM[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)

        // Fetch measures from the existing measures service
        const measuresResponse = await measuresV2Service.getAllMeasures(projectId)

        // Fetch all project photos
        const photosResponse = await photosService.getProjectPhotos(projectId)

        // Filter to only get RCM type measures
        let rcmMeasures: RCM[] = []

        if (measuresResponse && Array.isArray(measuresResponse)) {
          // Extract and map measures to our RCM format
          rcmMeasures = measuresResponse
            .filter((measure) => {
              // Check multiple properties that might indicate an RCM
              const type = measure.type?.toLowerCase?.()
              const category = (measure as any).category?.toLowerCase?.()
              const name = measure.name?.toLowerCase?.()
              return (
                type === "rcm" ||
                category === "rcm" ||
                name?.includes("rcm") ||
                name?.includes("commissioning") ||
                category?.includes("commissioning")
              )
            })
            .map((measure) => {
              // Get any extended properties from the measure
              const extendedMeasure = measure as any

              // Find related photos for this measure
              const relatedPhotos = photosResponse.filter((photo) => {
                // Match by measure ID in photo metadata
                if (photo.measure_id === measure.id) return true

                // Match by measure name in photo metadata or notes
                if (photo.notes && photo.notes.toLowerCase().includes(measure.name.toLowerCase())) return true

                // Match by explicit photoIds array if present
                if (extendedMeasure.photoIds && extendedMeasure.photoIds.includes(photo.id)) return true

                return false
              })

              // Get photo URLs for the measure
              const photoUrls = relatedPhotos.map((photo) => photo.photo_url || photo.thumbnail_url).filter(Boolean)

              return {
                id: measure.id,
                title: measure.name || extendedMeasure.title || "",
                existingCondition: extendedMeasure.existingCondition || extractExistingCondition(measure.details) || "",
                recommendation: extendedMeasure.recommendation || extractRecommendation(measure.details) || "",
                benefits: extractBenefits(extendedMeasure.benefits || measure.details),
                implementationSteps: extractImplementationSteps(extendedMeasure.implementationNotes || measure.details),
                estimatedSavings: {
                  cost: measure.annualSavings?.cost || 0,
                  energy: measure.annualSavings?.kwh || 0,
                  therms: measure.annualSavings?.therms || 0,
                },
                implementationCost: measure.implementationCost || 0,
                paybackPeriod: measure.paybackPeriod || 0,
                usefulLife: extendedMeasure.usefulLife || 10,
                images: {
                  // Use related photos if available, otherwise use existing images
                  existingImage:
                    photoUrls[0] || extendedMeasure.images?.existing || extendedMeasure.images?.existingFixture,
                  replacementImage:
                    photoUrls[1] || extendedMeasure.images?.replacement || extendedMeasure.images?.newFixture,
                  existingCaption: "Existing Condition",
                  replacementCaption: "Recommended Solution",
                },
                photoIds: extendedMeasure.photoIds || [],
                photos: relatedPhotos,
              }
            })
        }

        if (rcmMeasures.length === 0) {
          // If no RCM measures found, add a sample one for development
          rcmMeasures = [
            {
              id: "RCM-1",
              title: "HVAC Refrigerant Line Insulation",
              existingCondition:
                "During the site visit, it was observed that several refrigerant lines on the rooftop HVAC units have damaged or missing insulation. This condition leads to thermal losses, reduced system efficiency, and increased energy consumption.",
              recommendation:
                "Replace damaged or missing insulation on refrigerant lines with new UV-resistant insulation meeting manufacturer specifications. All suction lines should be properly insulated to prevent heat gain and condensation.",
              benefits: [
                {
                  title: "Energy Savings",
                  description:
                    "Properly insulated refrigerant lines reduce the thermal load on the HVAC system, leading to improved efficiency and decreased energy usage.",
                },
                {
                  title: "Extended Equipment Life",
                  description:
                    "Reduced strain on compressors and other system components helps extend equipment lifespan.",
                },
                {
                  title: "Improved Performance",
                  description:
                    "Optimized refrigerant temperatures ensure the system operates as designed, providing better cooling performance.",
                },
                {
                  title: "Condensation Prevention",
                  description:
                    "Proper insulation prevents condensation that can lead to water damage and potential mold growth.",
                },
              ],
              implementationSteps: [
                "Inspect all refrigerant lines to identify damaged or missing insulation",
                "Measure and purchase appropriate UV-resistant insulation materials",
                "Remove damaged insulation sections",
                "Install new insulation with proper overlap at joints",
                "Secure with appropriate tape or fasteners",
                "Label completed work and document in maintenance logs",
              ],
              estimatedSavings: {
                cost: 1861,
                energy: 10337,
                therms: 0,
              },
              implementationCost: 4800,
              paybackPeriod: 2.6,
              usefulLife: 10,
              images: {
                existingImage: "/images/rcms/damaged-refrigerant-insulation.jpg",
                replacementImage: "/images/rcms/repaired-refrigerant-insulation.jpg",
                existingCaption: "Damaged Refrigerant Line Insulation",
                replacementCaption: "Properly Insulated Refrigerant Lines",
              },
            },
          ]
        }

        setRcms(rcmMeasures)
        setIsLoading(false)
      } catch (err) {
        console.error("Error fetching RCM data:", err)
        setError("Failed to load RCM data")
        setIsLoading(false)
      }
    }

    if (projectId) {
      fetchData()
    }
  }, [projectId])

  // Helper functions to extract data from different formats
  function extractExistingCondition(details?: string): string {
    if (!details) return ""

    const pattern = /Existing Condition:(.+?)(?=Recommendation:|Benefits:|$)/
    const match = details.match(pattern)
    return match ? match[1].trim() : ""
  }

  function extractRecommendation(details?: string): string {
    if (!details) return ""

    const pattern = /Recommendation:(.+?)(?=Benefits:|Implementation Notes:|$)/
    const match = details.match(pattern)
    return match ? match[1].trim() : ""
  }

  function extractBenefits(text?: string): { title: string; description: string }[] {
    if (!text) return []

    // If it's already an array of benefits, return it
    if (Array.isArray(text)) {
      return text.map((item) => {
        if (typeof item === "string") {
          return { title: "Benefit", description: item }
        }
        return item
      })
    }

    // Try to extract from text
    const pattern = /Benefits:(.+?)(?=Implementation Notes:|$)/
    const benefitsSection = text.match(pattern)
    if (!benefitsSection) return []

    const benefitsList = benefitsSection[1]
      .trim()
      .split("\n")
      .filter((b) => b.trim())
    return benefitsList.map((benefit) => ({
      title: benefit.split(":")[0]?.trim() || "Benefit",
      description: benefit.split(":")[1]?.trim() || benefit,
    }))
  }

  function extractImplementationSteps(text?: string): string[] {
    if (!text) return []

    // Check if there's an Implementation Notes section
    const pattern = /Implementation Notes:(.+?)(?=$)/
    const implementationSection = text.match(pattern)
    if (!implementationSection) return []

    return implementationSection[1]
      .trim()
      .split("\n")
      .filter((line) => line.trim())
      .map((line) => line.replace(/^\d+\.\s*/, "").trim())
  }

  // Calculate totals for cost savings table
  const calculateTotals = () => {
    return rcms.reduce(
      (acc, rcm) => {
        return {
          costSavings: acc.costSavings + rcm.estimatedSavings.cost,
          kwhSavings: acc.kwhSavings + rcm.estimatedSavings.energy,
          kwSavings: 0, // Not provided in the data
          thermsSavings: acc.thermsSavings + rcm.estimatedSavings.therms,
          lbsSteamSavings: 0, // Not provided in the data
          gallonsSavings: 0, // Not provided in the data
          projectCost: acc.projectCost + rcm.implementationCost,
          incentives: 0, // Not provided in the data
          netCost: acc.netCost + rcm.implementationCost, // Assuming no incentives
        }
      },
      {
        costSavings: 0,
        kwhSavings: 0,
        kwSavings: 0,
        thermsSavings: 0,
        lbsSteamSavings: 0,
        gallonsSavings: 0,
        projectCost: 0,
        incentives: 0,
        netCost: 0,
      },
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-2"></div>
        <span>Loading retro-commissioning measures...</span>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md p-4 mb-6">
        <p className="text-red-700 dark:text-red-500 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </p>
      </div>
    )
  }

  // No measures found
  if (rcms.length === 0) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-md p-4 mb-6">
        <p className="text-yellow-700 dark:text-yellow-500 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          No retro-commissioning measures found for this project.
        </p>
      </div>
    )
  }

  const totals = calculateTotals()

  return (
    <div className="overflow-x-auto">
      {/* Display measure photos if available */}
      {rcms.some((rcm) => rcm.photos && rcm.photos.length > 0) && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">RCx Measure Photos</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {rcms.map(
              (rcm) =>
                rcm.photos &&
                rcm.photos.map((photo, photoIndex) => (
                  <div key={`${rcm.id}-photo-${photoIndex}`} className="border rounded-md overflow-hidden">
                    <img
                      src={photo.photo_url || photo.thumbnail_url}
                      alt={`Photo for ${rcm.title}`}
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-3 bg-muted/20">
                      <p className="font-medium text-sm">{rcm.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {photo.equipment_type || photo.category || "Related photo"}
                      </p>
                    </div>
                  </div>
                )),
            )}
          </div>
        </div>
      )}

      <table className="min-w-full text-sm border-collapse">
        <thead>
          <tr>
            <th
              colSpan={12}
              className="text-center py-2 px-3 bg-green-200 dark:bg-green-800 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600"
            >
              RCMs
            </th>
          </tr>
          <tr className="bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
            <th className="py-2 px-3 border">EEM #</th>
            <th className="py-2 px-3 border">Descriptions</th>
            <th className="py-2 px-3 border">Cost Savings</th>
            <th className="py-2 px-3 border">KWH Savings</th>
            <th className="py-2 px-3 border">KW Savings</th>
            <th className="py-2 px-3 border">Therms Savings</th>
            <th className="py-2 px-3 border">Lbs Steam Savings</th>
            <th className="py-2 px-3 border">Gallons Savings</th>
            <th className="py-2 px-3 border">Estimated Project Cost</th>
            <th className="py-2 px-3 border">Incentives</th>
            <th className="py-2 px-3 border">Net Cost</th>
            <th className="py-2 px-3 border">Useful Life (Years)</th>
          </tr>
        </thead>
        <tbody>
          {rcms.map((rcm, index) => (
            <tr key={rcm.id} className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
              <td className="py-2 px-3 border">RCM {index + 1}</td>
              <td className="py-2 px-3 border">
                {rcm.title || "[Measure Title]"}
              </td>
              <td className="py-2 px-3 border">
                ${rcm.estimatedSavings.cost.toLocaleString()}
              </td>
              <td className="py-2 px-3 border">
                {rcm.estimatedSavings.energy.toLocaleString()}
              </td>
              <td className="py-2 px-3 border">0</td>
              <td className="py-2 px-3 border">
                {rcm.estimatedSavings.therms.toLocaleString()}
              </td>
              <td className="py-2 px-3 border">0</td>
              <td className="py-2 px-3 border">0</td>
              <td className="py-2 px-3 border">
                ${rcm.implementationCost.toLocaleString()}
              </td>
              <td className="py-2 px-3 border">$0</td>
              <td className="py-2 px-3 border">
                ${rcm.implementationCost.toLocaleString()}
              </td>
              <td className="py-2 px-3 border">{rcm.usefulLife || 10}</td>
            </tr>
          ))}
          <tr className="bg-gray-200 dark:bg-gray-700 font-bold text-gray-800 dark:text-gray-200">
            <td colSpan={2} className="py-2 px-3 border text-center">
              TOTAL
            </td>
            <td className="py-2 px-3 border">
              ${totals.costSavings.toLocaleString()}
            </td>
            <td className="py-2 px-3 border">
              {totals.kwhSavings.toLocaleString()}
            </td>
            <td className="py-2 px-3 border">0</td>
            <td className="py-2 px-3 border">
              {totals.thermsSavings.toLocaleString()}
            </td>
            <td className="py-2 px-3 border">0</td>
            <td className="py-2 px-3 border">0</td>
            <td className="py-2 px-3 border">
              ${totals.projectCost.toLocaleString()}
            </td>
            <td className="py-2 px-3 border">$0</td>
            <td className="py-2 px-3 border">
              ${totals.netCost.toLocaleString()}
            </td>
            <td className="py-2 px-3 border"></td>
          </tr>
        </tbody>
      </table>

      {/* Display measure details with photos */}
      <div className="mt-8 space-y-8">
        {rcms.map((rcm, index) => (
          <div key={`detail-${rcm.id}`} className="border rounded-lg overflow-hidden">
            <div className="bg-green-100 dark:bg-green-800 p-4">
              <h3 className="text-lg font-semibold text-foreground">
                RCM {index + 1}: {rcm.title}
              </h3>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">Existing Condition</h4>
                  <p className="text-sm mb-4">{rcm.existingCondition}</p>

                  <h4 className="font-medium mb-2">Recommendation</h4>
                  <p className="text-sm mb-4">{rcm.recommendation}</p>

                  <h4 className="font-medium mb-2">Benefits</h4>
                  <ul className="list-disc pl-5 text-sm mb-4">
                    {rcm.benefits.map((benefit, i) => (
                      <li key={i} className="mb-1">
                        <span className="font-medium">{benefit.title}:</span> {benefit.description}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  {/* Display photos if available */}
                  {(rcm.photos?.length > 0 || rcm.images?.existingImage) && (
                    <div className="space-y-4">
                      {rcm.photos?.length > 0 ? (
                        // Display actual photos from the database
                        rcm.photos.map((photo, photoIndex) => (
                          <div key={`detail-photo-${photoIndex}`} className="border rounded overflow-hidden">
                            <img
                              src={photo.photo_url || photo.thumbnail_url}
                              alt={`Photo ${photoIndex + 1} for ${rcm.title}`}
                              className="w-full h-auto"
                            />
                            <p className="text-xs p-2 bg-muted/20">
                              {photo.equipment_type || photo.category || `Photo ${photoIndex + 1}`}
                            </p>
                          </div>
                        ))
                      ) : (
                        // Display static images if no photos from database
                        <div className="grid grid-cols-1 gap-4">
                          {rcm.images?.existingImage && (
                            <div className="border rounded overflow-hidden">
                              <img
                                src={rcm.images.existingImage || "/placeholder.svg"}
                                alt={rcm.images.existingCaption || "Existing Condition"}
                                className="w-full h-auto"
                              />
                              <p className="text-xs p-2 bg-muted/20">
                                {rcm.images.existingCaption || "Existing Condition"}
                              </p>
                            </div>
                          )}
                          {rcm.images?.replacementImage && (
                            <div className="border rounded overflow-hidden">
                              <img
                                src={rcm.images.replacementImage || "/placeholder.svg"}
                                alt={rcm.images.replacementCaption || "Recommended Solution"}
                                className="w-full h-auto"
                              />
                              <p className="text-xs p-2 bg-muted/20">
                                {rcm.images.replacementCaption || "Recommended Solution"}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Implementation Steps</h4>
                    <ol className="list-decimal pl-5 text-sm">
                      {rcm.implementationSteps.map((step, i) => (
                        <li key={i} className="mb-1">
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="font-medium">Estimated Savings</p>
                  <p>Energy: {rcm.estimatedSavings.energy.toLocaleString()} kWh/yr</p>
                  {rcm.estimatedSavings.therms > 0 && (
                    <p>Gas: {rcm.estimatedSavings.therms.toLocaleString()} therms/yr</p>
                  )}
                  <p>Cost: ${rcm.estimatedSavings.cost.toLocaleString()}/yr</p>
                </div>
                <div>
                  <p className="font-medium">Implementation</p>
                  <p>Cost: ${rcm.implementationCost.toLocaleString()}</p>
                  <p>Payback: {rcm.paybackPeriod.toFixed(1)} months</p>
                </div>
                <div>
                  <p className="font-medium">Details</p>
                  <p>Useful Life: {rcm.usefulLife || 10} years</p>
                  <p>Priority: {rcm.id?.includes("high") ? "High" : rcm.id?.includes("low") ? "Low" : "Medium"}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
