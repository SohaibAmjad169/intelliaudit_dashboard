"use client"

import React from "react"
import { Settings, TrendingDown, BarChart, Wrench, Fan, HardDrive, Gauge } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useQuery } from "@tanstack/react-query"
import { measuresV2Service } from "@/services/measures/measures-v2"
import { photosService } from "@/features/energy/site-photos/photosService"

interface RCxMeasure {
  id?: string
  name: string
  description?: string
  system?: string
  annualSavings?: {
    kwh?: number
    therms?: number
    cost?: number
  }
  implementationCost?: number
  paybackPeriod?: number
  priority?: "high" | "medium" | "low"
  complexity?: "simple" | "moderate" | "complex"
  details?: string
  photoIds?: string[] // IDs of related photos
  photos?: any[] // Actual photo objects
}

interface RetroCommissioningProps {
  measures?: RCxMeasure[]
  formatNumber: (value?: number) => string
  formatCurrency: (value?: number) => string
  projectId?: string // Added projectId to fetch real data
  // Properties that are received but not currently used in the component
  // Using underscore prefix to indicate they are intentionally unused
  _findings?: any[]
  _testingResults?: any[]
  _formatPercent?: (value?: number) => string
}

export const RetroCommissioning: React.FC<RetroCommissioningProps> = ({
  measures: initialMeasures = [],
  // These parameters are received for future implementation of findings display
  // Currently not used in the component but kept for API compatibility
  // @ts-ignore -- Intentionally unused property for future implementation
  _findings = [],
  // @ts-ignore -- Intentionally unused property for future implementation
  _testingResults = [],
  formatNumber,
  formatCurrency,
  projectId,
  // This parameter is received but not currently used in the component
  // @ts-ignore -- Intentionally unused property for future implementation
  _formatPercent = (value?: number) => (value ? `${value.toFixed(1)}%` : "N/A"),
}) => {
  // Fetch RCx measures from the API if projectId is provided
  const {
    data: fetchedMeasures = [],
    isLoading: measuresLoading,
    error: measuresError,
  } = useQuery({
    queryKey: ["rcx-measures", projectId],
    queryFn: async () => {
      if (!projectId) return []

      // Fetch all measures
      const allMeasures = await measuresV2Service.getAllMeasures(projectId)

      // Filter for RCx measures only
      return allMeasures
        .filter((measure) => {
          const type = measure.type?.toLowerCase?.() || ""
          const category = (measure as any).category?.toLowerCase?.() || ""
          const name = measure.name?.toLowerCase?.() || ""

          return (
            type === "rcm" ||
            category === "rcm" ||
            name?.includes("rcm") ||
            name?.includes("commissioning") ||
            category?.includes("commissioning")
          )
        })
        .map((measure) => ({
          id: measure.id,
          name: measure.name || (measure as any).title || "",
          description: measure.details || "",
          system: (measure as any).system || "HVAC",
          annualSavings: {
            kwh: measure.annualSavings?.kwh || 0,
            therms: measure.annualSavings?.therms || 0,
            cost: measure.annualSavings?.cost || 0,
          },
          implementationCost: measure.implementationCost || 0,
          paybackPeriod: measure.paybackPeriod || 0,
          priority: measure.priority || "medium",
          complexity: (measure as any).complexity || "moderate",
          details: measure.details || "",
          photoIds: (measure as any).photoIds || [],
        }))
    },
    enabled: !!projectId,
  })

  // Fetch photos for measures
  const {
    data: photos = [],
    isLoading: photosLoading,
    error: photosError,
  } = useQuery({
    queryKey: ["rcx-photos", projectId],
    queryFn: async () => {
      if (!projectId) return []
      return photosService.getProjectPhotos(projectId)
    },
    enabled: !!projectId,
  })

  // Combine fetched measures with photos
  const measuresWithPhotos = React.useMemo(() => {
    const allMeasures = projectId ? fetchedMeasures : initialMeasures

    return allMeasures.map((measure) => {
      // Find related photos for this measure
      const relatedPhotos = photos.filter((photo) => {
        // Match by measure ID in photo metadata
        if (photo.measure_id === measure.id) return true

        // Match by measure name in photo metadata or notes
        if (photo.notes && photo.notes.toLowerCase().includes(measure.name.toLowerCase())) return true

        // Match by explicit photoIds array if present
        if (measure.photoIds && measure.photoIds.includes(photo.id)) return true

        return false
      })

      return {
        ...measure,
        photos: relatedPhotos,
      }
    })
  }, [projectId, fetchedMeasures, initialMeasures, photos])

  // Use the combined measures
  const measures = measuresWithPhotos

  // Group measures by system
  const measuresBySystem: Record<string, RCxMeasure[]> = {}
  measures.forEach((measure) => {
    const system = measure.system || "General"
    if (!measuresBySystem[system]) {
      measuresBySystem[system] = []
    }
    measuresBySystem[system].push(measure)
  })

  // Sort systems by total savings potential
  const sortedSystems = Object.keys(measuresBySystem).sort((a, b) => {
    const aSavings = measuresBySystem[a].reduce((sum, measure) => sum + (measure.annualSavings?.cost || 0), 0)
    const bSavings = measuresBySystem[b].reduce((sum, measure) => sum + (measure.annualSavings?.cost || 0), 0)
    return bSavings - aSavings
  })

  // Get icon for each system
  const getSystemIcon = (system: string) => {
    const lowerSystem = system.toLowerCase()
    if (lowerSystem.includes("hvac") || lowerSystem.includes("air") || lowerSystem.includes("ventilation")) {
      return <Fan className="h-5 w-5 mr-2" />
    } else if (lowerSystem.includes("controls") || lowerSystem.includes("bms") || lowerSystem.includes("automation")) {
      return <HardDrive className="h-5 w-5 mr-2" />
    } else if (lowerSystem.includes("meter") || lowerSystem.includes("monitor")) {
      return <Gauge className="h-5 w-5 mr-2" />
    } else {
      return <Wrench className="h-5 w-5 mr-2" />
    }
  }

  // Get color for priority
  const getPriorityColor = (priority = "medium") => {
    switch (priority) {
      case "high":
        return "text-purple-600 bg-purple-50 border-purple-200"
      case "medium":
        return "text-indigo-600 bg-indigo-50 border-indigo-200"
      case "low":
        return "text-slate-600 bg-slate-50 border-slate-200"
      default:
        return "text-slate-600 bg-slate-50 border-slate-200"
    }
  }

  // Calculate totals
  const totalKwhSavings = measures.reduce((sum, measure) => sum + (measure.annualSavings?.kwh || 0), 0)
  const totalThermsSavings = measures.reduce((sum, measure) => sum + (measure.annualSavings?.therms || 0), 0)
  const totalCostSavings = measures.reduce((sum, measure) => sum + (measure.annualSavings?.cost || 0), 0)
  const totalImplementationCost = measures.reduce((sum, measure) => sum + (measure.implementationCost || 0), 0)
  const averagePayback = totalCostSavings > 0 ? totalImplementationCost / totalCostSavings : 0

  // Loading state
  if (projectId && (measuresLoading || photosLoading)) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-2"></div>
        <span>Loading retro-commissioning data...</span>
      </div>
    )
  }

  // Error state
  if (projectId && (measuresError || photosError)) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-md">
        <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Data</h3>
        <p className="text-red-600">
          {measuresError ? "Failed to load measures. " : ""}
          {photosError ? "Failed to load photos." : ""}
          Please try refreshing the page.
        </p>
      </div>
    )
  }

  return (
    <div className="print:page-break-after">
      <h3 className="text-xl font-semibold mb-4 flex items-center">
        <Settings className="h-6 w-6 mr-2" />
        Retro-Commissioning Opportunities
      </h3>

      <div className="mb-6">
        <p className="text-muted-foreground">
          Retro-commissioning (RCx) focuses on improving the operation and maintenance of existing building systems to
          optimize performance and efficiency without significant capital improvements. The following opportunities were
          identified during our assessment.
        </p>
      </div>

      {measures.length > 0 ? (
        <>
          {/* Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-center flex flex-col items-center">
                  <TrendingDown className="h-8 w-8 mb-2 text-purple-500" />
                  Annual Cost Savings
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="text-2xl font-bold">{formatCurrency(totalCostSavings)}</div>
                <p className="text-sm text-muted-foreground mt-1">From operational improvements</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-center flex flex-col items-center">
                  <Wrench className="h-8 w-8 mb-2 text-indigo-500" />
                  Implementation Costs
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="text-2xl font-bold">{formatCurrency(totalImplementationCost)}</div>
                <p className="text-sm text-muted-foreground mt-1">Primarily labor and minor parts</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-center flex flex-col items-center">
                  <BarChart className="h-8 w-8 mb-2 text-blue-500" />
                  Simple Payback
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="text-2xl font-bold">
                  {averagePayback > 0 ? `${averagePayback.toFixed(1)} months` : "N/A"}
                </div>
                <p className="text-sm text-muted-foreground mt-1">Average across all measures</p>
              </CardContent>
            </Card>
          </div>

          {/* Summary of RCx Measures */}
          <div className="mb-8">
            <h4 className="text-lg font-medium mb-4">Summary of RCx Measures</h4>
            <Card>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[300px]">Measure</TableHead>
                      <TableHead>System</TableHead>
                      <TableHead>Annual Energy Savings</TableHead>
                      <TableHead>Annual Cost Savings</TableHead>
                      <TableHead>Implementation Cost</TableHead>
                      <TableHead className="text-right">Priority</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {measures.map((measure, index) => (
                      <TableRow key={measure.id || `measure-${index}`}>
                        <TableCell className="font-medium">{measure.name}</TableCell>
                        <TableCell>{measure.system || "General"}</TableCell>
                        <TableCell>
                          {(measure.annualSavings?.kwh ?? 0) > 0 && (
                            <div>{formatNumber(measure.annualSavings?.kwh)} kWh</div>
                          )}
                          {(measure.annualSavings?.therms ?? 0) > 0 && (
                            <div>{formatNumber(measure.annualSavings?.therms)} therms</div>
                          )}
                        </TableCell>
                        <TableCell>{formatCurrency(measure.annualSavings?.cost)}</TableCell>
                        <TableCell>{formatCurrency(measure.implementationCost)}</TableCell>
                        <TableCell className="text-right">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(measure.priority)}`}
                          >
                            {(measure.priority || "MEDIUM").toUpperCase()}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}

                    {/* Total Row */}
                    <TableRow className="bg-muted/30 font-medium">
                      <TableCell>TOTAL</TableCell>
                      <TableCell></TableCell>
                      <TableCell>
                        <div>{formatNumber(totalKwhSavings)} kWh</div>
                        <div>{formatNumber(totalThermsSavings)} therms</div>
                      </TableCell>
                      <TableCell>{formatCurrency(totalCostSavings)}</TableCell>
                      <TableCell>{formatCurrency(totalImplementationCost)}</TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Measures by System */}
          {sortedSystems.map((system) => (
            <div key={system} className="mb-8">
              <h4 className="text-lg font-medium mb-4 flex items-center">
                {getSystemIcon(system)}
                {system}
              </h4>

              <div className="space-y-6">
                {measuresBySystem[system].map((measure, index) => (
                  <Card key={measure.id || `measure-detail-${index}`} className="overflow-hidden">
                    <CardHeader className="bg-muted/30 py-4">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-base">{measure.name}</CardTitle>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(measure.priority)} border`}
                        >
                          {(measure.priority || "MEDIUM").toUpperCase()} PRIORITY
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <p className="mb-4">{measure.description || "No description available."}</p>

                      {/* Display related photos if available */}
                      {measure.photos && measure.photos.length > 0 && (
                        <div className="mb-6">
                          <h6 className="text-sm font-medium mb-2">Related Photos</h6>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {measure.photos.slice(0, 3).map((photo, photoIndex) => (
                              <div
                                key={`photo-${photoIndex}`}
                                className="relative aspect-square rounded-md overflow-hidden border"
                              >
                                <img
                                  src={photo.photo_url || photo.thumbnail_url}
                                  alt={`Photo for ${measure.name}`}
                                  className="object-cover w-full h-full"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="bg-muted/30 p-3 rounded-md">
                          <h6 className="text-sm font-medium mb-1">Annual Energy Savings</h6>
                          <div className="space-y-1">
                            {(measure.annualSavings?.kwh ?? 0) > 0 && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground text-sm">Electricity:</span>
                                <span className="font-medium">{formatNumber(measure.annualSavings?.kwh)} kWh</span>
                              </div>
                            )}
                            {(measure.annualSavings?.therms ?? 0) > 0 && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground text-sm">Natural Gas:</span>
                                <span className="font-medium">
                                  {formatNumber(measure.annualSavings?.therms)} therms
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="bg-muted/30 p-3 rounded-md">
                          <h6 className="text-sm font-medium mb-1">Financial Analysis</h6>
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground text-sm">Annual Cost Savings:</span>
                              <span className="font-medium">{formatCurrency(measure.annualSavings?.cost)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground text-sm">Implementation Cost:</span>
                              <span className="font-medium">{formatCurrency(measure.implementationCost)}</span>
                            </div>
                            <div className="flex justify-between pt-1 border-t">
                              <span className="text-muted-foreground text-sm">Simple Payback:</span>
                              <span className="font-medium">
                                {typeof measure.paybackPeriod === "number"
                                  ? `${measure.paybackPeriod.toFixed(1)} months`
                                  : "N/A"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-muted/30 p-3 rounded-md">
                          <h6 className="text-sm font-medium mb-1">Implementation</h6>
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground text-sm">Complexity:</span>
                              <span className="font-medium capitalize">{measure.complexity || "Moderate"}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground text-sm">Disruption:</span>
                              <span className="font-medium">
                                {measure.complexity === "simple"
                                  ? "Minimal"
                                  : measure.complexity === "moderate"
                                    ? "Limited"
                                    : "Moderate"}
                              </span>
                            </div>
                            <div className="flex justify-between pt-1 border-t">
                              <span className="text-muted-foreground text-sm">Specialized Labor:</span>
                              <span className="font-medium">
                                {measure.complexity === "simple"
                                  ? "Basic Skills"
                                  : measure.complexity === "moderate"
                                    ? "Technician"
                                    : "Specialist"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {measure.details && (
                        <div className="mt-4 pt-4 border-t">
                          <h6 className="text-sm font-medium mb-2">Implementation Details</h6>
                          <p className="text-sm">{measure.details}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}

          {/* Implementation Plan */}
          <div className="mb-8">
            <h4 className="text-lg font-medium mb-4">Implementation Plan</h4>
            <Card>
              <CardContent className="pt-6">
                <p className="mb-4">
                  We recommend implementing these retro-commissioning measures in phases to maximize savings while
                  minimizing disruption:
                </p>

                <div className="space-y-4 mb-6">
                  <div className="bg-purple-50 p-4 rounded-md border border-purple-100">
                    <h5 className="font-medium mb-2 text-purple-800">Phase 1: Immediate Opportunities (0-3 months)</h5>
                    <p className="text-sm text-purple-800 mb-2">
                      Focus on high-priority operational adjustments with minimal complexity and rapid payback:
                    </p>
                    <ul className="text-sm space-y-1 text-purple-800">
                      {measures
                        .filter((m) => m.priority === "high" && m.complexity === "simple")
                        .slice(0, 3)
                        .map((m, i) => (
                          <li key={i}>
                            {m.name} - {formatCurrency(m.annualSavings?.cost)}/year
                          </li>
                        ))}
                    </ul>
                  </div>

                  <div className="bg-indigo-50 p-4 rounded-md border border-indigo-100">
                    <h5 className="font-medium mb-2 text-indigo-800">Phase 2: Mid-Term Optimizations (3-6 months)</h5>
                    <p className="text-sm text-indigo-800 mb-2">
                      Implement medium-priority measures requiring moderate technical expertise:
                    </p>
                    <ul className="text-sm space-y-1 text-indigo-800">
                      {measures
                        .filter((m) => m.priority === "medium" || m.complexity === "moderate")
                        .slice(0, 3)
                        .map((m, i) => (
                          <li key={i}>
                            {m.name} - {formatCurrency(m.annualSavings?.cost)}/year
                          </li>
                        ))}
                    </ul>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
                    <h5 className="font-medium mb-2 text-blue-800">Phase 3: System-Wide Optimizations (6+ months)</h5>
                    <p className="text-sm text-blue-800 mb-2">
                      Address complex issues requiring specialized skills and longer implementation timeframes:
                    </p>
                    <ul className="text-sm space-y-1 text-blue-800">
                      {measures
                        .filter(
                          (m) => m.complexity === "complex" || (m.priority === "low" && m.complexity !== "simple"),
                        )
                        .slice(0, 3)
                        .map((m, i) => (
                          <li key={i}>
                            {m.name} - {formatCurrency(m.annualSavings?.cost)}/year
                          </li>
                        ))}
                    </ul>
                  </div>
                </div>

                <div className="text-sm text-muted-foreground border-t pt-4">
                  <p>
                    <span className="font-medium">Ongoing Commissioning:</span> To maintain savings over time, we
                    recommend implementing an ongoing commissioning program that includes regular system performance
                    monitoring, preventive maintenance, and periodic recommissioning to address performance drift.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <div className="mb-8 bg-muted/20 border-2 border-dashed border-muted p-8 rounded-md text-center">
          <Settings className="h-10 w-10 mx-auto mb-4 text-muted" />
          <h4 className="text-lg font-medium mb-2">No RCx Measures Identified</h4>
          <p className="text-muted-foreground max-w-md mx-auto">
            No retro-commissioning measures have been identified yet. Opportunities will be added here once the system
            assessment is complete.
          </p>
        </div>
      )}
    </div>
  )
}
