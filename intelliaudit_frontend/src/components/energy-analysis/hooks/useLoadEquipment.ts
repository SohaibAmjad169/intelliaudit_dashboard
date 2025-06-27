import { useState, useEffect } from 'react';
import { apiClient } from '@/services/common/api-client';
import { EquipmentItem } from '../utils/transformEquipmentData';

interface UseLoadEquipmentResult {
  loading: boolean;
  error: Error | null;
  equipmentData: EquipmentItem[] | null;
}

export function useLoadEquipment(projectId: string): UseLoadEquipmentResult {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [equipmentData, setEquipmentData] = useState<EquipmentItem[] | null>(null);

  useEffect(() => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    async function fetchEquipmentData() {
      try {
        setLoading(true);
        setError(null);
        
        const response = await apiClient.get<EquipmentItem[]>(`/equipment/${projectId}`);
        
        if (response) {
          setEquipmentData(response);
        } else {
          setEquipmentData([]);
        }
      } catch (err) {
        console.error('Error fetching equipment data:', err);
        setError(err instanceof Error ? err : new Error('Failed to load equipment data'));
      } finally {
        setLoading(false);
      }
    }

    fetchEquipmentData();
  }, [projectId]);

  return { loading, error, equipmentData };
} 