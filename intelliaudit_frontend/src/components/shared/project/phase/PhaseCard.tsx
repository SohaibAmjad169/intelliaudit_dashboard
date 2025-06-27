import { FC, ReactNode, useRef, useEffect } from 'react';
import { Check, ArrowRight } from 'lucide-react';
import { cn } from '@/utils';
import gsap from 'gsap';
import { useTheme } from 'next-themes';

interface PhaseCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  isActive: boolean;
  isComplete: boolean;
  onClick: () => void;
  progress?: number;
}

export const PhaseCard: FC<PhaseCardProps> = ({
  icon,
  title,
  description,
  isActive,
  isComplete,
  onClick,
  progress,
}) => {
  const cardRef = useRef<HTMLButtonElement>(null);
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  // Add glow effect for active and completed cards
  useEffect(() => {
    if (!cardRef.current) return () => {};
    
    // Kill any existing animations
    gsap.killTweensOf(cardRef.current);
    
    if (isActive || isComplete) {
      const intensity = isActive ? 0.25 : 0.15;
      const color = isComplete ? 'rgba(16, 185, 129, ' : 'rgba(16, 185, 129, ';
      
      const tl = gsap.timeline({ repeat: -1, yoyo: true });
      
      tl.to(cardRef.current, {
        boxShadow: `0 0 12px ${color}${intensity})`,
        duration: 2,
        ease: 'sine.inOut'
      });
      
      // Return cleanup function
      return () => {
        if (cardRef.current) {
          gsap.killTweensOf(cardRef.current);
        }
      };
    }
    
    // Return empty cleanup function
    return () => {};
  }, [isActive, isComplete, isDarkMode]);

  return (
    <button
      ref={cardRef}
      onClick={onClick}
      className={cn(
        "group relative w-full p-4 rounded-lg border transition-all",
        "focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:ring-offset-2",
        "bg-card text-card-foreground hover:bg-accent/50",
        isActive 
          ? "border-emerald-500/50 bg-accent" 
          : isComplete 
            ? "border-emerald-500/30" 
            : "border-border"
      )}
    >
      <div className="flex items-start space-x-4">
        {/* Icon */}
        <div
          className={cn(
            "flex-shrink-0 p-2 rounded-lg transition-colors",
            isActive 
              ? "bg-emerald-500 text-white" 
              : isComplete
                ? "bg-emerald-500/20 text-emerald-500"
                : "bg-muted text-muted-foreground group-hover:bg-muted/80"
          )}
        >
          {icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3
              className={cn(
                "text-sm font-medium truncate",
                isActive 
                  ? "text-emerald-500" 
                  : isComplete
                    ? "text-emerald-500/80"
                    : "text-foreground"
              )}
            >
              {title}
            </h3>
            {isComplete ? (
              <Check className="w-4 h-4 text-emerald-500" />
            ) : isActive && (
              <ArrowRight className="w-4 h-4 text-emerald-500" />
            )}
          </div>
          
          <p className="mt-1 text-xs text-muted-foreground">
            {description}
          </p>

          {/* Progress bar */}
          {typeof progress === 'number' && (
            <div className="mt-3">
              <div className="h-1 rounded-full overflow-hidden bg-muted">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Subtle glow overlay for active cards */}
      {isActive && (
        <div className="absolute inset-0 rounded-lg pointer-events-none">
          <div className="absolute inset-0 rounded-lg bg-emerald-500/5 blur-sm" />
        </div>
      )}
    </button>
  );
};
