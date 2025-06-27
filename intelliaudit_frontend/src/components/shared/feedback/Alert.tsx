import React from 'react';
import {
  Alert as ShadcnAlert,
  AlertDescription,
  AlertTitle,
} from "../../../components/ui/alert";
import { cn } from '@/utils';
import { 
  AlertCircle, 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  XCircle 
} from 'lucide-react';

export type AlertVariant = 'default' | 'success' | 'warning' | 'error' | 'info';

interface AlertProps {
  title?: React.ReactNode;
  children: React.ReactNode;
  variant?: AlertVariant;
  className?: string;
  icon?: React.ReactNode;
}

export const Alert: React.FC<AlertProps> = ({
  title,
  children,
  variant = 'default',
  className,
  icon,
}) => {
  const getVariantStyles = (): string => {
    switch (variant) {
      case 'success':
        return 'border-green-500 text-green-800 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
      case 'warning':
        return 'border-yellow-500 text-yellow-800 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20';
      case 'error':
        return 'border-red-500 text-red-800 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
      case 'info':
        return 'border-blue-500 text-blue-800 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20';
      default:
        return '';
    }
  };

  const getIcon = () => {
    if (icon) return icon;

    switch (variant) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />;
      default:
        return <AlertCircle className="h-5 w-5" />;
    }
  };

  return (
    <ShadcnAlert className={cn(getVariantStyles(), className)}>
      {getIcon()}
      <div>
        {title && <AlertTitle>{title}</AlertTitle>}
        <AlertDescription>{children}</AlertDescription>
      </div>
    </ShadcnAlert>
  );
}; 