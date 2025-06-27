import React, { useEffect } from 'react';
import { cn } from '@/utils';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

export const Dialog: React.FC<DialogProps> = ({
  open,
  onClose,
  children,
  className
}) => {
  // Handle ESC key
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (open) {
      document.addEventListener('keydown', handleEsc);
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-50',
        'flex items-center justify-center',
        'bg-black/50 backdrop-blur-sm',
        className
      )}
      onClick={onClose}
    >
      <div 
        onClick={e => e.stopPropagation()}
        className="max-w-full max-h-full overflow-auto animate-in fade-in duration-200"
      >
        {children}
      </div>
    </div>
  );
}; 