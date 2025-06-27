import { useState, useEffect } from 'react';
import { fieldNotesService } from '@/services/field-notes';
import { 
  ProcessingResult as SiteAssessmentProcessingResult,
  ProcessingFlag as SiteAssessmentProcessingFlag
} from '@/types/equipment-processing';

export const useEnrichment = (projectId: string) => {
  const [fieldNotes, setFieldNotes] = useState<string>('');
  const [isProcessingNotes, setIsProcessingNotes] = useState<boolean>(false);
  const [fieldNotesError, setFieldNotesError] = useState<string | null>(null);
  const [fieldNotesSuccess, setFieldNotesSuccess] = useState<boolean>(false);
  const [fieldNotesAlreadyEnhanced, setFieldNotesAlreadyEnhanced] = useState<boolean>(false);
  const [equipmentAnalysisData, setEquipmentAnalysisData] = useState<SiteAssessmentProcessingResult | null>(null);

  const fetchEquipmentData = async () => {
    try {
      const response = await fieldNotesService.getFieldNotes(projectId);
      if (response && response.equipment && response.equipment.length > 0) {
        const result: SiteAssessmentProcessingResult = {
          id: response.equipment[0]?.id,
          equipment: response.equipment,
          flags: [],
          status: 'success',
          metadata: {
            processedAt: new Date().toISOString(),
            processingTimeMs: 0,
            confidence: 0
          },
          data: {}
        };
        setEquipmentAnalysisData(result);
        setFieldNotesAlreadyEnhanced(true);
      }
    } catch (error) {
      console.error('Error fetching equipment data:', error);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchEquipmentData();
    }
  }, [projectId]);

  const handleProcessFieldNotes = async (): Promise<boolean> => {
    if (!fieldNotes || !projectId) {
      setFieldNotesError('Field notes and project ID are required.');
      return false;
    }

    try {
      setIsProcessingNotes(true);
      setFieldNotesError(null);
      setFieldNotesSuccess(false);
      
      const result = await fieldNotesService.processFieldNotes(
        fieldNotes,
        projectId
      );
      
      if (result && result.equipment && result.equipment.length > 0) {
        // Convert the flags to match the SiteAssessmentProcessingFlag format
        const mappedFlags: SiteAssessmentProcessingFlag[] = result.flags?.map(flag => {
          return {
            type: flag.type,
            message: flag.message,
            severity: flag.severity || 'info',
            field: flag.type // Using type as field since our new API doesn't have field property
          } as SiteAssessmentProcessingFlag;
        }) || [];
        
        // Create a converted result that matches the SiteAssessmentProcessingResult format
        // Use type assertion for result since it might come from an API with slightly different shape
        const convertedResult: SiteAssessmentProcessingResult = {
          id: result.equipment?.[0]?.id,
          equipment: result.equipment,
          flags: mappedFlags,
          status: 'success', // Default to success since we have equipment
          metadata: result.metadata || {
            processedAt: new Date().toISOString(),
            processingTimeMs: 0,
            confidence: 0
          },
          data: result.metadata || {}
        };
        
        setEquipmentAnalysisData(convertedResult);
        setFieldNotesSuccess(true);
        setFieldNotesAlreadyEnhanced(true);

        // Fetch the latest equipment data
        await fetchEquipmentData();
        return true;
      } else {
        setFieldNotesError('No equipment could be identified from the field notes. Please provide more detailed observations.');
        return false;
      }
    } catch (err) {
      console.error('Error processing field notes:', err);
      setFieldNotesError('Failed to process field notes. Please try again.');
      return false;
    } finally {
      setIsProcessingNotes(false);
    }
  };

  return {
    fieldNotes,
    setFieldNotes,
    isProcessingNotes,
    fieldNotesError,
    fieldNotesSuccess,
    fieldNotesAlreadyEnhanced,
    equipmentAnalysisData,
    handleProcessFieldNotes
  };
}; 