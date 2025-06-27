import React, { useEffect, useRef } from "react";
import { cn } from "@/utils";
import gsap from "gsap";
import { useTheme } from "next-themes";

interface GlowWrapperProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  intensity?: "subtle" | "medium" | "strong";
  animated?: boolean;
  className?: string;
  wrapperClassName?: string;
}

/**
 * GlowWrapper adds a green glowing effect to any component
 * 
 * @param intensity - Controls the strength of the glow effect (subtle, medium, strong)
 * @param animated - Whether the glow effect should animate
 * @param className - Additional classes for the inner content
 * @param wrapperClassName - Additional classes for the outer wrapper
 */
export function GlowWrapper({
  children,
  intensity = "medium",
  animated = true,
  className = "",
  wrapperClassName,
  ...props
}: GlowWrapperProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";

  // Define glow intensity levels
  const intensityMap = {
    subtle: {
      shadowSize: "sm",
      animationIntensity: 0.3,
    },
    medium: {
      shadowSize: "md",
      animationIntensity: 0.5,
    },
    strong: {
      shadowSize: "lg",
      animationIntensity: 0.7,
    },
  };

  const { shadowSize, animationIntensity } = intensityMap[intensity];

  // Shadow classes based on intensity
  const shadowClass: Record<string, string> = {
    sm: "shadow-[0_0_10px_rgba(16,185,129,0.15)]",
    md: "shadow-[0_0_15px_rgba(16,185,129,0.25)]",
    lg: "shadow-[0_0_20px_rgba(16,185,129,0.35)]",
  };

  useEffect(() => {
    if (animated && wrapperRef.current) {
      const tl = gsap.timeline({ repeat: -1, yoyo: true });
      
      tl.to(wrapperRef.current, {
        boxShadow: `0 0 ${15 + 10 * animationIntensity}px ${5 * animationIntensity}px rgba(16, 185, 129, ${0.2 + 0.2 * animationIntensity})`,
        duration: 2,
        ease: "sine.inOut"
      });
      
      return () => {
        tl.kill();
      };
    }
    
    // Return empty cleanup function when conditions aren't met
    return () => {};
  }, [animated, animationIntensity, isDarkMode]);

  return (
    <div 
      ref={wrapperRef}
      className={cn(
        "relative rounded-xl transition-all duration-300",
        shadowClass[shadowSize as keyof typeof shadowClass],
        animated ? "hover:shadow-[0_0_25px_rgba(16,185,129,0.4)]" : "",
        wrapperClassName
      )}
      {...props}
    >
      <div 
        className={cn(
          "relative rounded-xl overflow-hidden",
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * GlowCard adds a green glowing effect to a card component
 */
export function GlowCard({
  children,
  intensity = "medium",
  animated = true,
  className = "",
  ...props
}: GlowWrapperProps) {
  return (
    <GlowWrapper 
      intensity={intensity} 
      animated={animated} 
      className={className}
      {...props}
    >
      {children}
    </GlowWrapper>
  );
}

/**
 * GlowTable adds a green glowing effect to a table component
 */
export function GlowTable({
  children,
  intensity = "medium",
  animated = true,
  className = "",
  ...props
}: GlowWrapperProps) {
  return (
    <GlowWrapper 
      intensity={intensity} 
      animated={animated} 
      className={className}
      {...props}
    >
      {children}
    </GlowWrapper>
  );
} 