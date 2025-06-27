import React, { createContext, useContext, useState, useCallback } from 'react';

interface CollapsibleContextType {
  expandedSections: Set<string>;
  toggleSection: (id: string) => void;
  toggleAll: (expanded: boolean) => void;
  registerSection: (id: string, defaultOpen: boolean) => void;
  isExpanded: (id: string) => boolean;
}

const CollapsibleContext = createContext<CollapsibleContextType | undefined>(undefined);

export const CollapsibleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [registeredSections, setRegisteredSections] = useState<Set<string>>(new Set());

  const registerSection = useCallback((id: string, defaultOpen: boolean) => {
    setRegisteredSections(prev => {
      const newSet = new Set(prev);
      newSet.add(id);
      return newSet;
    });
    if (defaultOpen) {
      setExpandedSections(prev => {
        const newSet = new Set(prev);
        newSet.add(id);
        return newSet;
      });
    }
  }, []);

  const toggleSection = useCallback((id: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const toggleAll = useCallback((expanded: boolean) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      registeredSections.forEach(id => {
        if (expanded) {
          newSet.add(id);
        } else {
          newSet.delete(id);
        }
      });
      return newSet;
    });
  }, [registeredSections]);

  const isExpanded = useCallback((id: string) => expandedSections.has(id), [expandedSections]);

  return (
    <CollapsibleContext.Provider value={{ 
      expandedSections, 
      toggleSection, 
      toggleAll, 
      registerSection,
      isExpanded 
    }}>
      {children}
    </CollapsibleContext.Provider>
  );
};

export const useCollapsible = () => {
  const context = useContext(CollapsibleContext);
  if (!context) {
    throw new Error('useCollapsible must be used within a CollapsibleProvider');
  }
  return context;
};
