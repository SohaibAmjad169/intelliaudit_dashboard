import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { PhotoUploadForm } from './PhotoUploadForm';

interface DialogsProps {
  showFieldNotes: boolean;
  showPhotoUpload: boolean;
  showEndUseBreakdown: boolean;
  onCloseFieldNotes: () => void;
  onClosePhotoUpload: () => void;
  onCloseEndUseBreakdown: () => void;
  fieldNotes: string;
  fieldNotesError: string | null;
  isProcessingNotes: boolean;
  onFieldNotesChange: (value: string) => void;
  onProcessFieldNotes: () => void;
  projectId: string;
  onPhotoUploadSuccess: () => Promise<void>;
}

export const Dialogs: React.FC<DialogsProps> = ({
  showFieldNotes,
  showPhotoUpload,
  showEndUseBreakdown,
  onCloseFieldNotes,
  onClosePhotoUpload,
  onCloseEndUseBreakdown,
  fieldNotes,
  fieldNotesError,
  isProcessingNotes,
  onFieldNotesChange,
  onProcessFieldNotes,
  projectId,
  onPhotoUploadSuccess
}) => {
  return (
    <>
      {/* Field Notes Dialog */}
      <Dialog open={showFieldNotes} onOpenChange={onCloseFieldNotes}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Upload Field Notes</DialogTitle>
            <DialogDescription>
              Paste your field notes here to automatically extract equipment information.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <textarea
              className="w-full p-4 rounded-md bg-zinc-950 border border-zinc-800 text-zinc-100 text-sm placeholder:text-zinc-600 min-h-[300px]"
              placeholder="Paste your field notes here..."
              value={fieldNotes}
              onChange={(e) => onFieldNotesChange(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onCloseFieldNotes}>
                Cancel
              </Button>
              <Button 
                onClick={onProcessFieldNotes}
                disabled={isProcessingNotes || !fieldNotes}
                className="bg-emerald-500 hover:bg-emerald-600 text-white"
              >
                {isProcessingNotes ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Process Field Notes"
                )}
              </Button>
            </div>
            {fieldNotesError && (
              <div className="p-2 bg-red-500/10 text-red-400 rounded border border-red-500/20">
                {fieldNotesError}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Photo Upload Dialog */}
      <Dialog open={showPhotoUpload} onOpenChange={onClosePhotoUpload}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Upload Equipment Photos</DialogTitle>
          </DialogHeader>
          <PhotoUploadForm
            projectId={projectId}
            onCancel={onClosePhotoUpload}
            onSuccess={onPhotoUploadSuccess}
          />
        </DialogContent>
      </Dialog>

      {/* End Use Breakdown Dialog */}
      <Dialog open={showEndUseBreakdown} onOpenChange={onCloseEndUseBreakdown}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Energy Use Breakdown</DialogTitle>
            <DialogDescription>
              Analyze your energy usage by equipment type and category.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-center text-muted-foreground">
              Energy breakdown visualization will appear here.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}; 