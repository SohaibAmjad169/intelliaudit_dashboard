import React, { useState, useEffect } from 'react';
import { Loader2, RefreshCw, Lightbulb } from 'lucide-react';
import { Box } from '@/components/ui/box';
import { Button } from '@/components/ui/button';
import { MeasuresView } from './MeasuresView';
import { generateMeasureRecommendations, fetchExistingMeasures } from '@/services/energy-analysis/measures-service';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

interface ECMsProps {
  projectId: string;
  publicView?: boolean;
}

export const ECMs: React.FC<ECMsProps> = ({ projectId, publicView }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatedMeasures, setGeneratedMeasures] = useState<{
    eems: any[];
    wems: any[];
    rcms: any[];
    customMeasures: any[];
  }>({
    eems: [],
    wems: [],
    rcms: [],
    customMeasures: []
  });
  const { toast } = useToast();
  
  // Fetch existing measures when component mounts
  useEffect(() => {
    const loadExistingMeasures = async () => {
      try {
        setIsLoading(true);
        console.log('Fetching measures for project:', projectId);
        const existingMeasures = await fetchExistingMeasures(projectId);
        
        console.log('Raw response from API:', existingMeasures);
        
        // Check if we have any measures
        const totalMeasures = 
          (existingMeasures.eems?.length || 0) + 
          (existingMeasures.wems?.length || 0) + 
          (existingMeasures.rcms?.length || 0) + 
          (existingMeasures.customMeasures?.length || 0);
        
        console.log('Total measures found:', totalMeasures);
          
        if (totalMeasures > 0) {
          console.log('Setting measures in state:', existingMeasures);
          setGeneratedMeasures(existingMeasures);
        } else {
          console.log('No measures found in response');
        }
      } catch (err) {
        console.error('Error loading existing measures:', err);
        setError('Failed to load existing measures. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadExistingMeasures();
  }, [projectId]);

  // Function to generate Energy Conservation Measures
  const handleGenerateECMs = async () => {
    try {
      setIsGenerating(true);
      setError(null);

      toast({
        title: 'Generating Energy Conservation Measures',
        description: 'This may take a moment...',
      });

      // Call the measures generation API with just the project ID
      // The backend will fetch equipment data using the project ID
      const result = await generateMeasureRecommendations(projectId);

      // Ensure the result has all required arrays
      const safeMeasures = {
        eems: Array.isArray(result.eems) ? result.eems : [],
        wems: Array.isArray(result.wems) ? result.wems : [],
        rcms: Array.isArray(result.rcms) ? result.rcms : [],
        customMeasures: Array.isArray(result.customMeasures) ? result.customMeasures : []
      };

      setGeneratedMeasures(safeMeasures);

      const totalMeasures = 
        safeMeasures.eems.length + 
        safeMeasures.wems.length + 
        safeMeasures.rcms.length + 
        safeMeasures.customMeasures.length;

      toast({
        title: 'Energy Conservation Measures Generated',
        description: `Generated ${totalMeasures} measures for your facility.`,
      });
    } catch (err) {
      console.error('Error generating ECMs:', err);
      setError('Failed to generate Energy Conservation Measures. Please try again.');
      
      toast({
        title: 'Error',
        description: 'Failed to generate measures. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        <span className="ml-2">Loading measures...</span>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button onClick={handleGenerateECMs}>
            Retry Generating Measures
          </Button>
        </div>
      </div>
    );
  }

  const hasMeasures = (generatedMeasures.eems?.length > 0) || 
                      (generatedMeasures.wems?.length > 0) || 
                      (generatedMeasures.rcms?.length > 0) || 
                      (generatedMeasures.customMeasures?.length > 0);
  
  console.log('Current measures state:', generatedMeasures);
  console.log('hasMeasures:', hasMeasures);

  return (
    <div className="space-y-6">
      {!hasMeasures ? (
        <Box className="p-6 min-h-[400px] flex flex-col items-center justify-center">
          <Lightbulb className="h-16 w-16 text-emerald-500 mb-6" />
          <h2 className="text-2xl font-bold mb-4 text-center">
            Generate Energy Conservation Measures
          </h2>
          <p className="text-muted-foreground mb-6 max-w-lg text-center">
            Now that you've collected equipment data, utility information, and site details, 
            you can generate tailored Energy Conservation Measures for this facility.
          </p>
          {!publicView && (
          <Button 
            size="lg" 
            onClick={handleGenerateECMs} 
            disabled={isGenerating}
            className="px-6 font-semibold"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Measures...
              </>
            ) : (
              <>
                <Lightbulb className="mr-2 h-4 w-4" />
                Generate Energy Conservation Measures
              </>
            )}
          </Button>
          )}
        </Box>
      ) : (
        <div className="space-y-6">
          <MeasuresView 
            projectId={projectId}
            initialMeasures={generatedMeasures}
            publicView={publicView}
          />
        </div>
      )}
    </div>
  );
};