import { useState, useEffect } from 'react';
import { Box } from '@/components/ui/box';
import { BarChart, AlertCircle, Loader2 } from 'lucide-react';

interface LoadingStatus {
  portfolioManager: 'pending' | 'loading' | 'error';
  weatherData: 'pending' | 'loading' | 'error';
  energyAudit?: 'pending' | 'loading' | 'error';
}

interface LoadingScreenProps {
  projectId?: string;
  onComplete?: () => void;
  status?: LoadingStatus;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  status = { portfolioManager: 'pending', weatherData: 'pending' }
}) => {
  const [loadingStatus, setLoadingStatus] = useState<LoadingStatus>(status);
  
  // Update status from props
  useEffect(() => {
    setLoadingStatus(status);
  }, [status]);

  // Get status message for utility data import
  const getStatusMessage = (status: 'pending' | 'loading' | 'error') => {
    if (status === 'pending') {
      return "Waiting...";
    } else if (status === 'loading') {
      return "Importing utility data...";
    } else {
      return "Error importing data";
    }
  };

  // Get status icon
  const getStatusIcon = (status: 'pending' | 'loading' | 'error') => {
    if (status === 'pending') {
      return <span className="text-muted-foreground">Waiting...</span>;
    } else if (status === 'loading') {
      return <Loader2 className="h-5 w-5 animate-spin text-emerald-500" />;
    } else {
      return <AlertCircle className="h-5 w-5 text-destructive" />;
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Box intensity="medium" className="p-8 bg-card max-w-md w-full">
        <div className="flex flex-col items-center">
          <h2 className="text-2xl font-semibold mb-6 text-center">
            Setting Up Your Project
          </h2>
          
          <div className="space-y-6 w-full">
            {/* Portfolio Manager Status - Only show utility data import */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${loadingStatus.portfolioManager === 'error' ? 'bg-destructive/10' : 'bg-emerald-500/10'}`}>
                  <BarChart className={`h-5 w-5 ${loadingStatus.portfolioManager === 'error' ? 'text-destructive' : 'text-emerald-500'}`} />
                </div>
                <div className="flex flex-col">
                  <span className="font-medium">Portfolio Manager Data</span>
                  <span className="text-xs text-muted-foreground">
                    {getStatusMessage(loadingStatus.portfolioManager)}
                  </span>
                </div>
              </div>
              
              <div>
                {getStatusIcon(loadingStatus.portfolioManager)}
              </div>
            </div>
          </div>
        </div>
      </Box>
    </div>
  );
} 