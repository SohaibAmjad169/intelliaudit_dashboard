import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { equipmentService } from "@/services/equipment";
import { toast } from "sonner";
import { EnrichedEquipment } from "@/types/equipment";

interface EquipmentTableProps {
  project: {
    id: string;
    name: string;
  };
  initialEquipment?: EnrichedEquipment[];
}

const EquipmentTable: React.FC<EquipmentTableProps> = ({ project, initialEquipment = [] }) => {
  const [equipment, setEquipment] = useState<EnrichedEquipment[]>(initialEquipment);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (initialEquipment.length > 0) {
      setEquipment(initialEquipment);
    } else if (project?.id) {
      loadEquipmentData();
    }
  }, [project?.id, initialEquipment]);

  const loadEquipmentData = async () => {
    try {
      setIsLoading(true);
      const data = await equipmentService.getEnrichedEquipment(project.id);
      setEquipment(data);
    } catch (error) {
      console.error("Error loading equipment data:", error);
      toast.error("Failed to load equipment data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnrichEquipment = async () => {
    try {
      setIsLoading(true);
      toast.loading("Processing equipment data enrichment...");
      const enrichedData = await equipmentService.enrichEquipmentData(project.id);
      toast.dismiss();
      toast.success("Equipment data enriched successfully!");
      setEquipment(enrichedData);
    } catch (error) {
      toast.dismiss();
      toast.error("Failed to enrich equipment data");
      console.error("Error enriching equipment:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Render equipment data
  const renderEquipmentTable = () => {
    if (isLoading) {
      return <div>Loading equipment data...</div>;
    }
    
    if (equipment.length === 0) {
      return <div>No equipment data available.</div>;
    }
    
    return (
      <div>
        <p>Total equipment items: {equipment.length}</p>
        {/* Equipment table rendering logic here */}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Equipment</h2>
        <Button onClick={handleEnrichEquipment} disabled={isLoading}>
          Enrich Equipment Data
        </Button>
      </div>
      
      {renderEquipmentTable()}
    </div>
  );
};

export default EquipmentTable; 