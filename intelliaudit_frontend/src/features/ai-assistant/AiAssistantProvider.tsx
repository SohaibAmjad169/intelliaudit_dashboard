import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { AiCommandBar } from '../../components/ui/ai-command-bar';
import { useAiAssistant } from '../../hooks/useAiAssistant';
import { Button } from '../../components/ui/button';
import { MessageSquare } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { VoiceAssistant } from './VoiceAssistant';

// Context for the AI Assistant
type AiAssistantContextType = {
  openCommandBar: () => void;
  openVoiceAssistant: () => void;
};

const AiAssistantContext = createContext<AiAssistantContextType | undefined>(undefined);

export const useAiAssistantContext = () => {
  const context = useContext(AiAssistantContext);
  if (!context) {
    throw new Error('useAiAssistantContext must be used within an AiAssistantProvider');
  }
  return context;
};

type AiAssistantProviderProps = {
  children: ReactNode;
};

export const AiAssistantProvider = ({ children }: AiAssistantProviderProps) => {
  const [showVoiceAssistant, setShowVoiceAssistant] = useState(false);
  const { isDarkMode } = useTheme();
  
  // Use a simpler approach to extract projectId from URL that doesn't depend on Router context
  const [currentProjectId, setCurrentProjectId] = useState<string | undefined>(undefined);
  
  // Watch for URL changes to extract projectId
  useEffect(() => {
    const extractProjectId = () => {
      const path = window.location.pathname;
      
      // More robust project ID extraction with additional logging
      const matches = path.match(/\/projects\/([a-zA-Z0-9-]+)/);
      if (matches && matches[1]) {
        const extractedId = matches[1];
        console.log('Project ID extracted from URL:', extractedId);
        setCurrentProjectId(extractedId);
      } else {
        console.log('No project ID found in URL path:', path);
        setCurrentProjectId(undefined);
      }
    };
    
    // Run immediately
    extractProjectId();
    
    // Set up event listener for hash and path changes
    const handleRouteChange = () => {
      console.log('URL changed, re-extracting project ID');
      extractProjectId();
    };
    
    window.addEventListener('popstate', handleRouteChange);
    window.addEventListener('hashchange', handleRouteChange);
    
    // Also check when the component first mounts after a slight delay
    // This helps with SPA routing that might happen after initial render
    const timeoutId = setTimeout(extractProjectId, 500);
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
      window.removeEventListener('hashchange', handleRouteChange);
      clearTimeout(timeoutId);
    };
  }, []);
  
  // Log when projectId changes to help with debugging
  useEffect(() => {
    console.log('Current Project ID for AI Context:', currentProjectId);
  }, [currentProjectId]);
  
  const {
    isCommandBarOpen,
    isVoiceAssistantActive,
    openCommandBar,
    closeCommandBar,
    toggleVoiceAssistant
  } = useAiAssistant({
    onVoiceAssistantOpen: () => setShowVoiceAssistant(true),
    onVoiceAssistantClose: () => setShowVoiceAssistant(false)
  });
  
  const openVoiceAssistant = () => {
    setShowVoiceAssistant(true);
    if (!isVoiceAssistantActive) {
      toggleVoiceAssistant();
    }
  };
  
  return (
    <AiAssistantContext.Provider value={{ openCommandBar, openVoiceAssistant }}>
      {children}
      
      {/* Floating action button to open the command bar */}
      <Button
        onClick={openCommandBar}
        className={`fixed bottom-4 right-4 rounded-full w-12 h-12 shadow-lg ${
          isDarkMode ? 'bg-gray-800 hover:bg-gray-700 text-gray-200' : ''
        }`}
        size="icon"
        variant={isDarkMode ? "outline" : "default"}
      >
        <MessageSquare className="h-6 w-6" />
      </Button>
      
      {/* Command Bar - Pass projectId */}
      <AiCommandBar
        isOpen={isCommandBarOpen}
        onClose={closeCommandBar}
        projectId={currentProjectId}
      />
      
      {/* Voice Assistant */}
      {showVoiceAssistant && (
        <VoiceAssistant onClose={() => {
          setShowVoiceAssistant(false);
          if (isVoiceAssistantActive) {
            toggleVoiceAssistant();
          }
        }} />
      )}
    </AiAssistantContext.Provider>
  );
};
