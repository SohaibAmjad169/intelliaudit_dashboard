"use client"

import type React from "react"
import { useState, useEffect, useMemo, useRef } from "react"
import {
  Camera,
  Loader2,
  Power,
  Thermometer,
  Lightbulb,
  Zap,
  Droplet,
  Waves,
  Shirt,
  Sprout,
  Utensils,
  AlertCircle,
  Wind,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { PhotoUploadForm } from "@/features/energy/components/PhotoUploadForm"
import { photosService } from "./photosService"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { SearchInput } from "@/components/forms/inputs/SearchInput"

// Interface likely closer to actual data (adjust if needed)
interface SitePhoto {
  id: string
  photo_url?: string
  thumbnail_url?: string
  equipment_type?: string
  location?: string | { room?: string; floor?: string }
  category?: string
  // Assume other fields might exist but aren't needed for basic categorization
  [key: string]: any // Allow other properties
}

interface PhotosOverviewProps {
  projectId: string
  publicView?: boolean
}

// 1. Define Categories (copied from Equipment.tsx, ensure consistency)
const EQUIPMENT_CATEGORIES = {
  HVAC: "hvac",
  LIGHTING: "lighting",
  VENTILATION: "ventilation",
  DHW: "dhw",
  WATER_FIXTURES: "water_fixtures",
  POOL: "pool",
  LAUNDRY: "laundry",
  IRRIGATION: "irrigation",
  APPLIANCE: "appliance",
  MOTORS_PUMPS: "motors_pumps",
  OTHER: "other",
}

// Optional: Helper for titles/icons (can be simplified)
const CATEGORY_DETAILS: Record<string, { title: string; icon: React.ReactNode }> = {
  [EQUIPMENT_CATEGORIES.HVAC]: { title: "HVAC Systems", icon: <Thermometer className="w-5 h-5" /> },
  [EQUIPMENT_CATEGORIES.LIGHTING]: { title: "Lighting", icon: <Lightbulb className="w-5 h-5" /> },
  [EQUIPMENT_CATEGORIES.VENTILATION]: { title: "Ventilation", icon: <Wind className="w-5 h-5" /> },
  [EQUIPMENT_CATEGORIES.DHW]: { title: "Domestic Hot Water", icon: <Zap className="w-5 h-5" /> },
  [EQUIPMENT_CATEGORIES.WATER_FIXTURES]: { title: "Water Fixtures", icon: <Droplet className="w-5 h-5" /> },
  [EQUIPMENT_CATEGORIES.POOL]: { title: "Pool Equipment", icon: <Waves className="w-5 h-5" /> },
  [EQUIPMENT_CATEGORIES.LAUNDRY]: { title: "Laundry", icon: <Shirt className="w-5 h-5" /> },
  [EQUIPMENT_CATEGORIES.IRRIGATION]: { title: "Irrigation", icon: <Sprout className="w-5 h-5" /> },
  [EQUIPMENT_CATEGORIES.APPLIANCE]: { title: "Appliances", icon: <Utensils className="w-5 h-5" /> },
  [EQUIPMENT_CATEGORIES.MOTORS_PUMPS]: { title: "Motors & Pumps", icon: <Power className="w-5 h-5" /> },
  [EQUIPMENT_CATEGORIES.OTHER]: { title: "Other Equipment", icon: <AlertCircle className="w-5 h-5" /> },
}

export const PhotosOverview: React.FC<PhotosOverviewProps> = ({ projectId, publicView }) => {
  const [selectedPhoto, setSelectedPhoto] = useState<SitePhoto | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  const {
    data: allAnalysis = [],
    isLoading: loading,
    error: fetchError,
    refetch: fetchPhotosData,
  } = useQuery({
    queryKey: ["equipmentAnalysis", projectId],
    // Assuming the service returns SitePhoto[]
    queryFn: (): Promise<SitePhoto[]> => photosService.getProjectPhotos(projectId),
    enabled: !!projectId,
  })

  // const photos: SitePhoto[] = allAnalysis.filter((item: any) => item.photo_url);
  const photos = useMemo(() => {
    return allAnalysis.filter((item: SitePhoto) => item.photo_url)
  }, [allAnalysis])

  const error = fetchError ? "Failed to load photos. Please try again." : null

  const categorizedPhotos = useMemo(() => {
    const validPhotos = photos.filter((photo) => {
      if (!publicView) return true
      const typeLower = (photo.equipment_type || "").toLowerCase()
      return typeLower !== "unknown" && typeLower !== "string" && typeLower !== "n/a"
    })

    const result: Record<string, SitePhoto[]> = {}
    Object.keys(EQUIPMENT_CATEGORIES).forEach((key) => {
      result[(EQUIPMENT_CATEGORIES as any)[key]] = []
    })

    validPhotos.forEach((item) => {
      const type = (item.equipment_type || "").toLowerCase()
      const category = (item.category || "").toLowerCase()
      let assignedCategoryKey = EQUIPMENT_CATEGORIES.OTHER

      // --- Simplified Categorization Logic ---
      // Priority 1: Explicit Category Mapping
      if (category === "hvac") {
        assignedCategoryKey = EQUIPMENT_CATEGORIES.HVAC
      } else if (category === "lighting") {
        assignedCategoryKey = EQUIPMENT_CATEGORIES.LIGHTING
      } else if (category === "ventilation") {
        assignedCategoryKey = EQUIPMENT_CATEGORIES.VENTILATION
      } else if (category === "dhw") {
        assignedCategoryKey = EQUIPMENT_CATEGORIES.DHW
      } else if (category === "water fixtures" || category === "plumbing fixtures") {
        assignedCategoryKey = EQUIPMENT_CATEGORIES.WATER_FIXTURES
      } else if (category === "pool equipment" || category === "pool") {
        assignedCategoryKey = EQUIPMENT_CATEGORIES.POOL
      } else if (category === "laundry" || category === "laundry equipment") {
        assignedCategoryKey = EQUIPMENT_CATEGORIES.LAUNDRY
      } else if (category === "irrigation" || category === "irrigation systems") {
        assignedCategoryKey = EQUIPMENT_CATEGORIES.IRRIGATION
      } else if (category === "appliances") {
        assignedCategoryKey = EQUIPMENT_CATEGORIES.APPLIANCE
      } // Handle Appliance types below
      else if (category === "pumps/motors" || category === "mechanical system") {
        assignedCategoryKey = EQUIPMENT_CATEGORIES.MOTORS_PUMPS
      }
      // Priority 2: Keyword checks in equipment_type as fallback
      else if (
        type.includes("ventilation") ||
        type.includes("exhaust fan") ||
        type.includes("ventilator") ||
        type.includes("ceiling fan") ||
        type.includes("fan")
      ) {
        assignedCategoryKey = EQUIPMENT_CATEGORIES.VENTILATION
      } else if (
        type.includes("cool") ||
        type.includes("furnace") ||
        type.includes("air conditioner") ||
        type.includes(" ac") ||
        type.includes("heat")
      ) {
        assignedCategoryKey = EQUIPMENT_CATEGORIES.HVAC
      } else if (
        type.includes("light") ||
        type.includes("lamp") ||
        type.includes("fixture") ||
        type.includes("led") ||
        type.includes("fluorescent") ||
        type.includes("hps") ||
        type.includes("sodium")
      ) {
        assignedCategoryKey = EQUIPMENT_CATEGORIES.LIGHTING
      } else if (type.includes("water heat") || type.includes("storage tank") || type.includes("boiler")) {
        assignedCategoryKey = EQUIPMENT_CATEGORIES.DHW
      } else if (
        type.includes("faucet") ||
        type.includes("shower") ||
        type.includes("toilet") ||
        type.includes("urinal") ||
        type.includes("sink")
      ) {
        assignedCategoryKey = EQUIPMENT_CATEGORIES.WATER_FIXTURES
      } else if (type.includes("pump")) {
        assignedCategoryKey = type.includes("pool") ? EQUIPMENT_CATEGORIES.POOL : EQUIPMENT_CATEGORIES.MOTORS_PUMPS
      } else if (type.includes("motor")) {
        assignedCategoryKey = EQUIPMENT_CATEGORIES.MOTORS_PUMPS
      } else if (type.includes("washer") || type.includes("washing machine") || type.includes("dryer")) {
        assignedCategoryKey = EQUIPMENT_CATEGORIES.LAUNDRY
      } else if (type.includes("sprinkler")) {
        assignedCategoryKey = EQUIPMENT_CATEGORIES.IRRIGATION
      } else if (
        type.includes("refrigerator") ||
        type.includes("freezer") ||
        type.includes("stove") ||
        type.includes("oven") ||
        type.includes("dishwasher") ||
        type.includes("microwave") ||
        type.includes("television")
      ) {
        assignedCategoryKey = EQUIPMENT_CATEGORIES.APPLIANCE
      }
      // --- End Simplified Logic ---

      // Ensure the key exists before pushing
      if (!result[assignedCategoryKey]) {
        result[assignedCategoryKey] = [] // Initialize if somehow missing
      }
      result[assignedCategoryKey].push(item)
    })

    return result
  }, [photos, publicView])

  const filteredCategorizedPhotos = useMemo(() => {
    if (!searchQuery.trim()) {
      return categorizedPhotos
    }

    const query = searchQuery.toLowerCase().trim()
    const result: Record<string, SitePhoto[]> = {}

    Object.keys(categorizedPhotos).forEach((category) => {
      result[category] = categorizedPhotos[category].filter((photo) => {
        // Search in equipment type
        if (photo.equipment_type && photo.equipment_type.toLowerCase().includes(query)) {
          return true
        }
        // Search in category
        if (photo.category && photo.category.toLowerCase().includes(query)) {
          return true
        }
        // Search in location (string or object)
        if (typeof photo.location === "string" && photo.location.toLowerCase().includes(query)) {
          return true
        }
        if (
          typeof photo.location === "object" &&
          photo.location?.room &&
          photo.location.room.toLowerCase().includes(query)
        ) {
          return true
        }
        // Search in manufacturer/model
        if (photo.manufacturer && photo.manufacturer.toLowerCase().includes(query)) {
          return true
        }
        if (photo.model && photo.model.toLowerCase().includes(query)) {
          return true
        }
        // Search in notes
        if (photo.notes && photo.notes.toLowerCase().includes(query)) {
          return true
        }
        return false
      })
    })

    return result
  }, [categorizedPhotos, searchQuery])

  const [showPhotoUpload, setShowPhotoUpload] = useState(false)
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false)

  // Handle photo upload success
  const [refreshKey, setRefreshKey] = useState(0)

  const [hasPending, setHasPending] = useState(true)
  const [pendingCount, setPendingCount] = useState(0)
  const hasPendingRef = useRef(hasPending)
  const pendingCountRef = useRef(pendingCount)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const queryClient = useQueryClient()

  const categories = useMemo(() => {
    const uniqueCategories = new Set<string>()
    photos.forEach((photo) => {
      if (photo.category) {
        uniqueCategories.add(photo.category)
      }
    })
    return Array.from(uniqueCategories)
  }, [photos])

  const handlePhotoUploadSuccess = async () => {
    setShowPhotoUpload(false)
    setIsUploadingPhotos(true)

    try {
      setTimeout(async () => {
        startInterval()
        updatePhotos()
      }, 2000)
    } catch (error) {
      console.error("[PhotosOverview] Error refetching photos data:", error)
    } finally {
      setIsUploadingPhotos(false)
    }
  }

  const updatePhotos = async () => {
    await queryClient.invalidateQueries({ queryKey: ["equipmentAnalysis", projectId] })
    setRefreshKey((prev) => prev + 1)
  }

  useEffect(() => {
    // console.log("Updated allAnalysis:", allAnalysis);

    allAnalysis.forEach((item, index) => {
      // console.log(`Item ${index}:`, item.category, item.id);
    })
  }, [allAnalysis])

  const checkAnalysisCompletion = async () => {
    try {
      const result: any = await photosService.checkAnalysisCompletionProject(projectId)

      // console.log("result?.counts?.waiting", result?.counts?.waiting);
      // console.log("result?.counts?.active", result?.counts?.active);

      let pCount = 0
      if (result?.counts?.waiting) {
        pCount += result?.counts?.waiting
      }
      if (result?.counts?.active) {
        pCount += result?.counts?.active
      }

      if (result?.counts?.waiting === 0 && result?.counts?.active === 0) {
        console.log("No pending or completed analysis")
        stopInterval()
        setHasPending(false)
      }

      if (pendingCountRef.current !== pCount) {
        updatePhotos() // Refresh photos after checking analysis completion
        setPendingCount(pCount)
        pendingCountRef.current = pCount // Keep the ref in sync manually
      }

      console.log("hasPending", hasPending)
      console.log("hasPendingRef", hasPendingRef)
    } catch (error) {
      console.error("[PhotosOverview] Error checking analysis completion:", error)
    }
  }

  // Function to start the interval
  const startInterval = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)

    intervalRef.current = setInterval(() => {
      if (hasPendingRef.current) {
        checkAnalysisCompletion()
      }
    }, 5000)
  }

  // Optional: function to stop interval
  const stopInterval = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  // Start interval when projectId is available
  useEffect(() => {
    if (projectId) {
      startInterval()

      return () => stopInterval() // cleanup on unmount or projectId change
    }
  }, [projectId])

  useEffect(() => {
    pendingCountRef.current = pendingCount
  }, [pendingCount])

  // Handle photo upload success

  // 3. Update renderAllPhotos to iterate through categories
  const renderAllPhotos = () => {
    const categoryOrder = [
      EQUIPMENT_CATEGORIES.HVAC,
      EQUIPMENT_CATEGORIES.LIGHTING,
      EQUIPMENT_CATEGORIES.VENTILATION,
      EQUIPMENT_CATEGORIES.DHW,
      EQUIPMENT_CATEGORIES.APPLIANCE,
      EQUIPMENT_CATEGORIES.LAUNDRY,
      EQUIPMENT_CATEGORIES.POOL,
      EQUIPMENT_CATEGORIES.MOTORS_PUMPS,
      EQUIPMENT_CATEGORIES.WATER_FIXTURES,
      EQUIPMENT_CATEGORIES.IRRIGATION,
      EQUIPMENT_CATEGORIES.OTHER,
    ]

    // Check if there are any photos to display at all after filtering
    const totalPhotosToShow = Object.values(filteredCategorizedPhotos).reduce((sum, arr) => sum + arr.length, 0)

    // console.log("totalPhotosToShow:", totalPhotosToShow);

    if (totalPhotosToShow === 0 && !loading) {
      return (
        <div className="text-center p-8">
          {/* Adjust empty state message based on context */}
          <Camera className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">
            {publicView ? "No identified equipment photos to display." : "No photos found for this project."}
          </p>
          {!publicView && (
            <Button onClick={() => setShowPhotoUpload(true)} className="bg-emerald-500 hover:bg-emerald-600 text-white">
              <Camera className="mr-2 h-4 w-4" />
              Upload Photos
            </Button>
          )}
        </div>
      )
    }

    return (
      <div className="space-y-6">
        {/* Header can remain similar, maybe show total count */}
        <div className="flex flex-wrap justify-between items-center gap-4">
  {/* Left section: Title and Badge */}
  <div className="flex items-center gap-2">
    <h3 className="text-xl font-semibold">Project Photos</h3>
    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
      {totalPhotosToShow} Total
    </Badge>
  </div>

  {/* Center section: Search input */}
  <div className="flex-1 max-w-md mx-auto">
    <SearchInput
      placeholder="Search photos by equipment type, location, etc."
      value={searchQuery}
      onChange={(value) => setSearchQuery(value)}
    />
  </div>

  {/* Right section: Upload button */}
  {!publicView && (
    <div>
      <Button onClick={() => setShowPhotoUpload(true)}>
        <Camera className="w-4 h-4 mr-2" /> Upload Photos
      </Button>
    </div>
  )}
</div>

        
        {/* No results message */}
        {searchQuery.trim() !== "" && totalPhotosToShow === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No photos match your search for "{searchQuery}"</p>
            <Button variant="outline" onClick={() => setSearchQuery("")} className="mt-2">
              Clear Search
            </Button>
          </div>
        )}

        {/* Map through categories and render sections */}
        {categoryOrder.map((categoryKey) => {
          const photosInCategory = filteredCategorizedPhotos[categoryKey]
          if (!photosInCategory || photosInCategory.length === 0) {
            return null // Don't render empty sections
          }

          const categoryInfo = CATEGORY_DETAILS[categoryKey] || {
            title: "Other",
            icon: <AlertCircle className="w-5 h-5" />,
          }

          return (
            <div key={categoryKey} className="space-y-3 border-t pt-4">
              {/* Category Header */}
              <div className="flex items-center gap-2 mb-2">
                {categoryInfo.icon}
                <h4 className="text-lg font-medium">{categoryInfo.title}</h4>
                <Badge variant="secondary">{photosInCategory.length}</Badge>
              </div>

              {/* Photo Grid for the Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {photosInCategory.map((item, index) => (
                  <div
                    key={item.id || index}
                    className="relative group bg-muted/10 rounded-lg overflow-hidden border border-muted/30 hover:shadow-lg transition-all duration-300"
                  >
                    <button
                      onClick={() => setSelectedPhoto(item)}
                      className="relative w-full h-56 overflow-hidden block"
                    >
                      <img
                        src={item.photo_url || item.thumbnail_url}
                        alt={item.equipment_type || `Photo ${index + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>

                    {/* 4. Remove Equipment Detected Badge entirely */}
                    {/* {!publicView && item.has_equipment && (...)} */}

                    <div className="p-3">
                      <p className="font-medium text-sm truncate">{item.equipment_type || `Photo ${index + 1}`}</p>
                      {(item.location || item.category) && (
                        <p className="text-xs text-muted-foreground truncate mt-1">
                          {/* Simplified location display */}
                          {typeof item.location === "string" && item.location.toLowerCase() !== "unknown"
                            ? item.location
                            : typeof item.location === "object" &&
                                item.location?.room &&
                                item.location.room.toLowerCase() !== "unknown"
                              ? item.location.room
                              : ""}
                          {/* Show category only if location was shown */}
                          {item.category &&
                          ((typeof item.location === "string" && item.location.toLowerCase() !== "unknown") ||
                            (typeof item.location === "object" &&
                              item.location?.room &&
                              item.location.room.toLowerCase() !== "unknown"))
                            ? ` • ${item.category}`
                            : item.category || ""}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const renderPhotoDetail = () => {
    if (!selectedPhoto) return null

    console.log('selectedPhoto', selectedPhoto);

    return (
      <Dialog open={!!selectedPhoto} onOpenChange={(open) => !open && setSelectedPhoto(null)}>
        <DialogContent className="max-w-6xl">
          <DialogHeader>
            <DialogTitle className="flex justify-between items-center pr-6">
              <div className="flex items-center gap-3">
                {selectedPhoto.equipment_type || selectedPhoto.category || "Unidentified"}
                {selectedPhoto?.source === "field_notes" && (
                  <Badge variant="outline" className="text-xs bg-blue-50 border-blue-200 text-blue-700">
                    Field Notes
                  </Badge>
                )}
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4 flex flex-col md:flex-row gap-6">
            <div className="md:w-3/5 flex-shrink-0">
              <a
                href={selectedPhoto.photo_url || selectedPhoto.thumbnail_url || ""}
                target="_blank"
                rel="noopener noreferrer"
                title="Click to view full size image"
                className="block border rounded-md overflow-hidden"
              >
                <img
                  src={selectedPhoto.photo_url || selectedPhoto.thumbnail_url || ""}
                  alt={selectedPhoto.equipment_type || "Project Photo"}
                  className="w-full h-auto max-h-[75vh] object-contain cursor-zoom-in"
                />
              </a>
            </div>
            <div className="md:w-2/5 flex-shrink-0 space-y-4 overflow-y-auto max-h-[75vh] pr-2">
              <dl className="divide-y divide-border">
                <div className="py-2 flex justify-between">
                  <dt className="text-sm font-medium text-muted-foreground">Equipment Type</dt>
                  <dd className="text-sm text-right">{selectedPhoto.equipment_type || "N/A"}</dd>
                </div>
                <div className="py-2 flex justify-between">
                  <dt className="text-sm font-medium text-muted-foreground">Category</dt>
                  <dd className="text-sm text-right">{selectedPhoto.category || "N/A"}</dd>
                </div>
                {(() => {
                  const locValue = selectedPhoto.location
                  const displayLoc = typeof locValue === "string" ? locValue : locValue?.room
                  return displayLoc && displayLoc.toLowerCase() !== "unknown" && displayLoc.toLowerCase() !== "n/a" ? (
                    <div className="py-2 flex justify-between">
                      <dt className="text-sm font-medium text-muted-foreground">Location</dt>
                      <dd className="text-sm text-right">{displayLoc}</dd>
                    </div>
                  ) : null
                })()}
                {(() => {
                  const make = selectedPhoto.manufacturer
                  const model = selectedPhoto.model
                  const displayMakeModel = `${make || ""} ${model || ""}`.trim()
                  return displayMakeModel &&
                    displayMakeModel.toLowerCase() !== "unknown" &&
                    displayMakeModel.toLowerCase() !== "n/a" ? (
                    <div className="py-2 flex justify-between">
                      <dt className="text-sm font-medium text-muted-foreground">Make/Model</dt>
                      <dd className="text-sm text-right">{displayMakeModel}</dd>
                    </div>
                  ) : null
                })()}
                {selectedPhoto.serial_number &&
                  selectedPhoto.serial_number.toLowerCase() !== "unknown" &&
                  selectedPhoto.serial_number.toLowerCase() !== "n/a" && (
                    <div className="py-2 flex justify-between">
                      <dt className="text-sm font-medium text-muted-foreground">Serial Number</dt>
                      <dd className="text-sm text-right">{selectedPhoto.serial_number}</dd>
                    </div>
                  )}
                {selectedPhoto.capacity &&
                  selectedPhoto.capacity.toLowerCase() !== "unknown" &&
                  selectedPhoto.capacity.toLowerCase() !== "n/a" && (
                    <div className="py-2 flex justify-between">
                      <dt className="text-sm font-medium text-muted-foreground">Capacity</dt>
                      <dd className="text-sm text-right">{selectedPhoto.capacity}</dd>
                    </div>
                  )}
                {selectedPhoto.wattage != null && (
                  <div className="py-2 flex justify-between">
                    <dt className="text-sm font-medium text-muted-foreground">Wattage</dt>
                    <dd className="text-sm text-right">{selectedPhoto.wattage} W</dd>
                  </div>
                )}
                {selectedPhoto.annual_kwh != null && (
                  <div className="py-2 flex justify-between">
                    <dt className="text-sm font-medium text-muted-foreground">Annual Energy</dt>
                    <dd className="text-sm text-right">{selectedPhoto.annual_kwh} kWh/yr</dd>
                  </div>
                )}
                {selectedPhoto.weekly_hours && (
                  <div className="py-2 flex justify-between">
                    <dt className="text-sm font-medium text-muted-foreground">Weekly Hours</dt>
                    <dd className="text-sm text-right">{selectedPhoto.weekly_hours}</dd>
                  </div>
                )}
                {selectedPhoto.energy_source && (
                  <div className="py-2 flex justify-between">
                    <dt className="text-sm font-medium text-muted-foreground">Energy Source</dt>
                    <dd className="text-sm text-right">{selectedPhoto.energy_source}</dd>
                  </div>
                )}
                {!publicView && (
                  <>
                    <div className="py-2 flex justify-between">
                      <dt className="text-sm font-medium text-muted-foreground">Confidence</dt>
                      <dd className="text-sm text-right">
                        {selectedPhoto.confidence ? `${(selectedPhoto.confidence * 100).toFixed(1)}%` : "N/A"}
                      </dd>
                    </div>
                    <div className="py-2 flex justify-between">
                      <dt className="text-sm font-medium text-muted-foreground">AI Model</dt>
                      <dd className="text-sm text-right">{selectedPhoto.ai_model || "N/A"}</dd>
                    </div>
                  </>
                )}
                {!publicView && selectedPhoto.created_at && (
                  <div className="py-2 flex justify-between">
                    <dt className="text-sm font-medium text-muted-foreground">Uploaded</dt>
                    <dd className="text-sm text-right">{new Date(selectedPhoto.created_at).toLocaleString()}</dd>
                  </div>
                )}
              </dl>

              {selectedPhoto.specifications &&
                Object.values(selectedPhoto.specifications).some(
                  (val) => val && String(val).toLowerCase() !== "n/a",
                ) && (
                  <div className="pt-3 mt-3 border-t">
                    <h4 className="text-base font-semibold mb-2">Specifications</h4>
                    <dl className="space-y-1 text-xs">
                      {selectedPhoto.specifications.phase &&
                        selectedPhoto.specifications.phase.toLowerCase() !== "n/a" && (
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">Phase:</dt>{" "}
                            <dd>{selectedPhoto.specifications.phase}</dd>
                          </div>
                        )}
                      {selectedPhoto.specifications.voltage &&
                        selectedPhoto.specifications.voltage.toLowerCase() !== "n/a" && (
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">Voltage:</dt>{" "}
                            <dd>{selectedPhoto.specifications.voltage}</dd>
                          </div>
                        )}
                      {selectedPhoto.specifications.capacity &&
                        selectedPhoto.specifications.capacity.toLowerCase() !== "n/a" && (
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">Rated Cap:</dt>{" "}
                            <dd>{selectedPhoto.specifications.capacity}</dd>
                          </div>
                        )}
                      {selectedPhoto.specifications.refrigerantType &&
                        selectedPhoto.specifications.refrigerantType.toLowerCase() !== "n/a" && (
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">Refrigerant:</dt>{" "}
                            <dd>{selectedPhoto.specifications.refrigerantType}</dd>
                          </div>
                        )}
                      {selectedPhoto.specifications.efficiency?.cooling && (
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Cooling Eff:</dt>{" "}
                          <dd>{selectedPhoto.specifications.efficiency.cooling}</dd>
                        </div>
                      )}
                      {selectedPhoto.specifications.efficiency?.heating && (
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Heating Eff:</dt>{" "}
                          <dd>{selectedPhoto.specifications.efficiency.heating}</dd>
                        </div>
                      )}
                    </dl>
                  </div>
                )}

              {selectedPhoto.condition &&
                Object.values(selectedPhoto.condition).some(
                  (val) => val && String(val).toLowerCase() !== "unknown",
                ) && (
                  <div className="pt-3 mt-3 border-t">
                    <h4 className="text-base font-semibold mb-2">Condition</h4>
                    <dl className="space-y-1 text-xs">
                      {selectedPhoto.condition.overall &&
                        selectedPhoto.condition.overall.toLowerCase() !== "unknown" && (
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">Overall:</dt>{" "}
                            <dd>{selectedPhoto.condition.overall}</dd>
                          </div>
                        )}
                      {selectedPhoto.condition.estimatedAge &&
                        selectedPhoto.condition.estimatedAge.toLowerCase() !== "unknown" && (
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">Est. Age:</dt>{" "}
                            <dd>{selectedPhoto.condition.estimatedAge}</dd>
                          </div>
                        )}
                      {selectedPhoto.condition.visibleIssues?.length > 0 && (
                        <div className="flex flex-col">
                          <dt className="text-muted-foreground mb-1">Issues:</dt>{" "}
                          <dd>{selectedPhoto.condition.visibleIssues.join(", ")}</dd>
                        </div>
                      )}
                    </dl>
                  </div>
                )}

              {selectedPhoto.notes && (
                <div className="pt-3 mt-3 border-t">
                  <h4 className="text-base font-semibold mb-2">Notes</h4>
                  <p className="text-sm bg-muted/50 p-2 rounded">{selectedPhoto.notes}</p>
                </div>
              )}

              {selectedPhoto.recommendations && (
                <div className="pt-3 mt-3 border-t">
                  <dt className="text-base font-semibold mb-2">Recommendations</dt>
                  <dd className="text-sm bg-muted/50 p-2 rounded">{selectedPhoto.recommendations}</dd>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-2"></div>
        <span>Loading photos...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20 flex items-start gap-3">
          <div className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5">⚠️</div>
          <p className="text-destructive">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 px-6">
      {" "}
      {/* Added padding */}
      {/* Photo upload dialog */}
      <Dialog
        open={showPhotoUpload}
        onOpenChange={(open) => {
          setShowPhotoUpload(open)
          if (!open) setIsUploadingPhotos(false)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Project Photos</DialogTitle>
          </DialogHeader>
          <PhotoUploadForm
            projectId={projectId}
            onSuccess={handlePhotoUploadSuccess}
            onCancel={() => setShowPhotoUpload(false)}
          />
        </DialogContent>
      </Dialog>
      {/* Photo detail dialog */}
      {renderPhotoDetail()}
      {/* Main content */}
      {loading ? (
        <div className="flex justify-center items-center h-56">
          <Loader2 className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
        </div>
      ) : error ? (
        <div className="text-center p-8">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={() => fetchPhotosData()}>Retry</Button>
        </div>
      ) : (
        // renderAllPhotos()
        <div key={refreshKey}>{renderAllPhotos()}</div>
      )}
    </div>
  )
}
