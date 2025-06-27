import React from 'react';
import {
  Avatar as ShadcnAvatar,
  AvatarFallback,
  AvatarImage,
} from "../../../components/ui/avatar";
import { cn } from '@/utils';
import { User } from 'lucide-react';

interface AvatarProps {
  src?: string;
  alt?: string;
  fallback?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = '',
  fallback,
  className,
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  };

  const getFallback = () => {
    if (fallback) return fallback;
    if (alt) {
      const initials = alt
        .split(' ')
        .map(name => name[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
      return initials;
    }
    return <User className="h-5 w-5" />;
  };

  return (
    <ShadcnAvatar className={cn(sizeClasses[size], className)}>
      <AvatarImage src={src} alt={alt} />
      <AvatarFallback>
        {getFallback()}
      </AvatarFallback>
    </ShadcnAvatar>
  );
}; 