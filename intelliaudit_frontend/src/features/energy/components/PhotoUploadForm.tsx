import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/components/ui/use-toast';
import { Loader2, Upload, AlertCircle, X } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { equipmentPhotoService } from '@/services/equipment/photoAnalysis';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PhotoUploadFormProps {
  projectId: string;
  onSuccess: () => Promise<void>;
  onCancel: () => void;
}

export const PhotoUploadForm: React.FC<PhotoUploadFormProps> = ({
  projectId,
  onSuccess,
  onCancel
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processedFiles, setProcessedFiles] = useState(0);
  const [totalFiles, setTotalFiles] = useState(0);
  const [currentBatch, setCurrentBatch] = useState(0);
  const [totalBatches, setTotalBatches] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.heic', '.heif']
    },
    maxFiles: 500, // Increased to handle larger batches
    onDrop: (acceptedFiles) => {
      setFiles(prev => [...prev, ...acceptedFiles]);
      setError(null);
    }
  });

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (!files.length) {
      toast({
        variant: 'destructive',
        description: 'Please select at least one photo to upload'
      });
      return;
    }

    console.log('[PhotoUploadForm] Starting upload process', {
      fileCount: files.length,
      totalSize: `${(files.reduce((acc, f) => acc + f.size, 0) / (1024 * 1024)).toFixed(2)}MB`,
      projectId
    });

    setIsUploading(true);
    setProcessedFiles(0);
    setTotalFiles(files.length);
    setError(null);

    try {
      console.log('[PhotoUploadForm] Calling equipmentPhotoService.processPhotos');
      // Process photos in batches
      const result = await equipmentPhotoService.processPhotos(
        files,
        projectId,
        'gpt-4o',
        (batchNumber) => {
          console.log(`[PhotoUploadForm] Batch ${batchNumber} progress update`);
          setCurrentBatch(batchNumber);
          // Update progress based on completed batches
          const progress = (batchNumber / Math.ceil(files.length / 5)) * 100;
          setUploadProgress(progress);
        }
      );

      console.log('[PhotoUploadForm] Photo processing complete', { result });

      if (result.success) {
        console.log('[PhotoUploadForm] Photo processing successful');
        toast({
          description: `Successfully added to queue for processing.`
        });
        // Clear the form state
        setFiles([]);
        setUploadProgress(0);
        setCurrentBatch(0);
        // Call onSuccess and wait for it to complete
        console.log('[PhotoUploadForm] Calling onSuccess callback');
        await onSuccess();
        console.log('[PhotoUploadForm] onSuccess callback completed');
      } else {
        console.error('[PhotoUploadForm] Photo processing failed', { result });
        throw new Error('Failed to process photos');
      }
    } catch (error: any) {
      console.error('[PhotoUploadForm] Error processing photos:', error);
      console.error('[PhotoUploadForm] Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        code: error.code,
        response: error.response ? {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        } : 'No response data'
      });
      setError(error.message || 'Failed to process photos');
      toast({
        variant: 'destructive',
        description: error.message || 'Failed to process photos'
      });
    } finally {
      console.log('[PhotoUploadForm] Upload process completed (success or failure)');
      setIsUploading(false);
      setUploadProgress(0);
      setCurrentBatch(0);
      setProcessedFiles(0);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Equipment Photos</CardTitle>
        <CardDescription>
          Upload photos of equipment to automatically extract equipment details. Photos will be processed in batches for optimal performance.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
            ${isDragActive ? 'border-emerald-500 bg-emerald-50' : 'border-border hover:border-emerald-500'}`}
        >
          <input {...getInputProps()} />
          <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {isDragActive
              ? 'Drop the photos here'
              : 'Drag and drop photos here, or click to select files'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Supported formats: JPEG, JPG, PNG, HEIC, HEIF
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {files.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Selected Photos ({files.length})</h4>
            <div className="space-y-1 max-h-[200px] overflow-y-auto">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-1 px-2 bg-muted/50 rounded-md"
                >
                  <span className="text-sm truncate flex-1">
                    {file.name} ({(file.size / (1024 * 1024)).toFixed(1)}MB)
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => removeFile(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {isUploading && uploadProgress > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Processing photos...</span>
              <span>{Math.round(uploadProgress)}%</span>
            </div>
            <Progress value={uploadProgress} className="h-2" />
            <p className="text-xs text-muted-foreground text-center">
              Processing batch {currentBatch} of {Math.ceil(files.length / 5)}
            </p>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={isUploading || files.length === 0}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload Photos
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};