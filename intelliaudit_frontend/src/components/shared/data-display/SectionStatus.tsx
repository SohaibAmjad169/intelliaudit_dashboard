import React from 'react';
import { Lock } from 'lucide-react';
import { useTheme } from "@/hooks/useTheme";

export type SectionStatusType = 'not_started' | 'locked';

interface SectionStatusProps {
  status: SectionStatusType;
  lockReason?: string;
}

const SectionStatus: React.FC<SectionStatusProps> = ({ 
  status,
  lockReason
}) => {
  const { isDarkMode } = useTheme();

  const getStatusColor = () => {
    switch (status) {
      case 'locked':
        return isDarkMode ? 'text-gray-600' : 'text-gray-400';
      default:
        return isDarkMode ? 'text-gray-400' : 'text-gray-600';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'locked':
        return <Lock className="w-4 h-4" />;
      default:
        return <div className="w-4 h-4 rounded-full border-2 border-current" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'locked':
        return 'Locked';
      default:
        return 'Not Started';
    }
  };

  return (
    <div 
      className={`
        flex items-center gap-2 ${getStatusColor()}
        ${status === 'locked' ? 'cursor-help' : ''}
      `}
      title={status === 'locked' ? lockReason : undefined}
    >
      {getStatusIcon()}
      <span className="text-sm font-medium">
        {getStatusText()}
      </span>
    </div>
  );
};

export default SectionStatus;
