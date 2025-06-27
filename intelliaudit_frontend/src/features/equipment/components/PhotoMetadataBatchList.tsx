import React, { useEffect, useState } from 'react';
import { Table, Tag, Button, Typography, Space, notification } from 'antd';
import { 
  photoMetadataService, 
  PhotoBatchJob 
} from '../../../services/equipment/photo-metadata';
import { formatDistanceToNow, format } from 'date-fns';
import { RefreshCw, FolderOpen, Upload } from 'lucide-react';
import { Table as ShadcnTable, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { Button as ShadcnButton } from '@/components/ui/button';

const { Title } = Typography;

interface PhotoMetadataBatchListProps {
  projectId: string;
  onSelectBatch?: (batchId: string) => void;
  onSelectBatchForUpload?: (batchId: string) => void;
  refreshTrigger?: number; // Incremented to trigger a refresh
}

/**
 * Component for displaying a list of photo metadata batch jobs
 */
export const PhotoMetadataBatchList: React.FC<PhotoMetadataBatchListProps> = ({
  projectId,
  onSelectBatch,
  onSelectBatchForUpload,
  refreshTrigger = 0
}) => {
  const [loading, setLoading] = useState(false);
  const [batchJobs, setBatchJobs] = useState<PhotoBatchJob[]>([]);

  const loadBatchJobs = async () => {
    try {
      setLoading(true);
      const jobs = await photoMetadataService.listBatchJobs(projectId);
      setBatchJobs(jobs);
    } catch (error) {
      notification.error({
        message: 'Failed to Load Batch Jobs',
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setLoading(false);
    }
  };

  // Load batch jobs on component mount and when refreshTrigger changes
  useEffect(() => {
    loadBatchJobs();
  }, [projectId, refreshTrigger]);

  // Calculate batch job progress percentage
  const getProgressPercentage = (job: PhotoBatchJob): number => {
    if (job.total_photos === 0) return 0;
    return Math.round((job.processed_photos / job.total_photos) * 100);
  };

  // Get status tag with appropriate color
  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string, text: string }> = {
      queued: { color: 'blue', text: 'Queued' },
      processing: { color: 'orange', text: 'Processing' },
      completed: { color: 'green', text: 'Completed' },
      failed: { color: 'red', text: 'Failed' }
    };

    const statusInfo = statusMap[status.toLowerCase()] || { color: 'default', text: status };
    return <Tag color={statusInfo.color} className="bg-zinc-800 border-zinc-700">{statusInfo.text}</Tag>;
  };

  // Get priority tag with appropriate color
  const getPriorityTag = (priority: string) => {
    const priorityMap: Record<string, { color: string, text: string }> = {
      high: { color: 'red', text: 'High' },
      normal: { color: 'blue', text: 'Normal' },
      low: { color: 'gray', text: 'Low' }
    };

    const priorityInfo = priorityMap[priority.toLowerCase()] || { color: 'default', text: priority };
    return <Tag color={priorityInfo.color} className="bg-zinc-800 border-zinc-700">{priorityInfo.text}</Tag>;
  };

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return (
        <span title={format(date, 'PPpp')}>
          {formatDistanceToNow(date, { addSuffix: true })}
        </span>
      );
    } catch (error) {
      return dateString;
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { color: string, text: string }> = {
      queued: { color: 'blue', text: 'Queued' },
      processing: { color: 'orange', text: 'Processing' },
      completed: { color: 'green', text: 'Completed' },
      failed: { color: 'red', text: 'Failed' }
    };

    const statusInfo = statusMap[status.toLowerCase()] || { color: 'default', text: status };
    return (
      <Tag color={statusInfo.color}>
        {statusInfo.text}
      </Tag>
    );
  };

  // Get priority badge
  const getPriorityBadge = (priority: string) => {
    const priorityMap: Record<string, { color: string, text: string }> = {
      high: { color: 'red', text: 'High' },
      normal: { color: 'blue', text: 'Normal' },
      low: { color: 'gray', text: 'Low' }
    };

    const priorityInfo = priorityMap[priority.toLowerCase()] || { color: 'default', text: priority };
    return (
      <Tag color={priorityInfo.color}>
        {priorityInfo.text}
      </Tag>
    );
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Photo Metadata Batch Jobs</h3>
        <Button 
          type="default" 
          onClick={loadBatchJobs} 
          loading={loading}
          className="ml-auto bg-zinc-800 text-zinc-100 border-zinc-700 hover:bg-zinc-700"
        >
          {loading ? null : <RefreshCw className="h-4 w-4 mr-2" />}
          Refresh
        </Button>
      </div>
      
      <div className="rounded-md border border-zinc-700 overflow-hidden">
        <ShadcnTable className="bg-zinc-900">
          <TableHeader>
            <TableRow className="hover:bg-zinc-800/50 border-zinc-700">
              <TableHead className="text-zinc-300">Status</TableHead>
              <TableHead className="text-zinc-300">Created</TableHead>
              <TableHead className="text-zinc-300">Equipment Type</TableHead>
              <TableHead className="text-zinc-300">Priority</TableHead>
              <TableHead className="text-zinc-300">Progress</TableHead>
              <TableHead className="text-right text-zinc-300">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {batchJobs.length === 0 && (
              <TableRow className="hover:bg-zinc-800/50">
                <TableCell colSpan={6} className="h-40 text-center bg-zinc-900">
                  <div className="flex flex-col items-center justify-center text-zinc-500">
                    <div className="rounded-full bg-zinc-800 p-3 mb-2">
                      <FolderOpen className="h-8 w-8" />
                    </div>
                    <p>No data</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {batchJobs.map((job) => (
              <TableRow key={job.id} className="hover:bg-zinc-800/50 border-zinc-700">
                <TableCell>{getStatusTag(job.status)}</TableCell>
                <TableCell>{formatDate(job.created_at)}</TableCell>
                <TableCell>{job.equipment_type || 'All'}</TableCell>
                <TableCell>{getPriorityTag(job.priority)}</TableCell>
                <TableCell>
                  <span className="text-zinc-400">
                    {job.processed_photos} / {job.total_photos} 
                    <span className="text-zinc-300 ml-1">({getProgressPercentage(job)}%)</span>
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Space>
                      <Button 
                        type="primary" 
                        size="small" 
                        onClick={() => onSelectBatch && onSelectBatch(job.id)}
                        className="bg-zinc-800 text-zinc-100 border border-zinc-700 hover:bg-zinc-700"
                      >
                        <FolderOpen className="h-4 w-4 mr-2" />
                        View Results
                      </Button>
                      <Button 
                        type="default" 
                        size="small" 
                        onClick={() => onSelectBatchForUpload && onSelectBatchForUpload(job.id)}
                        className="bg-zinc-900 text-zinc-300 border-zinc-700 hover:bg-zinc-800"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Photos
                      </Button>
                    </Space>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </ShadcnTable>
      </div>
    </div>
  );
}; 