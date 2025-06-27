import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';

interface NavigationButtonsProps {
  currentPage: 'overview' | 'energy' | 'water' | 'rcx' | 'appendices' | 'next-steps';
}

export const NavigationButtons: React.FC<NavigationButtonsProps> = ({ currentPage }) => {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();

  const pageOrder = ['overview', 'energy', 'water', 'rcx', 'appendices', 'next-steps'] as const;
  const currentIndex = pageOrder.indexOf(currentPage);
  
  const pageLabels = {
    overview: 'Dashboard',
    energy: 'Energy Audit',
    water: 'Water Audit',
    rcx: 'Retro Commissioning',
    appendices: 'Appendices',
    'next-steps': 'Next Steps'
  };

  const getButtonColors = (page: typeof currentPage) => {
    switch (page) {
      case 'overview':
        return {
          bg: 'bg-blue-500',
          hover: 'hover:bg-blue-600',
          border: 'border-blue-500',
          text: 'text-blue-500'
        };
      case 'energy':
        return {
          bg: 'bg-yellow-500',
          hover: 'hover:bg-yellow-600',
          border: 'border-yellow-500',
          text: 'text-yellow-500'
        };
      case 'water':
        return {
          bg: 'bg-cyan-500',
          hover: 'hover:bg-cyan-600',
          border: 'border-cyan-500', 
          text: 'text-cyan-500'
        };
      case 'rcx':
        return {
          bg: 'bg-purple-500',
          hover: 'hover:bg-purple-600',
          border: 'border-purple-500',
          text: 'text-purple-500'
        };
      case 'appendices':
        return {
          bg: 'bg-gray-500',
          hover: 'hover:bg-gray-600',
          border: 'border-gray-500',
          text: 'text-gray-500'
        };
      case 'next-steps':
        return {
          bg: 'bg-green-500',
          hover: 'hover:bg-green-600',
          border: 'border-green-500',
          text: 'text-green-500'
        };
      default:
        return {
          bg: 'bg-emerald-500',
          hover: 'hover:bg-emerald-600',
          border: 'border-emerald-500',
          text: 'text-emerald-500'
        };
    }
  };

  const getPagePath = (page: string) => {
    if (page === 'overview') {
      return `/share/projects/${projectId}`;
    }
    return `/share/projects/${projectId}/${page}`;
  };

  const previousPage = currentIndex > 0 ? pageOrder[currentIndex - 1] : null;
  const nextPage = currentIndex < pageOrder.length - 1 ? pageOrder[currentIndex + 1] : null;

  const handleNavigation = (page: string) => {
    navigate(getPagePath(page));
  };

  return (
    <div className="flex items-center justify-between pt-4 mt-8 border-t border-border">
      {/* Previous Button */}
      {previousPage ? (
        <Button
          onClick={() => handleNavigation(previousPage)}
          className={`flex items-center gap-2 ${getButtonColors(previousPage).bg} ${getButtonColors(previousPage).hover} text-white hover:shadow-sm transition-all`}
        >
          <ArrowLeft className="h-4 w-4" />
          {pageLabels[previousPage]}
        </Button>
      ) : (
        <div></div>
      )}
      
      {/* Progress Dots - Simple */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground">
          {currentIndex + 1} of {pageOrder.length}
        </span>
        <div className="flex gap-1">
          {pageOrder.map((page, index) => (
            <button
              key={page}
              onClick={() => handleNavigation(page)}
              className={`rounded-full transition-all duration-200 ${
                index === currentIndex
                  ? 'w-6 h-2 bg-primary'
                  : index < currentIndex
                  ? 'w-2 h-2 bg-emerald-500'
                  : 'w-2 h-2 bg-muted hover:bg-muted-foreground/30'
              }`}
              title={pageLabels[page]}
            />
          ))}
        </div>
      </div>
      
      {/* Next Button */}
      {nextPage ? (
        <Button
          onClick={() => handleNavigation(nextPage)}
          className={`flex items-center gap-2 ${getButtonColors(nextPage).bg} ${getButtonColors(nextPage).hover} text-white hover:shadow-sm transition-all`}
        >
          {pageLabels[nextPage]}
          <ArrowRight className="h-4 w-4" />
        </Button>
      ) : (
        <div></div>
      )}
    </div>
  );
}; 