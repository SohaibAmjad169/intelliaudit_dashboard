import React from "react";
import { getProject } from "@/services/projects";
import { equipmentV2Service } from "@/services/equipment/equipment-v2";
import { fetchEquipmentData } from "@/services/energy-analysis";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ExistingConditionsAndObservationsProps {
  projectId: string;
}

interface HVACEquipment {
  type: string;
  units: number;
  location: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  year: string;
  coolingCapacity: string;
  coolingEfficiency: string;
  heatingCapacity: string;
  heatingEfficiency: string;
  fuelType: string;
  wattage?: number;
  weekly_hours?: number;
  annual_kwh?: number;
  end_use_category?: string;
  category?: string;
}

interface LightingEquipment {
  location: string;
  fixtures: number;
  lampsPerFixture: number;
  lampType: string;
  lampWatts: number | string;
  control: string;
  number_of_lamps?: number;
  wattage?: number;
  weekly_hours?: number;
  annual_kwh?: number;
  equipment_type?: string;
  end_use_category?: string;
}

interface HotWaterEquipment {
  description: string;
  units: number;
  location: string;
  year: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  capacity: string;
  efficiency: string | number;
  pipeInsulation: string;
  wattage?: number;
  weekly_hours?: number;
  annual_kwh?: number;
  end_use_category?: string;
}

interface KitchenAppliance {
  type: string;
  units: number;
  location: string;
  fuel: string;
  manufacturer?: string;
  model?: string;
}

interface LaundryEquipment {
  type: string;
  units: number;
  style: string;
  location: string;
  provider: string;
}

// Define equipment categories constants for classification
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
  OTHER: "other",
};

