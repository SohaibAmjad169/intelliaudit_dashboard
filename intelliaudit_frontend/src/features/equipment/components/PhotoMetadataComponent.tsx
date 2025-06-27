import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { PhotoMetadataBatchForm } from './PhotoMetadataBatchForm';
import { PhotoMetadataBatchList } from './PhotoMetadataBatchList';
import { PhotoMetadataResultsList } from './PhotoMetadataResultsList';
import { PhotoMetadataUploadForm } from './PhotoMetadataUploadForm';

interface PhotoMetadataComponentProps {
  projectId: string;
  publicView?: boolean;
}

/**
 * Component for managing photo metadata extraction that can be embedded in other pages
 */
export const PhotoMetadataComponent: React.FC<PhotoMetadataComponentProps> = ({ projectId, publicView }) => {
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
    return <Card>Project ID is required</Card>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Photo Metadata Extraction</h2>
        <p className="text-muted-foreground">
          Extract equipment metadata from photos to enhance your equipment records.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
        {!publicView && (
          <TabsTrigger value="create">Create Batch Job</TabsTrigger>
        )}
          <TabsTrigger value="batches">Batch Jobs</TabsTrigger>
        {!publicView && (
          <TabsTrigger value="upload" disabled={!selectedBatchId}>Upload Photos</TabsTrigger>
        )}
          <TabsTrigger value="results" disabled={!selectedBatchId}>Results</TabsTrigger>
        </TabsList>

        <TabsContent value="create">
          <Card className="p-4">
            <PhotoMetadataBatchForm 
              projectId={projectId} 
              onSuccess={handleBatchCreated} 
            />
          </Card>
        </TabsContent>

        <TabsContent value="batches">
          <Card className="p-4">
            <PhotoMetadataBatchList 
              projectId={projectId} 
              onSelectBatch={handleSelectBatch}
              refreshTrigger={refreshTrigger}
              onSelectBatchForUpload={handleSelectBatchForUpload}
            />
          </Card>
        </TabsContent>

        <TabsContent value="upload">
          {selectedBatchId && (
            <Card className="p-4">
              <PhotoMetadataUploadForm 
                batchId={selectedBatchId}
                onSuccess={handleUploadSuccess}
                onCancel={() => setActiveTab('batches')}
              />
            </Card>
          )}
        </TabsContent>

        <TabsContent value="results">
          {selectedBatchId && (
            <Card className="p-4">
              <PhotoMetadataResultsList 
                batchId={selectedBatchId}
                projectId={projectId}
                refreshTrigger={refreshTrigger}
              />
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}; 