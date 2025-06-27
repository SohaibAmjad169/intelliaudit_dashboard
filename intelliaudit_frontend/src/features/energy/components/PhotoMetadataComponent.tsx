import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { PhotoMetadataBatchForm } from '@/features/equipment/components/PhotoMetadataBatchForm';
import { PhotoMetadataBatchList } from '@/features/equipment/components/PhotoMetadataBatchList';
import { PhotoMetadataResultsList } from '@/features/equipment/components/PhotoMetadataResultsList';
import { PhotoMetadataUploadForm } from '@/features/equipment/components/PhotoMetadataUploadForm';
import { Camera, FileText, Grid, Upload } from 'lucide-react';

interface PhotoMetadataComponentProps {
  projectId: string;
}

/**
 * Component for managing photo metadata extraction that can be embedded in other pages
 */
export const PhotoMetadataComponent: React.FC<PhotoMetadataComponentProps> = ({ projectId }) => {
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState('batches');

  // Handle batch creation success
  const handleBatchCreated = () => {
    // Refresh batch list
    setRefreshTrigger(prev => prev + 1);
    // Switch to batches tab
    setActiveTab('batches');
  };

  // Handle selecting a batch to view results
  const handleSelectBatch = (batchId: string) => {
    setSelectedBatchId(batchId);
    setActiveTab('results');
  };

  // Handle selecting a batch for upload
  const handleSelectBatchForUpload = (batchId: string) => {
    setSelectedBatchId(batchId);
    setActiveTab('upload');
  };

  // Handle upload success
  const handleUploadSuccess = () => {
    // Refresh the results tab
    setRefreshTrigger(prev => prev + 1);
    // Switch to results tab
    setActiveTab('results');
  };

  if (!projectId) {
    return <Card className="bg-zinc-800/50 border-zinc-700">Project ID is required</Card>;
  }

  return (
    <div className="space-y-4">
      <div className="pb-2">
        <h2 className="text-2xl font-bold">Photo Metadata Extraction</h2>
        <p className="text-muted-foreground">
          Extract equipment metadata from photos to enhance your equipment records.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6 bg-zinc-900 border-b border-zinc-800">
          <TabsTrigger value="create" className="data-[state=active]:bg-zinc-800 data-[state=active]:border-b-2 data-[state=active]:border-zinc-300 rounded-none">
            <FileText className="h-4 w-4 mr-2" />
            Create Batch Job
          </TabsTrigger>
          <TabsTrigger value="batches" className="data-[state=active]:bg-zinc-800 data-[state=active]:border-b-2 data-[state=active]:border-zinc-300 rounded-none">
            <Grid className="h-4 w-4 mr-2" />
            Batch Jobs
          </TabsTrigger>
          <TabsTrigger value="upload" disabled={!selectedBatchId} className="data-[state=active]:bg-zinc-800 data-[state=active]:border-b-2 data-[state=active]:border-zinc-300 rounded-none">
            <Upload className="h-4 w-4 mr-2" />
            Upload Photos
          </TabsTrigger>
          <TabsTrigger value="results" disabled={!selectedBatchId} className="data-[state=active]:bg-zinc-800 data-[state=active]:border-b-2 data-[state=active]:border-zinc-300 rounded-none">
            <Camera className="h-4 w-4 mr-2" />
            Results
          </TabsTrigger>
        </TabsList>

        <Card className="bg-black border border-zinc-800">
          <CardContent className="p-0">
            <TabsContent value="create" className="m-0">
              <PhotoMetadataBatchForm 
                projectId={projectId} 
                onSuccess={handleBatchCreated} 
              />
            </TabsContent>

            <TabsContent value="batches" className="m-0">
              <PhotoMetadataBatchList 
                projectId={projectId} 
                onSelectBatch={handleSelectBatch}
                refreshTrigger={refreshTrigger}
                onSelectBatchForUpload={handleSelectBatchForUpload}
              />
            </TabsContent>

            <TabsContent value="upload" className="m-0">
              {selectedBatchId && (
                <PhotoMetadataUploadForm 
                  batchId={selectedBatchId}
                  onSuccess={handleUploadSuccess}
                  onCancel={() => setActiveTab('batches')}
                />
              )}
            </TabsContent>

            <TabsContent value="results" className="m-0">
              {selectedBatchId && (
                <PhotoMetadataResultsList 
                  batchId={selectedBatchId}
                  projectId={projectId}
                  refreshTrigger={refreshTrigger}
                />
              )}
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
}; 