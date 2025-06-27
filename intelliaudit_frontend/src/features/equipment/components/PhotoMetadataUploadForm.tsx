import React, { useState } from 'react';
import { 
  photoMetadataService, 
  ProcessPhotosRequest,
  PhotoToProcess 
} from '../../../services/equipment/photo-metadata';
import { useDropzone } from 'react-dropzone';
import { Upload, Check, Loader2, X, ImageIcon } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

// Import shadcn components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/components/ui/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

interface PhotoMetadataUploadFormProps {
  batchId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

/**
 * Component for uploading photos and processing them for metadata extraction
 */
export const PhotoMetadataUploadForm: React.FC<PhotoMetadataUploadFormProps> = ({
  batchId,
  onSuccess,
  onCancel
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [processedUrls, setProcessedUrls] = useState<string[]>([]);
  
  // Handle accepted files
  const handleAcceptedFiles = async (acceptedFiles: File[]) => {
    // Add all files directly, no need for client-side conversion
    setFiles(prev => [...prev, ...acceptedFiles]);
    
    if (acceptedFiles.length > 0) {
      toast({
        description: `Added ${acceptedFiles.length} photos for processing`,
      });
    }
  };
  
  // Configure dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp', '.heic', '.HEIC']
    },
    onDrop: acceptedFiles => {
      handleAcceptedFiles(acceptedFiles);
    }
  });

  // Remove a file from the list
  const removeFile = (index: number) => {
    setFiles(files => files.filter((_, i) => i !== index));
  };
  
  // Handle file upload
  const handleUpload = async () => {
    if (files.length === 0) {
      toast({
        variant: 'destructive',
        description: 'Please add photos before uploading'
      });
      return;
    }
    
    try {
      setUploading(true);
      
      // Create FormData with files for proper multipart upload
      const formData = new FormData();
      formData.append('batchId', batchId);
      
      // Prepare files for upload with proper UUIDs
      const uploadedPhotos: PhotoToProcess[] = files.map(file => {
        const photoId = uuidv4(); // Generate valid UUID for each photo
        formData.append('files', file); // Add to form data for actual upload
        
        return {
          id: photoId,
          file: file, // Send the actual file to backend
          name: file.name
        };
      });
      
      // Show upload starting message
      toast({
        title: 'Upload Started',
        description: `Starting upload of ${files.length} photos...`
      });
      
      // Process the uploaded photos
      await processPhotos(uploadedPhotos);
      
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setUploading(false);
    }
  };
  
  // Process photos for metadata extraction
  const processPhotos = async (photos: PhotoToProcess[]) => {
    try {
      setProcessing(true);
      setProcessedCount(0);
      setProcessedUrls([]);
      
      // Create the request payload
      const request: ProcessPhotosRequest = {
        batchId,
        photos
      };
      
      // Send the request to process photos
      const result = await photoMetadataService.processPhotos(request);
      
      // Update processed count
      setProcessedCount(result.processed);
      
      // Update processed URLs
      setProcessedUrls(photos.map(p => p.name || ''));
      
      // Show success message
      toast({
        title: 'Processing Complete',
        description: `Processed ${result.processed} out of ${result.total} photos successfully.`
      });
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Processing Failed',
        description: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setProcessing(false);
    }
  };
  
  // Progress percentage
  const calculateProgress = () => {
    if (files.length === 0) return 0;
    return Math.floor((processedCount / files.length) * 100);
  };
  
  // Render component
  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Photos for Batch Processing</CardTitle>
        <CardDescription>
          Upload photos to extract equipment metadata. Photos should clearly show equipment nameplates.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div 
          {...getRootProps()} 
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
            ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/20 hover:border-primary/50'}`}
        >
          <input {...getInputProps()} />
          <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-muted-foreground">
            {isDragActive
              ? 'Drop the photos here'
              : 'Click or drag files to this area to upload'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Support for multiple file formats: JPEG, PNG, GIF, HEIC
          </p>
        </div>
        
        {files.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">Selected Photos ({files.length})</h4>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setFiles([])}
                className="h-8 px-2 text-xs"
              >
                Clear All
              </Button>
            </div>
            <ScrollArea className="h-[150px]">
              <div className="space-y-1">
                {files.map((file, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between py-1 px-2 rounded-md bg-zinc-800/70 border border-zinc-700"
                  >
                    <div className="flex items-center space-x-2 overflow-hidden">
                      <ImageIcon className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                      <span className="text-sm truncate">{file.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
        
        {(uploading || processing) && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {uploading ? 'Uploading...' : 'Processing...'}
              </span>
              <span>{calculateProgress()}%</span>
            </div>
            <Progress value={calculateProgress()} className="h-2" />
          </div>
        )}
        
        {processedUrls.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Processed Photos</h4>
            <ScrollArea className="h-[150px]">
              <div className="space-y-1">
                {processedUrls.map((url, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between py-1 px-2 rounded-md bg-zinc-800/70 border border-zinc-700"
                  >
                    <div className="flex items-center space-x-2 overflow-hidden">
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-sm truncate">{url.split('/').pop()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
        
        <div className="flex justify-end space-x-2 pt-2">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={uploading || processing}
            className="bg-zinc-800 text-zinc-100 border border-zinc-700 hover:bg-zinc-700"
          >
            Cancel
          </Button>
          <Button
            variant="default"
            onClick={handleUpload}
            disabled={files.length === 0 || uploading || processing}
            className="bg-zinc-800 text-zinc-100 border border-zinc-700 hover:bg-zinc-700"
          >
            {uploading ? 'Uploading...' : processing ? 'Processing...' : 'Upload and Process'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}; 