export function ExistingConditionsAndObservations({
  projectId,
}: ExistingConditionsAndObservationsProps) {
  const [projectData, setProjectData] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [dataIsPlaceholder, setDataIsPlaceholder] = React.useState(false);

  React.useEffect(() => {
    const fetchAllData = async () => {
      try {
        setIsLoading(true);

        // Fetch project data
        const data = await getProject(projectId);
        const project = Array.isArray(data) ? data[0] : data;
        console.log("Project data:", project);

        setProjectData(project);

        // Try to fetch equipment data from multiple sources
        let equipmentData: any[] = [];

        try {
          console.log(
            "Attempting to fetch equipment data from equipmentV2Service..."
          );
          // Try the V2 equipment service first
          const equipmentV2 = await equipmentV2Service.getAllEquipment(
            projectId
          );
          if (equipmentV2 && equipmentV2.length > 0) {
            console.log("Found equipment data from V2 service:", equipmentV2);

            // Sort equipment by source type (field notes first), then category and type - same as Equipment.tsx
            const sortedData = [...equipmentV2].sort((a, b) => {
              // First sort by source type (field notes first)
              if (
                a.source_type === "field_notes" &&
                b.source_type !== "field_notes"
              )
                return -1;
              if (
                a.source_type !== "field_notes" &&
                b.source_type === "field_notes"
              )
                return 1;

              // Then sort by category
              const categoryCompare = (a.category || "").localeCompare(
                b.category || ""
              );
              if (categoryCompare !== 0) return categoryCompare;

              // Finally sort by equipment type
              return (a.equipment_type || "").localeCompare(
                b.equipment_type || ""
              );
            });

            equipmentData = sortedData;
          } else {
            console.log(
              "No equipment data found from V2 service, trying energy analysis service..."
            );
            // Try the energy analysis service
            const energyEquipment = await fetchEquipmentData(projectId);
            if (energyEquipment && energyEquipment.length > 0) {
              console.log(
                "Found equipment data from energy analysis service:",
                energyEquipment
              );
              equipmentData = energyEquipment;
            } else {
              console.log(
                "No equipment data found from energy analysis service either."
              );
            }
          }
        } catch (equipmentError) {
          console.error("Error fetching equipment data:", equipmentError);
        }

        // Store equipment data in project data
        if (equipmentData.length > 0) {
          console.log(
            `Found ${equipmentData.length} equipment items to store in project data`
          );
          setProjectData((prevData: any) => ({
            ...prevData,
            equipmentList: equipmentData,
          }));
        } else {
          console.warn("No equipment data found from any source!");
        }

        // Check if we have real data for key fields
        const hasRealData = !!(
          project?.property_address ||
          project?.address ||
          project?.property_gross_floor_area ||
          project?.square_footage ||
          project?.building_sqft ||
          equipmentData.length > 0
        );

        setDataIsPlaceholder(!hasRealData);
      } catch (err) {
        setError("Failed to load project data");
        console.error("Error fetching project data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (projectId) {
      fetchAllData();
    }
  }, [projectId]);

  // Format address information
  const getAddress = () => {
    if (!projectData) return "No data available";
    return (
      projectData.property_address || projectData.address || "No data available"
    );
  };

  const getCity = () => {
    if (!projectData) return "No data available";
    return projectData.property_city || projectData.city || "No data available";
  };

  const getState = () => {
    if (!projectData) return "No data available";
    return (
      projectData.property_state || projectData.state || "No data available"
    );
  };

  const getZipCode = () => {
    if (!projectData) return "No data available";
    return (
      projectData.property_zip || projectData.zip_code || "No data available"
    );
  };

  // Get building information
  const getBuildingYear = () => {
    if (!projectData) return "No data available";
    return (
      projectData.year_built || projectData.building_year || "No data available"
    );
  };

  const getSquareFootage = () => {
    if (!projectData) return "No data available";
    return (
      projectData.property_gross_floor_area ||
      projectData.square_footage ||
      projectData.building_sqft ||
      "No data available"
    );
  };

  const getParkingSquareFootage = () => {
    if (!projectData) return "No data available";
    return (
      projectData.parking_sqft || projectData.garage_sqft || "No data available"
    );
  };

  const getApartmentCount = () => {
    if (!projectData?.unit_count) {
      return {
        oneBedroom: projectData?.one_bedroom_count || "No data available",
        oneBedroomLoft:
          projectData?.one_bedroom_loft_count || "No data available",
      };
    }

    return {
      oneBedroom: projectData.one_bedroom_count || "No data available",
      oneBedroomLoft: projectData.one_bedroom_loft_count || "No data available",
    };
  };

  // Replace getHVACEquipment with a more robust categorization approach
  const categorizeEquipment = () => {
    if (!projectData) return {};

    console.log("Starting equipment categorization");

    // Check all possible property names where equipment data might be stored
    const possibleEquipmentLists = [
      projectData.equipmentList,
      projectData.equipment_list,
      projectData.equipment,
      projectData.hvacEquipment,
      projectData.hvac_equipment,
      projectData.hvac,
      projectData.hvacSystems,
      projectData.hvac_systems,
      projectData.systems?.hvac,
      projectData.field_notes?.equipment,
    ];

    // Log which potential equipment lists exist
    possibleEquipmentLists.forEach((list, index) => {
      const sources = [
        "equipmentList",
        "equipment_list",
        "equipment",
        "hvacEquipment",
        "hvac_equipment",
        "hvac",
        "hvacSystems",
        "hvac_systems",
        "systems.hvac",
        "field_notes.equipment",
      ];
      if (Array.isArray(list)) {
        console.log(
          `Found equipment list in projectData.${sources[index]}: ${list.length} items`
        );
      }
    });

    // Find the first non-empty equipment list
    const equipmentList =
      possibleEquipmentLists.find(
        (list) => Array.isArray(list) && list.length > 0
      ) || [];

    if (equipmentList.length === 0) {
      console.log(
        "No equipment data found in project data. Project data keys:",
        Object.keys(projectData || {})
      );
      return {};
    }

    console.log(`Processing ${equipmentList.length} items in equipment list`);

    // Initialize with empty arrays for each category
    const result: Record<string, any[]> = {
      [EQUIPMENT_CATEGORIES.HVAC]: [],
      [EQUIPMENT_CATEGORIES.LIGHTING]: [],
      [EQUIPMENT_CATEGORIES.VENTILATION]: [],
      [EQUIPMENT_CATEGORIES.DHW]: [],
      [EQUIPMENT_CATEGORIES.WATER_FIXTURES]: [],
      [EQUIPMENT_CATEGORIES.POOL]: [],
      [EQUIPMENT_CATEGORIES.LAUNDRY]: [],
      [EQUIPMENT_CATEGORIES.IRRIGATION]: [],
      [EQUIPMENT_CATEGORIES.APPLIANCE]: [],
      [EQUIPMENT_CATEGORIES.OTHER]: [],
    };

    // Process each equipment item and place it in exactly one category
    equipmentList.forEach((item) => {
      const type = (item.equipment_type || item.type || "").toLowerCase();
      const category = (item.category || "").toLowerCase();
      const endUseCategory = (item.end_use_category || "").toLowerCase();

      // Check for water fixtures by type (highest priority)
      if (
        type.includes("faucet") ||
        type.includes("shower") ||
        type.includes("showerhead") ||
        type.includes("toilet") ||
        type.includes("urinal") ||
        type.includes("lavatory") ||
        type.includes("sink") ||
        type.includes("pre-rinse") ||
        type.includes("pre rinse") ||
        type.includes("spray valve") ||
        type.includes("water fixture")
      ) {
        console.log("Moving to Water Fixtures:", {
          id: item.id,
          type: type,
          category: category,
          endUseCategory: endUseCategory,
        });

        result[EQUIPMENT_CATEGORIES.WATER_FIXTURES].push(item);
        return;
      }

      // Also check for water fixtures in the category field
      if (
        category === "water fixtures" ||
        category === "water fixture" ||
        category === "plumbing fixtures" ||
        category === "plumbing fixture"
      ) {
        result[EQUIPMENT_CATEGORIES.WATER_FIXTURES].push(item);
        return;
      }

      // First check end_use_category as it's the most reliable indicator
      if (endUseCategory === "lighting") {
        result[EQUIPMENT_CATEGORIES.LIGHTING].push(item);
        return;
      } else if (
        endUseCategory === "water heating" ||
        endUseCategory === "dhw"
      ) {
        result[EQUIPMENT_CATEGORIES.DHW].push(item);
        return;
      } else if (
        endUseCategory === "water fixtures" ||
        endUseCategory === "plumbing fixtures"
      ) {
        result[EQUIPMENT_CATEGORIES.WATER_FIXTURES].push(item);
        return;
      } else if (endUseCategory === "ventilation") {
        result[EQUIPMENT_CATEGORIES.VENTILATION].push(item);
        return;
      } else if (
        endUseCategory === "hvac" ||
        endUseCategory === "cooling" ||
        endUseCategory === "heating"
      ) {
        result[EQUIPMENT_CATEGORIES.HVAC].push(item);
        return;
      }

      // If end_use_category doesn't help, fall back to category and type checks
      // Check against each category in priority order
      if (
        type.includes("ventilation") ||
        type.includes("exhaust fan") ||
        type.includes("ventilator") ||
        type.includes("air handler") ||
        type.includes("erv") ||
        type.includes("hrv") ||
        (type.includes("fan") && !type.includes("ceiling fan"))
      ) {
        result[EQUIPMENT_CATEGORIES.VENTILATION].push(item);
        return;
      } else if (
        category.includes("hvac") ||
        type.includes("cool") ||
        type.includes("hvac") ||
        type.includes("furnace") ||
        (type.includes("heat") && !type.includes("water heat")) ||
        type.includes("split system")
      ) {
        result[EQUIPMENT_CATEGORIES.HVAC].push(item);
        return;
      } else if (
        category.includes("lighting") ||
        type.includes("light") ||
        type.includes("lamp") ||
        type.includes("fixture") ||
        type.includes("led") ||
        type.includes("fluorescent") ||
        type.includes("sconce") ||
        type.includes("wall pack")
      ) {
        result[EQUIPMENT_CATEGORIES.LIGHTING].push(item);
        return;
      } else if (
        category.includes("dhw") ||
        type.includes("water heat") ||
        type.includes("dhw") ||
        type.includes("hot water") ||
        (type.includes("boiler") &&
          (item.serves || "").toLowerCase().includes("hot water"))
      ) {
        result[EQUIPMENT_CATEGORIES.DHW].push(item);
        return;
      } else if (
        category.includes("water fixture") ||
        category.includes("plumbing fixture") ||
        type.includes("faucet") ||
        type.includes("shower") ||
        type.includes("showerhead") ||
        type.includes("toilet") ||
        type.includes("urinal") ||
        type.includes("lavatory") ||
        type.includes("sink") ||
        type.includes("pre-rinse") ||
        type.includes("pre rinse") ||
        type.includes("spray valve")
      ) {
        result[EQUIPMENT_CATEGORIES.WATER_FIXTURES].push(item);
        return;
      } else if (
        category.includes("pool equipment") ||
        type.includes("pool") ||
        type.includes("filter") ||
        type.includes("pump")
      ) {
        result[EQUIPMENT_CATEGORIES.POOL].push(item);
        return;
      } else if (
        category.includes("laundry") ||
        type.includes("washer") ||
        type.includes("dryer") ||
        type.includes("laundry") // Add this check for 'laundry' in the type
      ) {
        result[EQUIPMENT_CATEGORIES.LAUNDRY].push(item);
        return;
      } else if (
        category.includes("irrigation") ||
        type.includes("sprinkler") ||
        type.includes("drip") ||
        type.includes("irrigation")
      ) {
        result[EQUIPMENT_CATEGORIES.IRRIGATION].push(item);
        return;
      } else if (
        category.includes("appliance") ||
        type.includes("refrigerator") ||
        type.includes("stove") ||
        type.includes("oven") ||
        type.includes("dishwasher")
      ) {
        result[EQUIPMENT_CATEGORIES.APPLIANCE].push(item);
        return;
      }
      // Other category as catch-all
      else {
        result[EQUIPMENT_CATEGORIES.OTHER].push(item);
      }
    });

    // Log the result of categorization
    Object.entries(result).forEach(([category, items]) => {
      console.log(`Category ${category}: ${items.length} items`);
    });

    return result;
  };

  // Create helper function to format HVAC equipment for the table
  const formatHVACEquipment = (hvacItems: any[]): HVACEquipment[] => {
    if (!hvacItems || hvacItems.length === 0) return [];

    return hvacItems.map((eq) => {
      // Try to map the equipment data to our interface, checking various possible property names
      const capacity =
        eq.capacity ||
        eq.rated_power ||
        eq.specifications?.capacity ||
        eq.wattage;
      const capacityUnit =
        eq.capacityUnit ||
        eq.rated_power_unit ||
        eq.specifications?.capacityUnit;

      let coolingCapacity =
        eq.coolingCapacity ||
        eq.cooling_capacity ||
        eq.capacity_cooling ||
        eq.cooling_tons ||
        eq.specifications?.cooling_capacity ||
        capacity;

      if (coolingCapacity && !isNaN(Number(coolingCapacity))) {
        if (capacityUnit === "kW" || capacityUnit === "kBtu/hr") {
          coolingCapacity = `${coolingCapacity} ${capacityUnit}`;
        } else if (
          typeof coolingCapacity === "number" &&
          coolingCapacity < 20
        ) {
          // Likely in tons if under 20
          coolingCapacity = `${coolingCapacity} tons`;
        } else {
          coolingCapacity = `${coolingCapacity} Btu/hr`;
        }
      }

      // Handle efficiency values
      let coolingEfficiency =
        eq.coolingEfficiency ||
        eq.cooling_efficiency ||
        eq.efficiency_cooling ||
        eq.seer ||
        eq.specifications?.cooling_efficiency ||
        eq.efficiency;

      if (coolingEfficiency && !isNaN(Number(coolingEfficiency))) {
        const effUnit = eq.efficiencyUnit || "";
        if (effUnit) {
          coolingEfficiency = `${coolingEfficiency} ${effUnit}`;
        } else if (coolingEfficiency < 30) {
          // Likely SEER if under 30
          coolingEfficiency = `${coolingEfficiency} SEER`;
        }
      }

      // Get heating capacity
      let heatingCapacity =
        eq.heatingCapacity ||
        eq.heating_capacity ||
        eq.capacity_heating ||
        eq.heating_btu ||
        eq.specifications?.heating_capacity;

      if (heatingCapacity && !isNaN(Number(heatingCapacity))) {
        if (heatingCapacity >= 1000) {
          heatingCapacity = `${heatingCapacity / 1000} kBtu/hr`;
        } else {
          heatingCapacity = `${heatingCapacity} Btu/hr`;
        }
      }

      const result = {
        type:
          eq.type ||
          eq.equipment_type ||
          eq.deviceType ||
          eq.device_type ||
          eq.category ||
          "No data available",
        units: eq.units || eq.count || eq.quantity || eq.number_of_units || 0,
        location:
          eq.location ||
          eq.area ||
          eq.position ||
          eq.install_location ||
          "No data available",
        manufacturer:
          eq.manufacturer ||
          eq.brand ||
          eq.make ||
          eq.manufacturer_name ||
          "No data available",
        model:
          eq.model || eq.model_number || eq.model_no || "No data available",
        serialNumber:
          eq.serialNumber ||
          eq.serial ||
          eq.serial_number ||
          eq.serial_no ||
          "No data available",
        year:
          eq.year ||
          eq.year_installed ||
          eq.installation_year ||
          eq.mfg_year ||
          eq.installedYear?.toString() ||
          eq.age?.toString() ||
          "No data available",
        coolingCapacity: coolingCapacity || "No data available",
        coolingEfficiency: coolingEfficiency || "No data available",
        heatingCapacity: heatingCapacity || "No data available",
        heatingEfficiency:
          eq.heatingEfficiency ||
          eq.heating_efficiency ||
          eq.efficiency_heating ||
          eq.hspf ||
          eq.cop ||
          "No data available",
        fuelType:
          eq.fuelType ||
          eq.fuel ||
          eq.fuel_type ||
          eq.energy_source ||
          "No data available",
        // Add the new properties
        wattage: eq.wattage || eq.watts || eq.power || undefined,
        weekly_hours: eq.weekly_hours || eq.hours_per_week || undefined,
        annual_kwh: eq.annual_kwh || eq.kWh_per_year || undefined,
        end_use_category: eq.end_use_category || eq.category || undefined,
      };

      console.log("Processed HVAC equipment item:", {
        type: result.type,
        manufacturer: result.manufacturer,
        model: result.model,
      });

      return result;
    });
  };

  // Replace the getHVACEquipment function with the new version that uses categorization
  const getHVACEquipment = (): HVACEquipment[] => {
    if (!projectData) return [];

    console.log("getHVACEquipment: Starting HVAC equipment search");

    // Check all possible property names where equipment data might be stored
    const possibleEquipmentLists = [
      projectData.equipmentList,
      projectData.equipment_list,
      projectData.hvacEquipment,
      projectData.hvac_equipment,
      projectData.equipment,
      projectData.hvac,
      projectData.hvacSystems,
      projectData.hvac_systems,
      projectData.systems?.hvac,
      projectData.field_notes?.equipment,
    ];

    // Log which potential equipment lists exist
    possibleEquipmentLists.forEach((list, index) => {
      const sources = [
        "equipmentList",
        "equipment_list",
        "hvacEquipment",
        "hvac_equipment",
        "equipment",
        "hvac",
        "hvacSystems",
        "hvac_systems",
        "systems.hvac",
        "field_notes.equipment",
      ];
      if (Array.isArray(list)) {
        console.log(
          `Found equipment list in projectData.${sources[index]}: ${list.length} items`
        );
      }
    });

    // Find the first non-empty equipment list
    const equipmentList =
      possibleEquipmentLists.find(
        (list) => Array.isArray(list) && list.length > 0
      ) || [];

    if (equipmentList.length > 0) {
      console.log(`Processing ${equipmentList.length} items in equipment list`);

      // Filter for HVAC equipment using the same categorization logic as in Equipment.tsx
      const hvacOnlyList = equipmentList.filter((eq: any) => {
        // Get properties for categorization
        const type = (eq.equipment_type || eq.type || "").toLowerCase();
        const category = (eq.category || "").toLowerCase();
        const endUseCategory = (eq.end_use_category || "").toLowerCase();

        // First check end_use_category as it's the most reliable indicator
        if (
          endUseCategory === "hvac" ||
          endUseCategory === "cooling" ||
          endUseCategory === "heating"
        ) {
          console.log(
            "Found HVAC by end_use_category:",
            eq.equipment_type || eq.type
          );
          return true;
        }

        // If end_use_category doesn't help, fall back to category and type checks
        if (category.includes("hvac")) {
          console.log("Found HVAC by category:", eq.equipment_type || eq.type);
          return true;
        }

        // Finally check equipment type for HVAC indicators
        const isHvacByType =
          type.includes("hvac") ||
          type.includes("cool") ||
          type.includes("air condition") ||
          type.includes("furnace") ||
          (type.includes("heat") && !type.includes("water heat")) ||
          type.includes("split system");

        if (isHvacByType) {
          console.log("Found HVAC by type:", eq.equipment_type || eq.type);
        }

        return isHvacByType;
      });

      if (hvacOnlyList.length === 0) {
        console.log("No HVAC equipment found in equipment list");
        return [];
      }

      console.log(`Found ${hvacOnlyList.length} HVAC equipment items`);

      return hvacOnlyList.map((eq: any) => {
        // Process cooling capacity
        let coolingCapacity =
          eq.coolingCapacity ||
          eq.cooling_capacity ||
          eq.capacity_cooling ||
          eq.cooling_tons ||
          eq.specifications?.cooling_capacity ||
          eq.capacity;

        if (coolingCapacity && !isNaN(Number(coolingCapacity))) {
          const capacityUnit =
            eq.capacityUnit || eq.specifications?.capacityUnit;
          if (capacityUnit === "kW" || capacityUnit === "kBtu/hr") {
            coolingCapacity = `${coolingCapacity} ${capacityUnit}`;
          } else if (
            typeof coolingCapacity === "number" &&
            coolingCapacity < 20
          ) {
            // Likely in tons if under 20
            coolingCapacity = `${coolingCapacity} tons`;
          } else {
            coolingCapacity = `${coolingCapacity} Btu/hr`;
          }
        }

        // Process cooling efficiency
        let coolingEfficiency =
          eq.coolingEfficiency ||
          eq.cooling_efficiency ||
          eq.efficiency_cooling ||
          eq.seer ||
          eq.specifications?.cooling_efficiency ||
          eq.efficiency;

        if (coolingEfficiency && !isNaN(Number(coolingEfficiency))) {
          const effUnit = eq.efficiencyUnit || "";
          if (effUnit) {
            coolingEfficiency = `${coolingEfficiency} ${effUnit}`;
          } else if (coolingEfficiency < 30) {
            // Likely SEER if under 30
            coolingEfficiency = `${coolingEfficiency} SEER`;
          }
        }

        // Process heating capacity
        let heatingCapacity =
          eq.heatingCapacity ||
          eq.heating_capacity ||
          eq.capacity_heating ||
          eq.heating_btu ||
          eq.specifications?.heating_capacity;

        if (heatingCapacity && !isNaN(Number(heatingCapacity))) {
          if (heatingCapacity >= 1000) {
            heatingCapacity = `${heatingCapacity / 1000} kBtu/hr`;
          } else {
            heatingCapacity = `${heatingCapacity} Btu/hr`;
          }
        }

        // Build final object
        const result = {
          type:
            eq.type ||
            eq.equipment_type ||
            eq.deviceType ||
            eq.device_type ||
            eq.category ||
            "No data available",
          units: eq.units || eq.count || eq.quantity || eq.number_of_units || 0,
          location:
            eq.location ||
            eq.area ||
            eq.position ||
            eq.install_location ||
            "No data available",
          manufacturer:
            eq.manufacturer ||
            eq.brand ||
            eq.make ||
            eq.manufacturer_name ||
            "No data available",
          model:
            eq.model || eq.model_number || eq.model_no || "No data available",
          serialNumber:
            eq.serialNumber ||
            eq.serial ||
            eq.serial_number ||
            eq.serial_no ||
            "No data available",
          year:
            eq.year ||
            eq.year_installed ||
            eq.installation_year ||
            eq.mfg_year ||
            eq.installedYear?.toString() ||
            eq.age?.toString() ||
            "No data available",
          coolingCapacity: coolingCapacity || "No data available",
          coolingEfficiency: coolingEfficiency || "No data available",
          heatingCapacity: heatingCapacity || "No data available",
          heatingEfficiency:
            eq.heatingEfficiency ||
            eq.heating_efficiency ||
            eq.efficiency_heating ||
            eq.hspf ||
            eq.cop ||
            "No data available",
          fuelType:
            eq.fuelType ||
            eq.fuel ||
            eq.fuel_type ||
            eq.energy_source ||
            "No data available",
          // Add the new properties
          wattage: eq.wattage || eq.watts || eq.power || undefined,
          weekly_hours: eq.weekly_hours || eq.hours_per_week || undefined,
          annual_kwh: eq.annual_kwh || eq.kWh_per_year || undefined,
          end_use_category: eq.end_use_category || eq.category || undefined,
        };

        console.log(
          `Processed HVAC item: ${result.type}, ${result.manufacturer} ${result.model}`
        );

        return result;
      });
    }

    // Log what we found in the project data to help debug
    console.log(
      "No equipment data found in project data. Project data keys:",
      Object.keys(projectData || {})
    );

    // Return empty array if no data
    return [];
  };

  const getCO2Level = (): string => {
    if (!projectData) return "No data available";

    // Try to get CO2 level from project data - check all possible property names
    return (
      projectData.co2Level ||
      projectData.co2_level ||
      projectData.airQuality?.co2Level ||
      projectData.air_quality?.co2_level ||
      projectData.air_quality?.co2 ||
      projectData.iaq?.co2 ||
      projectData.indoor_air_quality?.co2 ||
      projectData.measurements?.co2 ||
      projectData.field_notes?.airQuality?.co2 ||
      projectData.field_notes?.air_quality?.co2 ||
      "No data available"
    );
  };

  // Function to get lighting equipment using the same categorization logic as Equipment.tsx
  const getLightingEquipment = (): LightingEquipment[] => {
    if (!projectData) return [];

    console.log("getLightingEquipment: Starting lighting equipment search");

    // Check all possible property names where equipment data might be stored
    const possibleEquipmentLists = [
      projectData.equipmentList,
      projectData.equipment_list,
      projectData.equipment,
      projectData.lightingList,
      projectData.lighting_list,
      projectData.lighting,
      projectData.lightingEquipment,
      projectData.lighting_equipment,
      projectData.lightingData,
      projectData.lighting_data,
      projectData.field_notes?.lighting,
      projectData.field_notes?.equipment,
    ];

    // Find the first non-empty equipment list
    const equipmentList =
      possibleEquipmentLists.find(
        (list) => Array.isArray(list) && list.length > 0
      ) || [];

    if (equipmentList.length > 0) {
      console.log(
        `Processing ${equipmentList.length} items in equipment list for lighting`
      );

      // Filter for lighting equipment using the same categorization logic as in Equipment.tsx
      const lightingOnlyList = equipmentList.filter((eq: any) => {
        // Get properties for categorization
        const type = (eq.equipment_type || eq.type || "").toLowerCase();
        const category = (eq.category || "").toLowerCase();
        const endUseCategory = (eq.end_use_category || "").toLowerCase();

        // First check end_use_category as it's the most reliable indicator
        if (endUseCategory === "lighting") {
          return true;
        }

        // If end_use_category doesn't help, fall back to category checks
        if (category.includes("lighting")) {
          return true;
        }

        // Finally check equipment type for lighting indicators
        return (
          type.includes("light") ||
          type.includes("lamp") ||
          type.includes("fixture") ||
          type.includes("bulb") ||
          type.includes("led") ||
          type.includes("fluorescent") ||
          type.includes("cfl") ||
          type.includes("sconce") ||
          type.includes("wall pack")
        );
      });

      if (lightingOnlyList.length === 0) {
        console.log("No lighting equipment found in equipment list");
        return [];
      }

      console.log(`Found ${lightingOnlyList.length} lighting equipment items`);

      // Process each lighting item to match Equipment.tsx data structure
      return lightingOnlyList.map((eq: any) => {
        // Make sure all the fields that Equipment.tsx uses are properly set
        const formattedItem = {
          location: eq.location || "No data available",
          equipment_type: eq.equipment_type || eq.type || "Lighting Fixture",
          lampsPerFixture: eq.lamps_per_fixture || eq.lampsPerFixture || 1,
          fixtures: eq.quantity || eq.count || eq.fixtures || 1,
          number_of_lamps: eq.number_of_lamps || eq.numberOfLamps,
          lampType:
            eq.lamp_type || eq.lampType || eq.bulb_type || "No data available",
          wattage: eq.wattage || eq.watts || eq.lamp_watts || 0,
          weekly_hours:
            eq.weekly_hours || eq.hours_per_week || eq.operating_hours,
          annual_kwh: eq.annual_kwh || eq.kWh_per_year,
          end_use_category: eq.end_use_category || "Lighting",
        };

        // Apply intelligent defaults for weekly hours based on location if missing
        if (!formattedItem.weekly_hours) {
          const location = (formattedItem.location || "").toLowerCase();
          if (
            location.includes("hall") ||
            location.includes("corridor") ||
            location.includes("stair")
          ) {
            formattedItem.weekly_hours = 168; // 24/7 operation
          } else if (
            location.includes("lobby") ||
            location.includes("entrance")
          ) {
            formattedItem.weekly_hours = 84; // 12 hours daily
          } else if (
            location.includes("bathroom") ||
            location.includes("restroom")
          ) {
            formattedItem.weekly_hours = 35; // 5 hours daily
          } else if (location.includes("kitchen")) {
            formattedItem.weekly_hours = 42; // 6 hours daily
          } else {
            formattedItem.weekly_hours = 56; // Default: 8 hours daily
          }
        }

        // Calculate total number of lamps if not directly provided
        if (!formattedItem.number_of_lamps) {
          formattedItem.number_of_lamps =
            formattedItem.fixtures * formattedItem.lampsPerFixture;
        }

        // Calculate annual kWh if not directly provided
        if (!formattedItem.annual_kwh) {
          const totalLamps = formattedItem.number_of_lamps;
          const wattage = formattedItem.wattage;
          const annualHours = Number(formattedItem.weekly_hours) * 52.14; // 52.14 weeks per year
          formattedItem.annual_kwh =
            (totalLamps * wattage * annualHours) / 1000;
        }

        console.log(
          `Processed lighting item: ${formattedItem.equipment_type}, ${formattedItem.location}, ${formattedItem.weekly_hours} hrs/week`
        );

        return formattedItem;
      });
    }

    console.log("No equipment data found for lighting");
    return [];
  };

  const getHotWaterEquipment = (): HotWaterEquipment[] => {
    if (!projectData) return [];

    console.log("getHotWaterEquipment: Starting hot water equipment search");

    // Get the categorized equipment to ensure proper classification
    const categorized = categorizeEquipment();

    // Use only the items that were categorized as DHW
    const dhwItems = categorized[EQUIPMENT_CATEGORIES.DHW] || [];

    console.log(
      `Found ${dhwItems.length} hot water equipment items from categorized equipment`
    );

    if (dhwItems.length > 0) {
      return dhwItems.map((hw: any) => {
        // Format capacity with units if needed
        let capacity =
          hw.capacity ||
          hw.capacity_btu ||
          hw.btu ||
          hw.input ||
          hw.rated_power ||
          hw.specifications?.capacity;
        if (capacity && !isNaN(Number(capacity))) {
          if (capacity >= 1000) {
            capacity = `${capacity / 1000} kBtu`;
          } else {
            capacity = `${capacity} Btu`;
          }
        }

        // Get efficiency
        let efficiency =
          hw.efficiency ||
          hw.efficiency_percent ||
          hw.afue ||
          hw.thermal_efficiency ||
          hw.specifications?.efficiency;
        if (efficiency && !isNaN(Number(efficiency))) {
          // If efficiency is a decimal (like 0.8), convert to percentage
          if (efficiency < 1) {
            efficiency = Math.round(efficiency * 100);
          }
        }

        const result = {
          description:
            hw.description ||
            hw.name ||
            hw.type ||
            hw.equipment_type ||
            "No data available",
          units: hw.units || hw.count || hw.quantity || hw.number_of_units || 1,
          location:
            hw.location ||
            hw.area ||
            hw.position ||
            hw.install_location ||
            "No data available",
          year:
            hw.year ||
            hw.year_installed ||
            hw.installation_year ||
            hw.mfg_year ||
            hw.installedYear?.toString() ||
            hw.age?.toString() ||
            "No data available",
          manufacturer:
            hw.manufacturer ||
            hw.brand ||
            hw.make ||
            hw.manufacturer_name ||
            "No data available",
          model:
            hw.model || hw.model_number || hw.model_no || "No data available",
          serialNumber:
            hw.serialNumber ||
            hw.serial ||
            hw.serial_number ||
            hw.serial_no ||
            "No data available",
          capacity: capacity || "No data available",
          efficiency: efficiency || "No data available",
          pipeInsulation:
            hw.pipeInsulation ||
            hw.pipe_insulation ||
            hw.insulation ||
            "Insulated",
          wattage: hw.wattage || hw.watts || hw.power || undefined,
          weekly_hours: hw.weekly_hours || hw.hours_per_week || undefined,
          annual_kwh: hw.annual_kwh || hw.kWh_per_year || undefined,
          end_use_category: hw.end_use_category || hw.category || undefined,
        };

        console.log(
          `Processed hot water item: ${result.description}, ${result.manufacturer} ${result.model}`
        );

        return result;
      });
    }

    console.log("No DHW equipment found in categorized equipment");
    return [];
  };

  const getKitchenAppliances = (): KitchenAppliance[] => {
    if (!projectData) return [];

    // Check all possible property names where kitchen appliance data might be stored
    const possibleApplianceLists = [
      projectData.kitchenAppliances,
      projectData.kitchen_appliances,
      projectData.appliances,
      projectData.kitchen_equipment,
      projectData.kitchenEquipment,
      projectData.field_notes?.appliances,
    ];

    // Find the first non-empty appliance list
    const applianceList =
      possibleApplianceLists.find(
        (list) => Array.isArray(list) && list.length > 0
      ) || [];

    if (applianceList.length > 0) {
      console.log("Found kitchen appliance list:", applianceList);
      return applianceList.map((app: any) => ({
        type: app.type || app.name || app.appliance_type || "No data available",
        units: app.units || app.count || app.quantity || 0,
        location: app.location || app.area || "No data available",
        fuel:
          app.fuel || app.fuel_type || app.energy_source || "No data available",
        manufacturer:
          app.manufacturer || app.brand || app.make || "No data available",
        model: app.model || app.model_number || "No data available",
      }));
    }

    // No specific appliance data, try to extract from equipment list
    const equipmentList =
      [
        projectData.equipmentList,
        projectData.equipment_list,
        projectData.equipment,
      ].find((list) => Array.isArray(list) && list.length > 0) || [];

    if (equipmentList.length > 0) {
      // Filter for kitchen appliances
      const kitchenEquipment = equipmentList.filter((eq: any) => {
        const type = (
          eq.type ||
          eq.category ||
          eq.equipment_type ||
          ""
        ).toLowerCase();
        return (
          type.includes("oven") ||
          type.includes("range") ||
          type.includes("stove") ||
          type.includes("kitchen") ||
          type.includes("appliance") ||
          type.includes("refrigerator") ||
          type.includes("dishwasher")
        );
      });

      if (kitchenEquipment.length > 0) {
        console.log(
          "Found kitchen equipment in equipment list:",
          kitchenEquipment
        );

        return kitchenEquipment.map((eq: any) => ({
          type: eq.type || eq.name || eq.appliance_type || "No data available",
          units: eq.units || eq.count || eq.quantity || 1,
          location: eq.location || eq.area || "Apartment Units",
          fuel: eq.fuel || eq.fuel_type || eq.energy_source || "Natural Gas",
          manufacturer:
            eq.manufacturer || eq.brand || eq.make || "No data available",
          model: eq.model || eq.model_number || "No data available",
        }));
      }
    }

    // If no data is found, return a basic gas range entry
    console.log("No kitchen appliance data found, creating basic entry");
    return [
      {
        type: "Oven/Range",
        units: 1,
        location: "Apartment Units",
        fuel: "Natural Gas",
        manufacturer: "No data available",
        model: "No data available",
      },
    ];
  };

  const getLaundryEquipment = (): LaundryEquipment[] => {
    if (!projectData) return [];

    console.log("getLaundryEquipment: Starting laundry equipment search");

    // Get the categorized equipment to ensure proper classification
    const categorized = categorizeEquipment();

    // Use only the items that were categorized as LAUNDRY
    const laundryItems = categorized[EQUIPMENT_CATEGORIES.LAUNDRY] || [];

    console.log(
      `Found ${laundryItems.length} laundry equipment items from categorized equipment`
    );

    if (laundryItems.length > 0) {
      return laundryItems.map((eq: any) => {
        // Determine if it's a washer or dryer based on name/type
        const eqType = (
          eq.equipment_type ||
          eq.type ||
          eq.name ||
          ""
        ).toLowerCase();
        const isWasher =
          eqType.includes("washer") || eqType.includes("washing");
        const isDryer = eqType.includes("dryer");

        let type = "No data available";
        let style = "No data available";

        if (isWasher) {
          type = "Washing Machine";
          style = eqType.includes("top") ? "Top-Load" : "Front-Load";
        } else if (isDryer) {
          type = "Dryer";
          style = eqType.includes("top") ? "Top-Load" : "Front-Load";
        } else if (eqType.includes("laundry")) {
          // For general laundry equipment
          type = eq.equipment_type || eq.type || eq.name || "Laundry Equipment";
          style = eq.style || eq.loading_type || "Standard";
        } else {
          type = eq.equipment_type || eq.type || eq.name || "Laundry Equipment";
          style = eq.style || eq.loading_type || "No data available";
        }

        return {
          type,
          units: eq.quantity || eq.units || eq.count || eq.number_of_units || 1,
          style,
          location: eq.location || eq.area || eq.position || "Laundry Room",
          provider: eq.provider || eq.owner || eq.supplier || "Third Party",
        };
      });
    }

    // If no data is found, return basic washer/dryer entries
    console.log(
      "No laundry equipment found in categorized equipment, creating basic entries"
    );
    return [
      {
        type: "Washing Machine",
        units: 6,
        style: "Top-Load",
        location: "Laundry Room",
        provider: "Third Party",
      },
      {
        type: "Dryer",
        units: 6,
        style: "Front-Load",
        location: "Laundry Room",
        provider: "Third Party",
      },
    ];
  };

  React.useEffect(() => {
    // Check if we have any data, if not set placeholder flag
    if (projectData) {
      // Check for equipment data in all possible fields
      const hasEquipmentData = Boolean(
        (projectData.equipmentList && projectData.equipmentList.length > 0) ||
          (projectData.equipment_list &&
            projectData.equipment_list.length > 0) ||
          (projectData.hvacEquipment && projectData.hvacEquipment.length > 0) ||
          (projectData.hvac_equipment &&
            projectData.hvac_equipment.length > 0) ||
          (projectData.equipment && projectData.equipment.length > 0) ||
          (projectData.hvac && projectData.hvac.length > 0) ||
          (projectData.hvacSystems && projectData.hvacSystems.length > 0) ||
          (projectData.hvac_systems && projectData.hvac_systems.length > 0) ||
          (projectData.systems?.hvac && projectData.systems.hvac.length > 0) ||
          (projectData.field_notes?.equipment &&
            projectData.field_notes.equipment.length > 0)
      );

      // Update placeholder status based on data availability
      if (!hasEquipmentData) {
        setDataIsPlaceholder(true);
      }
    } else {
      setDataIsPlaceholder(true);
    }
  }, [projectData]);

  // Create a component to display missing data with highlighting
  const MissingData = () => (
    <span className="bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 px-1 rounded">
      No data available
    </span>
  );

  if (isLoading) {
    return (
      <div className="text-center py-6">Loading building information...</div>
    );
  }

  if (error) {
    return <div className="text-center py-6 text-red-500">Error: {error}</div>;
  }

  const apartments = getApartmentCount();
  const hvacEquipment = getHVACEquipment();
  console.log("HVAC Equipment retrieved for rendering:", hvacEquipment);
  const lightingEquipment = getLightingEquipment();
  console.log("Lighting Equipment retrieved for rendering:", lightingEquipment);
  const hotWaterEquipment = getHotWaterEquipment();
  console.log(
    "Hot Water Equipment retrieved for rendering:",
    hotWaterEquipment
  );
  const waterTemperature =
    projectData?.water_temperature ||
    projectData?.waterTemperature ||
    projectData?.dhw_temperature ||
    "113.1";
  const kitchenAppliances = getKitchenAppliances();
  const laundryEquipment = getLaundryEquipment();

  // Add this function to get water fixtures
  const getWaterFixturesEquipment = () => {
    if (!projectData) return [];

    console.log("getWaterFixturesEquipment: Starting water fixtures search");

    // Get the categorized equipment
    const categorized = categorizeEquipment();

    // Use only the items that were categorized as WATER_FIXTURES
    const waterFixturesItems =
      categorized[EQUIPMENT_CATEGORIES.WATER_FIXTURES] || [];

    console.log(
      `Found ${waterFixturesItems.length} water fixture items from categorized equipment`
    );

    if (waterFixturesItems.length > 0) {
      return waterFixturesItems.map((item: any) => {
        return {
          location:
            item.location ||
            item.area ||
            item.position ||
            item.install_location ||
            "No data available",
          equipment_type:
            item.equipment_type || item.type || "No data available",
          quantity:
            item.quantity ||
            item.count ||
            item.units ||
            item.number_of_units ||
            1,
          end_use_category: item.end_use_category || "Water Fixtures",
        };
      });
    }

    console.log("No water fixtures found in categorized equipment");
    return [];
  };

  // Add this in the variables right before return, after the laundryEquipment const
  const waterFixturesEquipment = getWaterFixturesEquipment();
  console.log(
    "Water Fixtures retrieved for rendering:",
    waterFixturesEquipment
  );

  // Add this function to get pool equipment
  const getPoolEquipment = () => {
    if (!projectData) return [];

    console.log("getPoolEquipment: Starting pool equipment search");

    // Get the categorized equipment
    const categorized = categorizeEquipment();

    // Use only the items that were categorized as POOL
    const poolItems = categorized[EQUIPMENT_CATEGORIES.POOL] || [];

    console.log(
      `Found ${poolItems.length} pool equipment items from categorized equipment`
    );

    if (poolItems.length > 0) {
      return poolItems.map((item: any) => {
        return {
          location:
            item.location ||
            item.area ||
            item.position ||
            item.install_location ||
            "No data available",
          equipment_type:
            item.equipment_type || item.type || "No data available",
          quantity:
            item.quantity ||
            item.count ||
            item.units ||
            item.number_of_units ||
            1,
          wattage: item.wattage || item.watts || item.power || undefined,
          end_use_category: item.end_use_category || "Pool Equipment",
        };
      });
    }

    console.log("No pool equipment found in categorized equipment");
    return [];
  };

  // Add this in the variables right before return, near the waterFixturesEquipment const
  const poolEquipment = getPoolEquipment();
  console.log("Pool Equipment retrieved for rendering:", poolEquipment);

  return (
    <section className="mb-10">
      <h2 className="mb-4 text-lg font-semibold text-foreground">
        D. Existing Conditions and Observations
      </h2>

      {dataIsPlaceholder && (
        <div className="bg-amber-50 dark:bg-amber-900/30 border-l-4 border-amber-500 p-4 mb-6">
          <p className="text-amber-700 dark:text-amber-400">
            <strong>Note:</strong> Some data fields may be missing in this
            report. Missing data is highlighted.
          </p>
        </div>
      )}

      <div className="mb-8 text-sm leading-relaxed text-muted-foreground">
        <div className="relative mb-3">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 dark:from-emerald-900/10 dark:via-blue-900/10 dark:to-purple-900/10 rounded-2xl"></div>
          <div className="p-4 border border-gray-300 dark:border-gray-700 rounded-md relative">
            <h3 className="text-emerald-600 font-medium  mb-4">
              1. General Building Description
            </h3>

            <p className="mb-4 dark:text-gray-300">
              <strong>819 S. Hobart Blvd., Los Angeles, CA 90005</strong> is
              located between James M Wood Boulevard and W 8<sup>th</sup>{" "}
              Street. Built in <strong>1988</strong>, this multifamily housing
              building is comprised of 4 residential floors above grade with 2
              parking levels below grade. The property has a gross floor area of{" "}
              <strong>58,096</strong> ft<sup>2</sup>. It has a total of{" "}
              <strong>67</strong> residential units, consisting of{" "}
              <strong>45</strong> 1-bedroom apartments and <strong>22</strong>{" "}
              1-bedroom with loft and 2 bathrooms apartments. The entirety of
              the space is occupied as described below.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse mb-4">
                <thead>
                  <tr className="bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200">
                    <th
                      colSpan={2}
                      className="text-center py-3 px-4 border border-gray-300 dark:border-gray-600 font-semibold text-base"
                    >
                      BUILDING AREAS
                    </th>
                  </tr>
                  <tr className="bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                    <th className="border border-gray-300 dark:border-gray-600 py-2 px-3 text-left">
                      Level
                    </th>
                    <th className="border border-gray-300 dark:border-gray-600 py-2 px-3 text-left">
                      Description
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-gray-100 dark:bg-gray-800 even:bg-white even:dark:bg-gray-700">
                    <td className="border border-gray-300 dark:border-gray-600 py-2 px-3">
                      Roof
                    </td>
                    <td className="border border-gray-300 dark:border-gray-600 py-2 px-3">
                      HVAC Units, DHW Units
                    </td>
                  </tr>
                  <tr className="bg-gray-100 dark:bg-gray-800 even:bg-white even:dark:bg-gray-700">
                    <td className="border border-gray-300 dark:border-gray-600 py-2 px-3">
                      1<sup>st</sup> - 4<sup>th</sup> Floor
                    </td>
                    <td className="border border-gray-300 dark:border-gray-600 py-2 px-3">
                      Lobby/Mailroom, Laundry Room, Electrical Equipment, Pool,
                      Apartment units
                    </td>
                  </tr>
                  <tr className="bg-gray-100 dark:bg-gray-800 even:bg-white even:dark:bg-gray-700">
                    <td className="border border-gray-300 dark:border-gray-600 py-2 px-3">
                      Basement
                    </td>
                    <td className="border border-gray-300 dark:border-gray-600 py-2 px-3">
                      Parking
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="mb-4 dark:text-gray-300">
              The building has a maintenance team that is responsible for
              everyday maintenance tasks in the building. Specialty/skilled
              maintenance jobs are outsourced to third party vendors and
              professionals upon request.
            </p>

            <p className="mb-4 dark:text-gray-300">
              The tenants are responsible for their individual electricity and
              natural gas usage. The building owner is responsible for all other
              utilities in the building including common area natural gas,
              electricity, and water/waste.
            </p>
          </div>
        </div>

        <div className="relative mb-3">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 dark:from-emerald-900/10 dark:via-blue-900/10 dark:to-purple-900/10 rounded-2xl"></div>
        <div className="p-4 border border-gray-300 dark:border-gray-700 rounded-md relative">
          <h3 className="text-emerald-600 font-medium  mb-4">
            2. Building Envelope
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200">
                  <th
                    colSpan={2}
                    className="text-center py-3 px-4 border border-gray-300 dark:border-gray-600 font-semibold text-base"
                  >
                    BUILDING ENVELOPE OBSERVATIONS
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-gray-100 dark:bg-gray-800 even:bg-white even:dark:bg-gray-700">
                  <td className="border border-gray-300 dark:border-gray-600 py-2 px-3 w-8 font-bold">
                    A.
                  </td>
                  <td className="border border-gray-300 dark:border-gray-600 py-2 px-3">
                    Single-pane glass windows with aluminum frames were observed
                    throughout the building.
                  </td>
                </tr>
                <tr className="bg-gray-100 dark:bg-gray-800 even:bg-white even:dark:bg-gray-700">
                  <td className="border border-gray-300 dark:border-gray-600 py-2 px-3 font-bold">
                    B.
                  </td>
                  <td className="border border-gray-300 dark:border-gray-600 py-2 px-3">
                    The building is equipped with a cool roof. This
                    light-colored finishing coat helps to minimize thermal
                    radiation heat transfer into the building through the roof.
                  </td>
                </tr>
                <tr className="bg-gray-100 dark:bg-gray-800 even:bg-white even:dark:bg-gray-700">
                  <td className="border border-gray-300 dark:border-gray-600 py-2 px-3 font-bold">
                    C.
                  </td>
                  <td className="border border-gray-300 dark:border-gray-600 py-2 px-3">
                    The construction style of the roof and quality of the
                    building insulation could not be determined during the site
                    inspection.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        </div>

        <div className="relative mb-3">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 dark:from-emerald-900/10 dark:via-blue-900/10 dark:to-purple-900/10 rounded-2xl"></div>
        <div className="p-4 border border-gray-300 dark:border-gray-700 rounded-md relative">
          <h3 className="text-emerald-600 font-medium  mb-4">
            3. Heating, Ventilation, Air Conditioning (HVAC) and Control Systems
          </h3>

          <p className="mb-4 dark:text-gray-300">
            Heating and cooling within the apartment units is provided by the
            package terminal heat pumps. These units are located on the rooftop.
            All heat pump units are a 1.5-ton capacity/(18 kBtu/hr).
          </p>

          <p className="mb-4 dark:text-gray-300">
            Heating and cooling are controlled within each apartment unit with
            integrated thermostat controls. The thermostat inspected during the
            site inspection was fully functional. Specifications of all observed
            HVAC equipment are given below.
          </p>

          {/* Add Total HVAC Energy Usage summary */}
          <div className="mb-4 p-3 bg-muted/50 rounded-md border">
            <div className="flex justify-between items-center">
              <span className="font-medium">Total HVAC Energy Usage:</span>
              <span className="font-semibold">
                {Math.round(
                  hvacEquipment.reduce((sum, item) => {
                    const annualKwh = Number(item.annual_kwh || 0);
                    return sum + annualKwh;
                  }, 0)
                ).toLocaleString()}{" "}
                kWh/year
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse mb-4">
              <thead>
                <tr className="bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200">
                  <th
                    colSpan={7}
                    className="text-center py-3 px-4 border border-gray-300 dark:border-gray-600 font-semibold text-base"
                  >
                    HEATING & COOLING EQUIPMENT
                  </th>
                </tr>
                <tr className="bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                  <th className="border border-gray-300 dark:border-gray-600 py-2 px-3 text-left">
                    Equipment Type
                  </th>
                  <th className="border border-gray-300 dark:border-gray-600 py-2 px-3 text-left">
                    # of Units
                  </th>
                  <th className="border border-gray-300 dark:border-gray-600 py-2 px-3 text-left">
                    Location
                  </th>
                  <th className="border border-gray-300 dark:border-gray-600 py-2 px-3 text-left">
                    Watts
                  </th>
                  <th className="border border-gray-300 dark:border-gray-600 py-2 px-3 text-left">
                    Weekly Hours
                  </th>
                  <th className="border border-gray-300 dark:border-gray-600 py-2 px-3 text-left">
                    Annual kWh
                  </th>
                  <th className="border border-gray-300 dark:border-gray-600 py-2 px-3 text-left">
                    End Use Category
                  </th>
                </tr>
              </thead>
              <tbody>
                {hvacEquipment.length > 0 ? (
                  (() => {
                    console.log(
                      "Rendering HVAC table with equipment:",
                      hvacEquipment
                    );
                    return hvacEquipment.map((equipment, index) => (
                      <tr
                        key={`equipment-${index}`}
                        className="bg-gray-100 dark:bg-gray-800 even:bg-white even:dark:bg-gray-700"
                      >
                        <td className="border border-gray-300 dark:border-gray-600 py-2 px-3">
                          {equipment.type === "No data available" ? (
                            <MissingData />
                          ) : (
                            equipment.type
                          )}
                        </td>
                        <td className="border border-gray-300 dark:border-gray-600 py-2 px-3">
                          {equipment.units === 0 ? (
                            <MissingData />
                          ) : (
                            equipment.units
                          )}
                        </td>
                        <td className="border border-gray-300 dark:border-gray-600 py-2 px-3">
                          {equipment.location === "No data available" ? (
                            <MissingData />
                          ) : (
                            equipment.location
                          )}
                        </td>
                        <td className="border border-gray-300 dark:border-gray-600 py-2 px-3">
                          {equipment.wattage || <MissingData />}
                        </td>
                        <td className="border border-gray-300 dark:border-gray-600 py-2 px-3">
                          {equipment.weekly_hours || <MissingData />}
                        </td>
                        <td className="border border-gray-300 dark:border-gray-600 py-2 px-3">
                          {equipment.annual_kwh ? (
                            Math.round(equipment.annual_kwh).toLocaleString()
                          ) : (
                            <MissingData />
                          )}
                        </td>
                        <td className="border border-gray-300 dark:border-gray-600 py-2 px-3">
                          {equipment.end_use_category || equipment.category || (
                            <MissingData />
                          )}
                        </td>
                      </tr>
                    ));
                  })()
                ) : (
                  <tr className="bg-gray-100 dark:bg-gray-800">
                    <td
                      colSpan={7}
                      className="border border-gray-300 dark:border-gray-600 py-6 px-3 text-center"
                    >
                      <div className="flex flex-col items-center justify-center gap-2">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-8 w-8 text-amber-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span className="font-medium text-amber-700 dark:text-amber-400">
                          No HVAC equipment data found in the project records
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          Equipment data needs to be added to the project
                        </span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <p className="mb-4 dark:text-gray-300">
            Ventilation within the apartment units is driven by above-range
            microwave exhaust fans and bathroom exhaust fans. Both are
            controlled by manual switch. The above-range exhaust fans were
            observed to discharge back into the kitchen.
          </p>

          <p className="mb-4 dark:text-gray-300">
            Internal Air Quality measurements were taken within the apartment
            spaces, finding{" "}
            {getCO2Level() === "No data available" ? (
              <MissingData />
            ) : (
              <strong>{getCO2Level()}</strong>
            )}{" "}
            CO<sub>2</sub> PPM which is an acceptable level of air quality for a
            residential space.
          </p>
        </div>
        </div>

        <div className="relative mb-3">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 dark:from-emerald-900/10 dark:via-blue-900/10 dark:to-purple-900/10 rounded-2xl"></div>
        <div className="p-4 border border-gray-300 dark:border-gray-700 rounded-md relative">
          <h3 className="text-emerald-600 font-medium  mb-4">
            4. Lighting System & Control
          </h3>

          <p className="mb-4 dark:text-gray-300">
            Lighting within the building is provided by a mix of LED, T-8 & T-12
            Fluorescents and Compact Fluorescent lamps. Non-LED lamps were
            observed within the inspected apartment unit. This presents an
            opportunity for major energy and cost savings throughout the
            building in the form of an LED lighting retrofit. Some lighting in
            the hallways is provided by LED lamps, suggesting that management
            acknowledges the benefits of LED lighting and has taken steps to
            implement it in common areas.
          </p>

          <p className="mb-4 dark:text-gray-300">
            Lighting within the apartment units is controlled exclusively by
            manual switch. Lighting within the common areas is switched on with
            the help of mechanical time clocks. Specifications of all lighting
            fixtures observed during the site inspection are given in the table
            below.
          </p>

          {/* Add Total Lighting Energy Usage summary */}
          <div className="mb-4 p-3 bg-muted/50 rounded-md border">
            <div className="flex justify-between items-center">
              <span className="font-medium">Total Lighting Energy Usage:</span>
              <span className="font-semibold">
                {Math.round(
                  lightingEquipment.reduce((sum, item) => {
                    // Calculate annual kWh using the formula
                    const totalLamps =
                      item.number_of_lamps ||
                      Number(item.fixtures || 1) *
                        Number(item.lampsPerFixture || 1);
                    const wattage = Number(item.wattage || 0);
                    const weeklyHours = Math.round(
                      Number(item.weekly_hours || 0)
                    );

                    // Calculate annual kWh
                    const calculatedKwh =
                      (totalLamps * wattage * weeklyHours * 52) / 1000;
                    return sum + (isNaN(calculatedKwh) ? 0 : calculatedKwh);
                  }, 0)
                ).toLocaleString()}{" "}
                kWh/year
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse mb-4">
              <thead>
                <tr className="bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200">
                  <th
                    colSpan={10}
                    className="text-center py-3 px-4 border border-gray-300 dark:border-gray-600 font-semibold text-base"
                  >
                    LIGHTING DATA COLLECTION
                  </th>
                </tr>
                <tr className="bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                  <th className="border border-gray-300 dark:border-gray-600 py-2 px-3 text-left">
                    Location
                  </th>
                  <th className="border border-gray-300 dark:border-gray-600 py-2 px-3 text-left">
                    Equipment Type
                  </th>
                  <th className="border border-gray-300 dark:border-gray-600 py-2 px-3 text-left">
                    # Lamp/Fixture
                  </th>
                  <th className="border border-gray-300 dark:border-gray-600 py-2 px-3 text-left">
                    Tot # Lamps
                  </th>
                  <th className="border border-gray-300 dark:border-gray-600 py-2 px-3 text-left">
                    Lamp Type
                  </th>
                  <th className="border border-gray-300 dark:border-gray-600 py-2 px-3 text-left">
                    Quantity
                  </th>
                  <th className="border border-gray-300 dark:border-gray-600 py-2 px-3 text-left">
                    Watts
                  </th>
                  <th className="border border-gray-300 dark:border-gray-600 py-2 px-3 text-left">
                    Weekly Hours
                  </th>
                  <th className="border border-gray-300 dark:border-gray-600 py-2 px-3 text-left">
                    Annual kWh
                  </th>
                  <th className="border border-gray-300 dark:border-gray-600 py-2 px-3 text-left">
                    End Use Category
                  </th>
                </tr>
              </thead>
              <tbody>
                {lightingEquipment.length > 0 ? (
                  (() => {
                    console.log(
                      "Rendering lighting table with equipment:",
                      lightingEquipment
                    );
                    return lightingEquipment.map((light, index) => {
                      // Process the same way Equipment.tsx does
                      const lampsPerFixture = Number(
                        light.lampsPerFixture || 1
                      );
                      const fixtures = Number(light.fixtures || 1);
                      const totalLamps =
                        light.number_of_lamps || fixtures * lampsPerFixture;
                      const wattage = Number(light.wattage || 0);
                      const weeklyHours = Number(light.weekly_hours || 0);
                      const annualHours = weeklyHours * 52.14; // 52.14 weeks per year
                      const annualKwh =
                        light.annual_kwh ||
                        (totalLamps * wattage * annualHours) / 1000;

                      return (
                        <tr
                          key={`light-${index}`}
                          className="bg-gray-100 dark:bg-gray-800 even:bg-white even:dark:bg-gray-700"
                        >
                          <td className="border border-gray-300 dark:border-gray-600 py-2 px-3">
                            {light.location === "No data available" ? (
                              <MissingData />
                            ) : (
                              light.location
                            )}
                          </td>
                          <td className="border border-gray-300 dark:border-gray-600 py-2 px-3">
                            {light.equipment_type}
                          </td>
                          <td className="border border-gray-300 dark:border-gray-600 py-2 px-3">
                            {lampsPerFixture}
                          </td>
                          <td className="border border-gray-300 dark:border-gray-600 py-2 px-3">
                            {totalLamps}
                          </td>
                          <td className="border border-gray-300 dark:border-gray-600 py-2 px-3">
                            {light.lampType === "No data available" ? (
                              <MissingData />
                            ) : (
                              light.lampType
                            )}
                          </td>
                          <td className="border border-gray-300 dark:border-gray-600 py-2 px-3">
                            {fixtures}
                          </td>
                          <td className="border border-gray-300 dark:border-gray-600 py-2 px-3">
                            {wattage}
                          </td>
                          <td className="border border-gray-300 dark:border-gray-600 py-2 px-3">
                            {Math.round(weeklyHours)}
                          </td>
                          <td className="border border-gray-300 dark:border-gray-600 py-2 px-3">
                            {Math.round(annualKwh).toLocaleString()}
                          </td>
                          <td className="border border-gray-300 dark:border-gray-600 py-2 px-3">
                            {light.end_use_category}
                          </td>
                        </tr>
                      );
                    });
                  })()
                ) : (
                  <tr className="bg-gray-100 dark:bg-gray-800">
                    <td
                      colSpan={10}
                      className="border border-gray-300 dark:border-gray-600 py-6 px-3 text-center"
                    >
                      <div className="flex flex-col items-center justify-center gap-2">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-8 w-8 text-amber-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span className="font-medium text-amber-700 dark:text-amber-400">
                          No lighting data found in the project records
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          Lighting data needs to be added to the project
                        </span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        </div>

        <div className="relative mb-3">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 dark:from-emerald-900/10 dark:via-blue-900/10 dark:to-purple-900/10 rounded-2xl"></div>
        <div className="p-4 border border-gray-300 dark:border-gray-700 rounded-md relative">
          <h3 className="text-emerald-600 font-medium  mb-4">
            5. Domestic Hot Water
          </h3>

          <p className="mb-4 dark:text-gray-300">
            Domestic hot water (DHW) for the building is generated by (2) LAARS
            Mighty Therm2 250kBtu/hr gas-fired storage tanks which serves the
            entire building. The equipment appears to be in good condition and
            regularly maintained, and all DHW piping is fully insulated.
          </p>

          <p className="mb-4 dark:text-gray-300">
            A point-of-use water temperature measurement read at{" "}
            <strong>
              {waterTemperature === "No data available" ? (
                <MissingData />
              ) : (
                `(${waterTemperature})`
              )}
            </strong>{" "}
            °F in one of the apartment units. Specifications of the hot water
            boiler are given in the table below.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse mb-4">
              <thead>
                <tr className="bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200">
                  <th
                    colSpan={7}
                    className="text-center py-3 px-4 border border-gray-300 dark:border-gray-600 font-semibold text-base"
                  >
                    DOMESTIC HOT WATER SYSTEM
                  </th>
                </tr>
                <tr className="bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                  <th className="border border-gray-300 dark:border-gray-600 py-2 px-3 text-left">
                    Location
                  </th>
                  <th className="border border-gray-300 dark:border-gray-600 py-2 px-3 text-left">
                    Equipment Type
                  </th>
                  <th className="border border-gray-300 dark:border-gray-600 py-2 px-3 text-left">
                    Quantity
                  </th>
                  <th className="border border-gray-300 dark:border-gray-600 py-2 px-3 text-left">
                    Watts
                  </th>
                  <th className="border border-gray-300 dark:border-gray-600 py-2 px-3 text-left">
                    Weekly Hours
                  </th>
                  <th className="border border-gray-300 dark:border-gray-600 py-2 px-3 text-left">
                    Annual kWh
                  </th>
                  <th className="border border-gray-300 dark:border-gray-600 py-2 px-3 text-left">
                    End Use Category
                  </th>
                </tr>
              </thead>
              <tbody>
                {hotWaterEquipment.length > 0 ? (
                  (() => {
                    console.log(
                      "Rendering hot water table with equipment:",
                      hotWaterEquipment
                    );
                    return hotWaterEquipment.map((hw, index) => {
                      // Use each item's actual values
                      const quantity = Number(hw.units || 1);
                      const wattage = Number(hw.wattage || 0);
                      // For water heaters, default to 24/7 operation if not specified
                      const weeklyHours = Number(hw.weekly_hours || 0);

                      // Calculate annual kWh using the formula
                      const annualKwh =
                        (quantity * wattage * weeklyHours * 52) / 1000;

                      return (
                        <tr
                          key={`hw-${index}`}
                          className="bg-gray-100 dark:bg-gray-800 even:bg-white even:dark:bg-gray-700"
                        >
                          <td className="border border-gray-300 dark:border-gray-600 py-2 px-3">
                            {hw.location === "No data available" ? (
                              <MissingData />
                            ) : (
                              hw.location
                            )}
                          </td>
                          <td className="border border-gray-300 dark:border-gray-600 py-2 px-3">
                            {hw.description === "No data available" ? (
                              <MissingData />
                            ) : (
                              hw.description
                            )}
                          </td>
                          <td className="border border-gray-300 dark:border-gray-600 py-2 px-3">
                            {quantity}
                          </td>
                          <td className="border border-gray-300 dark:border-gray-600 py-2 px-3">
                            {wattage || <MissingData />}
                          </td>
                          <td className="border border-gray-300 dark:border-gray-600 py-2 px-3">
                            {Math.round(weeklyHours)}
                          </td>
                          <td className="border border-gray-300 dark:border-gray-600 py-2 px-3">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span>
                                    {Math.round(annualKwh).toLocaleString()}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <div className="text-sm">
                                    <div className="font-medium">
                                      Annual kWh Calculation:
                                    </div>
                                    <div>
                                      ({quantity} units × {wattage}W ×{" "}
                                      {Math.round(weeklyHours)} hrs/week × 52
                                      weeks) ÷ 1000 ={" "}
                                      {Math.round(annualKwh).toLocaleString()}{" "}
                                      kWh/year
                                    </div>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </td>
                          <td className="border border-gray-300 dark:border-gray-600 py-2 px-3">
                            {hw.end_use_category || "Water Heating"}
                          </td>
                        </tr>
                      );
                    });
                  })()
                ) : (
                  <tr className="bg-gray-100 dark:bg-gray-800">
                    <td
                      colSpan={7}
                      className="border border-gray-300 dark:border-gray-600 py-6 px-3 text-center"
                    >
                      <div className="flex flex-col items-center justify-center gap-2">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-8 w-8 text-amber-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span className="font-medium text-amber-700 dark:text-amber-400">
                          No hot water equipment data found in the project
                          records
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          Hot water equipment data needs to be added to the
                          project
                        </span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        </div>

        <div className="relative mb-3">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 dark:from-emerald-900/10 dark:via-blue-900/10 dark:to-purple-900/10 rounded-2xl"></div>
        <div className="p-4 border border-gray-300 dark:border-gray-700 mb-6 rounded-md relative">
          <h3 className="text-emerald-600 font-medium  mb-4">
            6. Other Equipment
          </h3>

          <h4 className="text-lg font-semibold mb-2 text-emerald-600 dark:text-emerald-400">
            Kitchen Appliances
          </h4>

          <p className="mb-4 dark:text-gray-300">
            Each apartment unit comes furnished with a natural gas oven/range.
            It is up to each tenant to provide any other appliances they
            require.
          </p>

          <div className="overflow-x-auto mb-6">
            <table className="w-full border-collapse mb-4">
              <thead>
                <tr className="bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200">
                  <th
                    colSpan={6}
                    className="text-center py-3 px-4 border border-gray-300 dark:border-gray-600 font-semibold text-base"
                  >
                    KITCHEN APPLIANCES
                  </th>
                </tr>
                <tr className="bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                  <th className="border border-gray-300 dark:border-gray-600 py-2 px-3 text-left">
                    Type
                  </th>
                  <th className="border border-gray-300 dark:border-gray-600 py-2 px-3 text-left">
                    Units
                  </th>
                  <th className="border border-gray-300 dark:border-gray-600 py-2 px-3 text-left">
                    Location
                  </th>
                  <th className="border border-gray-300 dark:border-gray-600 py-2 px-3 text-left">
                    Fuel Type
                  </th>
                  <th className="border border-gray-300 dark:border-gray-600 py-2 px-3 text-left">
                    Manufacturer
                  </th>
                  <th className="border border-gray-300 dark:border-gray-600 py-2 px-3 text-left">
                    Model
                  </th>
                </tr>
              </thead>
              <tbody>
                {kitchenAppliances.length > 0 ? (
                  kitchenAppliances.map((appliance, index) => (
                    <tr
                      key={`appliance-${index}`}
                      className="bg-gray-100 dark:bg-gray-800 even:bg-white even:dark:bg-gray-700"
                    >
                      <td className="border border-gray-300 dark:border-gray-600 py-2 px-3">
                        {appliance.type === "No data available" ? (
                          <MissingData />
                        ) : (
                          appliance.type
                        )}
                      </td>
                      <td className="border border-gray-300 dark:border-gray-600 py-2 px-3">
                        {appliance.units === 0 ? (
                          <MissingData />
                        ) : (
                          appliance.units
                        )}
                      </td>
                      <td className="border border-gray-300 dark:border-gray-600 py-2 px-3">
                        {appliance.location === "No data available" ? (
                          <MissingData />
                        ) : (
                          appliance.location
                        )}
                      </td>
                      <td className="border border-gray-300 dark:border-gray-600 py-2 px-3">
                        {appliance.fuel === "No data available" ? (
                          <MissingData />
                        ) : (
                          appliance.fuel
                        )}
                      </td>
                      <td className="border border-gray-300 dark:border-gray-600 py-2 px-3">
                        {!appliance.manufacturer ||
                        appliance.manufacturer === "No data available" ? (
                          <MissingData />
                        ) : (
                          appliance.manufacturer
                        )}
                      </td>
                      <td className="border border-gray-300 dark:border-gray-600 py-2 px-3">
                        {!appliance.model ||
                        appliance.model === "No data available" ? (
                          <MissingData />
                        ) : (
                          appliance.model
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr className="bg-gray-100 dark:bg-gray-800">
                    <td
                      colSpan={6}
                      className="border border-gray-300 dark:border-gray-600 py-6 px-3 text-center"
                    >
                      <div className="flex flex-col items-center justify-center gap-2">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-8 w-8 text-amber-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span className="font-medium text-amber-700 dark:text-amber-400">
                          No kitchen appliance data found in the project records
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          Appliance data needs to be added to the project
                        </span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <h4 className="text-lg font-semibold mb-2 text-emerald-600 dark:text-emerald-400">
            Laundry
          </h4>

          <p className="mb-4 dark:text-gray-300">
            There is a common area laundry room equipped with (6) top-load
            washing machines and (6) front-load dryers. These machines are
            rented from a third party.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse mb-4">
              <thead>
                <tr className="bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200">
                  <th
                    colSpan={5}
                    className="text-center py-3 px-4 border border-gray-300 dark:border-gray-600 font-semibold text-base"
                  >
                    LAUNDRY EQUIPMENT
                  </th>
                </tr>
                <tr className="bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                  <th className="border border-gray-300 dark:border-gray-600 py-2 px-3 text-left">
                    Equipment Type
                  </th>
                  <th className="border border-gray-300 dark:border-gray-600 py-2 px-3 text-left">
                    # of Units
                  </th>
                  <th className="border border-gray-300 dark:border-gray-600 py-2 px-3 text-left">
                    Style
                  </th>
                  <th className="border border-gray-300 dark:border-gray-600 py-2 px-3 text-left">
                    Location
                  </th>
                  <th className="border border-gray-300 dark:border-gray-600 py-2 px-3 text-left">
                    Provider
                  </th>
                </tr>
              </thead>
              <tbody>
                {laundryEquipment.length > 0 ? (
                  laundryEquipment.map((equipment, index) => (
                    <tr
                      key={`laundry-${index}`}
                      className="bg-gray-100 dark:bg-gray-800 even:bg-white even:dark:bg-gray-700"
                    >
                      <td className="border border-gray-300 dark:border-gray-600 py-2 px-3">
                        {equipment.type === "No data available" ? (
                          <MissingData />
                        ) : (
                          equipment.type
                        )}
                      </td>
                      <td className="border border-gray-300 dark:border-gray-600 py-2 px-3">
                        {equipment.units === 0 ? (
                          <MissingData />
                        ) : (
                          equipment.units
                        )}
                      </td>
                      <td className="border border-gray-300 dark:border-gray-600 py-2 px-3">
                        {equipment.style === "No data available" ? (
                          <MissingData />
                        ) : (
                          equipment.style
                        )}
                      </td>
                      <td className="border border-gray-300 dark:border-gray-600 py-2 px-3">
                        {equipment.location === "No data available" ? (
                          <MissingData />
                        ) : (
                          equipment.location
                        )}
                      </td>
                      <td className="border border-gray-300 dark:border-gray-600 py-2 px-3">
                        {equipment.provider === "No data available" ? (
                          <MissingData />
                        ) : (
                          equipment.provider
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr className="bg-gray-100 dark:bg-gray-800">
                    <td
                      colSpan={5}
                      className="border border-gray-300 dark:border-gray-600 py-6 px-3 text-center"
                    >
                      <div className="flex flex-col items-center justify-center gap-2">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-8 w-8 text-amber-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span className="font-medium text-amber-700 dark:text-amber-400">
                          No laundry equipment data found in the project records
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          Laundry equipment data needs to be added to the
                          project
                        </span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        </div>

        <div className="relative ">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 dark:from-emerald-900/10 dark:via-blue-900/10 dark:to-purple-900/10 rounded-2xl"></div>
        <div className="p-4 border border-gray-300 dark:border-gray-700 mb-6 rounded-md relative">
          <h3 className="text-emerald-600 font-medium  mb-4">
            5a. Water Fixtures
          </h3>

          <p className="mb-4 dark:text-gray-300">
            The building has various water fixtures throughout the residential
            units and common areas, including bathroom faucets, showerheads, and
            toilets. These fixtures contribute to the building's overall water
            usage.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse mb-4">
              <thead>
                <tr className="bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200">
                  <th
                    colSpan={4}
                    className="text-center py-3 px-4 border border-gray-300 dark:border-gray-600 font-semibold text-base"
                  >
                    WATER FIXTURES
                  </th>
                </tr>
                <tr className="bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                  <th className="border border-gray-300 dark:border-gray-600 py-2 px-3 text-left">
                    Location
                  </th>
                  <th className="border border-gray-300 dark:border-gray-600 py-2 px-3 text-left">
                    Equipment Type
                  </th>
                  <th className="border border-gray-300 dark:border-gray-600 py-2 px-3 text-left">
                    Quantity
                  </th>
                  <th className="border border-gray-300 dark:border-gray-600 py-2 px-3 text-left">
                    End Use Category
                  </th>
                </tr>
              </thead>
              <tbody>
                {waterFixturesEquipment.length > 0 ? (
                  (() => {
                    console.log(
                      "Rendering water fixtures table with equipment:",
                      waterFixturesEquipment
                    );
                    return waterFixturesEquipment.map((fixture, index) => {
                      return (
                        <tr
                          key={`fixture-${index}`}
                          className="bg-gray-100 dark:bg-gray-800 even:bg-white even:dark:bg-gray-700"
                        >
                          <td className="border border-gray-300 dark:border-gray-600 py-2 px-3">
                            {fixture.location === "No data available" ? (
                              <MissingData />
                            ) : (
                              fixture.location
                            )}
                          </td>
                          <td className="border border-gray-300 dark:border-gray-600 py-2 px-3">
                            {fixture.equipment_type === "No data available" ? (
                              <MissingData />
                            ) : (
                              fixture.equipment_type
                            )}
                          </td>
                          <td className="border border-gray-300 dark:border-gray-600 py-2 px-3">
                            {fixture.quantity}
                          </td>
                          <td className="border border-gray-300 dark:border-gray-600 py-2 px-3">
                            {fixture.end_use_category}
                          </td>
                        </tr>
                      );
                    });
                  })()
                ) : (
                  <tr className="bg-gray-100 dark:bg-gray-800">
                    <td
                      colSpan={4}
                      className="border border-gray-300 dark:border-gray-600 py-6 px-3 text-center"
                    >
                      <div className="flex flex-col items-center justify-center gap-2">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-8 w-8 text-amber-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span className="font-medium text-amber-700 dark:text-amber-400">
                          No water fixtures data found in the project records
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          Water fixtures data needs to be added to the project
                        </span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        </div>

        <div className="relative">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 dark:from-emerald-900/10 dark:via-blue-900/10 dark:to-purple-900/10 rounded-2xl"></div>
        <div className="p-4 border border-gray-300 dark:border-gray-700 mb-6 rounded-md relative">
          <h3 className="text-emerald-600 font-medium  mb-4">
            5b. Pool Equipment
          </h3>

          <p className="mb-4 dark:text-gray-300">
            The building has a swimming pool served by various equipment,
            including pumps, filters, and heaters. Pool equipment contributes to
            the building's overall energy and water usage.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse mb-4">
              <thead>
                <tr className="bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200">
                  <th
                    colSpan={4}
                    className="text-center py-3 px-4 border border-gray-300 dark:border-gray-600 font-semibold text-base"
                  >
                    POOL EQUIPMENT
                  </th>
                </tr>
                <tr className="bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                  <th className="border border-gray-300 dark:border-gray-600 py-2 px-3 text-left">
                    Location
                  </th>
                  <th className="border border-gray-300 dark:border-gray-600 py-2 px-3 text-left">
                    Equipment Type
                  </th>
                  <th className="border border-gray-300 dark:border-gray-600 py-2 px-3 text-left">
                    Quantity
                  </th>
                  <th className="border border-gray-300 dark:border-gray-600 py-2 px-3 text-left">
                    End Use Category
                  </th>
                </tr>
              </thead>
              <tbody>
                {poolEquipment.length > 0 ? (
                  (() => {
                    console.log(
                      "Rendering pool equipment table with equipment:",
                      poolEquipment
                    );
                    return poolEquipment.map((equipment, index) => {
                      return (
                        <tr
                          key={`pool-equipment-${index}`}
                          className="bg-gray-100 dark:bg-gray-800 even:bg-white even:dark:bg-gray-700"
                        >
                          <td className="border border-gray-300 dark:border-gray-600 py-2 px-3">
                            {equipment.location === "No data available" ? (
                              <MissingData />
                            ) : (
                              equipment.location
                            )}
                          </td>
                          <td className="border border-gray-300 dark:border-gray-600 py-2 px-3">
                            {equipment.equipment_type ===
                            "No data available" ? (
                              <MissingData />
                            ) : (
                              equipment.equipment_type
                            )}
                          </td>
                          <td className="border border-gray-300 dark:border-gray-600 py-2 px-3">
                            {equipment.quantity}
                          </td>
                          <td className="border border-gray-300 dark:border-gray-600 py-2 px-3">
                            {equipment.end_use_category}
                          </td>
                        </tr>
                      );
                    });
                  })()
                ) : (
                  <tr className="bg-gray-100 dark:bg-gray-800">
                    <td
                      colSpan={4}
                      className="border border-gray-300 dark:border-gray-600 py-6 px-3 text-center"
                    >
                      <div className="flex flex-col items-center justify-center gap-2">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-8 w-8 text-amber-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span className="font-medium text-amber-700 dark:text-amber-400">
                          No pool equipment data found in the project records
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          Pool equipment data needs to be added to the project
                        </span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        </div>
      </div>
    </section>
  );
}
