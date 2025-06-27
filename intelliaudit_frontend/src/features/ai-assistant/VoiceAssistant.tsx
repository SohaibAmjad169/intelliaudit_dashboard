import { useEffect, useState } from 'react';
import { Button } from '../../components/ui/button';
import { Loader2, Mic, MicOff, X } from 'lucide-react';
import { getConnectionDetails, type ConnectionDetails } from '../../services/ai/aiCommandService';

interface VoiceAssistantProps {
  onClose: () => void;
}

export function VoiceAssistant({ onClose }: VoiceAssistantProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [, setConnectionDetails] = useState<ConnectionDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Connect to the voice assistant when the component mounts
  useEffect(() => {
    const connectToAssistant = async () => {
      setIsConnecting(true);
      setError(null);
      
      try {
        // Fetch connection details from the API using our client
        const details = await getConnectionDetails();
        setConnectionDetails(details);
        setIsConnected(true);
        
        // Here you would connect to LiveKit using the connection details
        console.log('Connecting to LiveKit with:', details);
        
      } catch (err) {
        console.error('Error connecting to voice assistant:', err);
        setError(err instanceof Error ? err.message : 'Unknown error connecting to voice assistant');
      } finally {
        setIsConnecting(false);
      }
    };
    
    connectToAssistant();
    
    // Clean up when the component unmounts
    return () => {
      // Any cleanup code for disconnecting from LiveKit would go here
      console.log('Disconnecting from LiveKit');
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      
      {/* Voice Assistant Modal */}
      <div className="relative bg-card dark:bg-card p-6 rounded-lg shadow-xl max-w-md w-full border border-border dark:border-border">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-foreground dark:text-foreground">IntelliAudit Voice Assistant</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {error ? (
          <div className="bg-destructive/10 dark:bg-destructive/20 border border-destructive/20 dark:border-destructive/30 p-4 rounded-md mb-4">
            <p className="text-destructive dark:text-destructive text-sm">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </div>
        ) : isConnecting ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-12 w-12 animate-spin text-emerald-500 dark:text-emerald-400 mb-4" />
            <p className="text-muted-foreground dark:text-muted-foreground">Connecting to voice assistant...</p>
          </div>
        ) : isConnected ? (
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-4">
              <Mic className="h-12 w-12 text-emerald-500 dark:text-emerald-400" />
            </div>
            
            <p className="text-center mb-6 text-foreground dark:text-foreground">
              I'm listening! Ask me anything about your energy audit or building efficiency.
            </p>
            
            <div className="flex space-x-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  // In a real implementation, this would mute/unmute the microphone
                  console.log('Toggle mute');
                }}
              >
                <MicOff className="h-4 w-4 mr-2" />
                Mute
              </Button>
              
              <Button 
                variant="default" 
                onClick={onClose}
              >
                End Conversation
              </Button>
            </div>
            
            {/* This is where we would render the LiveKit components */}
            {/* For now, we'll just show a placeholder */}
            <div className="mt-8 w-full">
              <p className="text-xs text-gray-500 text-center">
                Voice assistant is active. This is a placeholder for the LiveKit integration.
              </p>
              <p className="text-xs text-gray-500 text-center mt-1">
                In a complete implementation, this would connect to your ai-agent service.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8">
            <p className="text-gray-500">Could not initialize voice assistant.</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
