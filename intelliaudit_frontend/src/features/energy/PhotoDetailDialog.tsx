import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Photo } from '@/types/eco';
import { CheckIcon } from 'lucide-react';

interface PhotoDetailDialogProps {
  photo: Photo | null;
  onClose: () => void;
}

export const PhotoDetailDialog: React.FC<PhotoDetailDialogProps> = ({ photo, onClose }) => {
  if (!photo) return null;
   console.log(photo.url);
   
  return (
    <Dialog open={!!photo} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center pr-6">
            <div className="flex items-center gap-3">
              Photo Details
              {photo.category && (
                <Badge className="bg-emerald-500 text-white">
                  {photo.category}
                </Badge>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 py-2">
          {/* Image column */}
          <div className="flex flex-col">
            <div className="rounded-md overflow-hidden border border-muted/30 bg-black flex items-center justify-center max-h-[500px]">
              <img 
                src={photo.url} 
                alt={photo.caption || "Site inspection photo"} 
                className="max-w-full max-h-[500px]" 
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://via.placeholder.com/400x400?text=Image+Not+Available';
                  target.onerror = null;
                }}
              />
            </div>
          </div>

          {/* Details column */}
          <div className="flex flex-col space-y-4">
            <div className="space-y-4">
              <div className="p-4 rounded-md border border-muted/30 bg-muted/5 space-y-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  Photo Details
                  {photo.confidence && photo.confidence > 0.8 && (
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 flex items-center gap-1">
                      <CheckIcon className="w-3 h-3" />
                      High Confidence
                    </Badge>
                  )}
                </h3>
                
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  {photo.equipment_type && (
                    <div>
                      <p className="text-xs text-muted-foreground">Type</p>
                      <p className="font-medium">{photo.equipment_type}</p>
                    </div>
                  )}
                  
                  {photo.category && (
                    <div>
                      <p className="text-xs text-muted-foreground">Category</p>
                      <p className="font-medium">{photo.category}</p>
                    </div>
                  )}
                  
                  {photo.location && (
                    <div>
                      <p className="text-xs text-muted-foreground">Location</p>
                      <p className="font-medium">{photo.location}</p>
                    </div>
                  )}
                  
                  {(photo.manufacturer || photo.model) && (
                    <div>
                      <p className="text-xs text-muted-foreground">Make/Model</p>
                      <p className="font-medium">
                        {photo.manufacturer ? `${photo.manufacturer}` : ''}
                        {photo.model ? (photo.manufacturer ? ` ${photo.model}` : photo.model) : ''}
                      </p>
                    </div>
                  )}
                  
                  {photo.serial_number && (
                    <div>
                      <p className="text-xs text-muted-foreground">Serial Number</p>
                      <p className="font-medium">{photo.serial_number}</p>
                    </div>
                  )}
                  
                  {photo.specifications?.capacity && (
                    <div>
                      <p className="text-xs text-muted-foreground">Capacity</p>
                      <p className="font-medium">{photo.specifications.capacity}</p>
                    </div>
                  )}
                </div>
              </div>

              {photo.caption && (
                <div className="p-4 rounded-md border border-muted/30 bg-muted/5">
                  <h3 className="text-sm font-semibold mb-2">Caption/Notes</h3>
                  <p className="text-sm">{photo.caption}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 