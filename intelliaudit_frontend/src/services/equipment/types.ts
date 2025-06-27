export interface AnalysisBatchStatus {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  total: number;
  error?: string;
  results?: any[];
}
