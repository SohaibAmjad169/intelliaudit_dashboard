import { useState, useCallback, useEffect } from 'react';

interface UseAiAssistantOptions {
  onVoiceAssistantOpen?: () => void;
  onVoiceAssistantClose?: () => void;
}

export function useAiAssistant(options: UseAiAssistantOptions = {}) {
  const [isCommandBarOpen, setIsCommandBarOpen] = useState(false);
  const [isVoiceAssistantActive, setIsVoiceAssistantActive] = useState(false);
  
  const openCommandBar = useCallback(() => {
    setIsCommandBarOpen(true);
  }, []);
  
  const closeCommandBar = useCallback(() => {
    setIsCommandBarOpen(false);
  }, []);
  
  const toggleCommandBar = useCallback(() => {
    setIsCommandBarOpen(prev => !prev);
  }, []);
  
  const toggleVoiceAssistant = useCallback(() => {
    setIsVoiceAssistantActive(prev => {
      const newState = !prev;
      
      // Call the appropriate callback
      if (newState && options.onVoiceAssistantOpen) {
        options.onVoiceAssistantOpen();
      } else if (!newState && options.onVoiceAssistantClose) {
        options.onVoiceAssistantClose();
      }
      
      return newState;
    });
  }, [options]);
  
  // Set up keyboard shortcut for command bar (Cmd+K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggleCommandBar();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleCommandBar]);
  
  return {
    isCommandBarOpen,
    isVoiceAssistantActive,
    openCommandBar,
    closeCommandBar,
    toggleCommandBar,
    toggleVoiceAssistant
  };
}
