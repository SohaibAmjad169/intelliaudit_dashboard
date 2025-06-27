import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Tabs, Card, Divider } from 'antd';
import { PhotoMetadataBatchForm } from '../features/equipment/components/PhotoMetadataBatchForm';
import { PhotoMetadataBatchList } from '../features/equipment/components/PhotoMetadataBatchList';
import { PhotoMetadataResultsList } from '../features/equipment/components/PhotoMetadataResultsList';
import { PhotoMetadataUploadForm } from '../features/equipment/components/PhotoMetadataUploadForm';

const { TabPane } = Tabs;

/**
 * Page for managing photo metadata extraction
 */
const PhotoMetadataPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
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
    <div className="page-container">
      <h1>Photo Metadata Extraction</h1>
      <p className="page-description">
        Extract equipment metadata from photos to enhance your equipment records.
      </p>

      <Divider />

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="Create Batch Job" key="create">
          <PhotoMetadataBatchForm 
            projectId={projectId} 
            onSuccess={handleBatchCreated} 
          />
        </TabPane>
        <TabPane tab="Batch Jobs" key="batches">
          <PhotoMetadataBatchList 
            projectId={projectId} 
            onSelectBatch={handleSelectBatch}
            refreshTrigger={refreshTrigger}
            onSelectBatchForUpload={handleSelectBatchForUpload}
          />
        </TabPane>
        <TabPane 
          tab="Upload Photos" 
          key="upload"
          disabled={!selectedBatchId}
        >
          {selectedBatchId && (
            <PhotoMetadataUploadForm 
              batchId={selectedBatchId}
              onSuccess={handleUploadSuccess}
              onCancel={() => setActiveTab('batches')}
            />
          )}
        </TabPane>
        <TabPane 
          tab="Results" 
          key="results" 
          disabled={!selectedBatchId}
        >
          {selectedBatchId && (
            <PhotoMetadataResultsList 
              batchId={selectedBatchId}
              projectId={projectId}
              refreshTrigger={refreshTrigger}
            />
          )}
        </TabPane>
      </Tabs>
    </div>
  );
};

export default PhotoMetadataPage; 