import React from 'react';
import { BaseCard } from './BaseCard';
import { GlowWrapper } from '@/components/ui/glow-wrapper';
import { LucideIcon } from 'lucide-react';

interface GlowingCardProps {
  title: string;
  titleClassName?: string;
  icon?: LucideIcon;
  iconColor?: string;
  onEdit?: () => void;
  onDelete?: (e: React.MouseEvent) => void;
  onClick?: () => void;
  isDeleting?: boolean;
  children?: React.ReactNode;
  headerContent?: React.ReactNode;
  className?: string;
  glowIntensity?: "subtle" | "medium" | "strong";
  animated?: boolean;
}

/**
 * GlowingCard extends BaseCard with a green glowing effect
 */
export const GlowingCard: React.FC<GlowingCardProps> = ({
  title,
  titleClassName = '',
  icon,
  iconColor = 'text-emerald-500',
  onEdit,
  onDelete,
  onClick,
  isDeleting,
  children,
  headerContent,
  className = '',
  glowIntensity = "subtle",
  animated = true,
}) => {
  return (
    <GlowWrapper 
      intensity={glowIntensity} 
      animated={animated}
    >
      <BaseCard
        title={title}
        titleClassName={titleClassName}
        icon={icon || null}
        iconColor={iconColor}
        onEdit={onEdit}
        onDelete={onDelete}
        onClick={onClick}
        isDeleting={isDeleting}
        headerContent={headerContent}
        className={className}
      >
        {children}
      </BaseCard>
    </GlowWrapper>
  );
}; 