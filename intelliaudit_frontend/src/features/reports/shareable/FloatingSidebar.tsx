import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Menu, Download, X, PanelLeftOpen, PanelLeftClose } from 'lucide-react';
import { SectionState } from './SectionControls';
import { DndContext, DragEndEvent, closestCenter } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove
} from '@dnd-kit/sortable';
import { DraggableSection, getSectionItems } from './DraggableSections';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText } from 'lucide-react';

interface FloatingSidebarProps {
  visibleSections: SectionState;
  toggleSection: (section: keyof SectionState) => void;
  onDownloadPdf: () => void;
  onDownloadHtmlPdf?: () => void;
  onCollapseChange?: (collapsed: boolean) => void;
  onSectionOrderChange?: (orderedSections: Array<keyof SectionState>) => void;
}

export const FloatingSidebar: React.FC<FloatingSidebarProps> = ({
  visibleSections,
  toggleSection,
  onDownloadPdf,
  onDownloadHtmlPdf,
  onCollapseChange,
  onSectionOrderChange
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [sections, setSections] = useState(getSectionItems());
  const [activeSection, setActiveSection] = useState<string | null>(null);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle scroll spy
  useEffect(() => {
    const handleScroll = () => {
      const sectionElements = sections.map(section => ({
        id: section.id,
        element: document.getElementById(section.id)
      }));

      const currentSection = sectionElements.find(({ element }) => {
        if (!element) return false;
        const rect = element.getBoundingClientRect();
        return rect.top <= 100 && rect.bottom >= 100;
      });

      setActiveSection(currentSection?.id || null);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check
    return () => window.removeEventListener('scroll', handleScroll);
  }, [sections]);

  const handleToggleCollapse = () => {
    const newCollapsedState = !isCollapsed;
    setIsCollapsed(newCollapsedState);
    if (onCollapseChange) {
      onCollapseChange(newCollapsedState);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setSections((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        const newOrder = arrayMove(items, oldIndex, newIndex);

        if (onSectionOrderChange) {
          onSectionOrderChange(newOrder.map(item => item.id));
        }

        return newOrder;
      });
    }
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 80; // Adjust this value based on your header height
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });

      // Close mobile menu after clicking
      setIsMobileOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-white dark:bg-gray-800 shadow-lg"
        aria-label="Open menu"
      >
        <Menu className="h-6 w-6 text-gray-600 dark:text-gray-300" />
      </button>

      {/* Backdrop for mobile */}
      {isMobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full z-50 transition-all duration-300 ease-in-out
          ${isCollapsed ? 'w-12' : 'w-72'}
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <div className="h-full bg-white dark:bg-gray-800 shadow-lg flex flex-col">
          <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className={`font-medium text-gray-800 dark:text-gray-200 flex items-center ${isCollapsed ? 'hidden' : 'flex'}`}>
              <Menu className="h-4 w-4 mr-2" />
              Report Sections
            </h3>
            {/* Mobile close button */}
            <div className="flex items-center">
              <button
                onClick={() => setIsMobileOpen(false)}
                className="md:hidden mr-2 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
              {/* Desktop collapse button */}
              <button
                onClick={handleToggleCollapse}
                className="hidden md:block p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
                aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {isCollapsed ? (
                  // <ChevronRight className="h-5 w-5 text-gray-500" />
                  <PanelLeftOpen className="h-5 w-5 text-gray-500" />
                ) : (
                  // <ChevronLeft className="h-5 w-5 text-gray-500" />
                  <PanelLeftClose className="h-5 w-5 text-gray-500" />
                )}
              </button>
            </div>
          </div>

          <ScrollArea className={`flex-1 ${isCollapsed ? 'hidden' : 'block'}`}>
            <div className="p-3 space-y-2">
              <DndContext
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={sections.map(section => section.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {sections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => scrollToSection(section.id)}
                      className={`w-full text-left px-4 py-3 rounded-md transition-colors flex items-center gap-2
                        ${activeSection === section.id
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 font-medium'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300'
                        }`}
                    >
                      <FileText className="h-4 w-4 opacity-70" />
                      <span>{section.label}</span>
                    </button>
                  ))}
                </SortableContext>
              </DndContext>
            </div>
          </ScrollArea>

          <div className={`p-3 border-t border-gray-200 dark:border-gray-700 ${isCollapsed ? 'hidden' : 'block'}`}>
            <div className="space-y-2">
              <button
                onClick={onDownloadPdf}
                className="flex items-center w-full px-4 py-2 text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors"
              >
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </button>

              {onDownloadHtmlPdf && (
                <button
                  onClick={onDownloadHtmlPdf}
                  className="flex items-center w-full px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Enhanced PDF
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};