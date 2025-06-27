import React from 'react';
import { Box } from '@/components/ui/box';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Spinner } from '@/components/ui/spinner';
import { Camera, Zap, Sparkles, ClipboardList, FileText } from 'lucide-react';
import { PhotoUploadForm } from './components/PhotoUploadForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface EnrichOptionsProps {
  projectId: string;
  fieldNotes: string;
  setFieldNotes: (notes: string) => void;
  isProcessingNotes: boolean;
  fieldNotesError: string | null;
  fieldNotesSuccess: boolean;
  fieldNotesAlreadyEnhanced: boolean;
  showPhotoUpload: boolean;
  setShowPhotoUpload: (show: boolean) => void;
  onProcessFieldNotes: () => Promise<boolean>;
  onPhotoUploadSuccess: () => Promise<void>;
  onGenerateComprehensiveReport: () => Promise<void>;
  isGeneratingComprehensiveReport: boolean;
  comprehensiveReportSuccess: boolean;
  equipmentAnalysisData: any;
  photos: any[];
}

export const EnrichOptions: React.FC<EnrichOptionsProps> = ({
  projectId,
  fieldNotes,
  setFieldNotes,
  isProcessingNotes,
  fieldNotesError,
  fieldNotesSuccess,
  fieldNotesAlreadyEnhanced,
  showPhotoUpload,
  setShowPhotoUpload,
  onProcessFieldNotes,
  onPhotoUploadSuccess,
  onGenerateComprehensiveReport,
  isGeneratingComprehensiveReport,
  comprehensiveReportSuccess,
  equipmentAnalysisData,
  photos
}) => {
  return (
    <Box className="p-4 border border-emerald-500/30 bg-gradient-to-br from-emerald-50/10 to-teal-50/5">
      <h3 className="text-lg font-semibold mb-3 flex items-center">
        <Sparkles className="w-5 h-5 mr-2 text-emerald-500" />
        Enrich Your Energy Audit Data
      </h3>
      <p className="text-muted-foreground mb-4">
        Enhance your energy audit recommendations with additional field data. Our AI will analyze your inputs to provide more accurate and tailored suggestions.
      </p>
      
      <div className="mb-6 border-b border-emerald-500/20 pb-6">
        <h4 className="text-md font-medium mb-2 flex items-center">
          <ClipboardList className="w-4 h-4 mr-2 text-emerald-500" />
          Field Notes Analysis
        </h4>
        
        {fieldNotesAlreadyEnhanced ? (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-md text-emerald-700 mb-4">
            <div className="flex items-center mb-2">
              <Sparkles className="w-5 h-5 mr-2 text-emerald-600" />
              <span className="font-medium">Field notes have already been analyzed!</span>
            </div>
            <p className="text-sm text-emerald-600">
              Your field observations have been processed and incorporated into the energy recommendations.
              The analysis has been enhanced with the equipment and conditions you observed during your site visit.
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              Enter your observations from the site visit. Include details about equipment, conditions, and energy usage patterns.
            </p>
            
            <div className="space-y-4">
              <Textarea 
                placeholder="Example: Main office has 12 LED fixtures that are left on 24/7. Server room HVAC set to 65°F. Warehouse has 8 metal halide high-bay fixtures..."
                className="min-h-[120px] border-emerald-500/30 focus:border-emerald-500 focus:ring-emerald-500/20"
                value={fieldNotes}
                onChange={(e) => setFieldNotes(e.target.value)}
                disabled={isProcessingNotes}
              />
              
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <Button 
                  className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
                  onClick={onProcessFieldNotes}
                  disabled={isProcessingNotes || !fieldNotes.trim()}
                >
                  {isProcessingNotes ? (
                    <>
                      <Spinner className="w-4 h-4 mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Analyze Field Notes
                    </>
                  )}
                </Button>
              </div>
              
              {fieldNotesError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
                  {fieldNotesError}
                </div>
              )}
              
              {fieldNotesSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md text-emerald-600 text-sm">
                  Field notes successfully analyzed! The energy recommendations have been enhanced with your observations.
                </div>
              )}
            </div>
          </>
        )}
      </div>
      
      <div className="mb-6 border-b border-emerald-500/20 pb-6">
        <h4 className="text-md font-medium mb-2 flex items-center">
          <Camera className="w-4 h-4 mr-2 text-emerald-500" />
          Upload Photos
        </h4>
        <p className="text-sm text-muted-foreground mb-4">
          Upload photos of equipment, meters, and building features to enhance your energy audit.
        </p>
        <Button 
          variant="outline" 
          className="border-emerald-500/50 hover:bg-emerald-50 hover:text-emerald-700"
          onClick={() => setShowPhotoUpload(true)}
        >
          <Camera className="w-4 h-4 mr-2" />
          Select Photos
        </Button>
      </div>
      
      <div>
        <h4 className="text-md font-medium mb-2 flex items-center">
          <Sparkles className="w-4 h-4 mr-2 text-emerald-500" />
          Generate Comprehensive Report
        </h4>
        <p className="text-sm text-muted-foreground mb-4">
          Combine field notes and photo analysis to generate a comprehensive energy conservation report.
        </p>
        <Button 
          className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
          onClick={onGenerateComprehensiveReport}
          disabled={isGeneratingComprehensiveReport || (!equipmentAnalysisData && photos.length === 0)}
        >
          {isGeneratingComprehensiveReport ? (
            <>
              <Spinner className="w-4 h-4 mr-2" />
              Generating...
            </>
          ) : (
            <>
              <FileText className="w-4 h-4 mr-2" />
              Generate Comprehensive Report
            </>
          )}
        </Button>
        
        {comprehensiveReportSuccess && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-md text-emerald-600 text-sm">
            Comprehensive report successfully generated! The energy recommendations have been enhanced with both field notes and photo analysis.
          </div>
        )}
      </div>

      <Dialog open={showPhotoUpload} onOpenChange={setShowPhotoUpload}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Upload Equipment Photos</DialogTitle>
          </DialogHeader>
          <PhotoUploadForm
            projectId={projectId}
            onCancel={() => setShowPhotoUpload(false)}
            onSuccess={onPhotoUploadSuccess}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
}; 