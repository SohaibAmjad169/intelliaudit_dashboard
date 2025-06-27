import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Zap, FileText, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/utils';
import { useTheme as useNextTheme } from 'next-themes';
import gsap from 'gsap';
import vertbuildLogo from '/assets/vertbuild-logo.svg';

interface SidebarProps {
  sidebarContent?: React.ReactNode;
  publicView?: boolean;
}

export default function Sidebar({ sidebarContent, publicView }: SidebarProps) {
  const location = useLocation();
  const { theme } = useNextTheme();
  const isDarkMode = theme === 'dark';
  const logoContainerRef = useRef<HTMLDivElement>(null);
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const savedState = localStorage.getItem('app_sidebar_collapsed');
    return savedState === 'true';
  });

  useEffect(() => {
    // Create power-up animation for the logo
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 3 });
    
    // Initial power line animation
    tl.fromTo(
      '.sidebar-power-line',
      { 
        width: '0%',
        opacity: 0
      },
      {
        width: '100%',
        opacity: isDarkMode ? 0.9 : 0.7,
        duration: 0.8,
        ease: 'power2.out'
      }
    )
    // Pulse effect for the icon
    .to('.logo-icon', {
      scale: 1.2,
      filter: 'drop-shadow(0 0 6px rgba(16, 185, 129, 0.8))',
      duration: 0.3,
      ease: 'power2.out'
    })
    .to('.logo-icon', {
      scale: 1,
      filter: 'drop-shadow(0 0 3px rgba(16, 185, 129, 0.5))',
      duration: 0.3,
      ease: 'power2.in'
    })
    // Glow effect
    .to('.logo-glow', {
      opacity: isDarkMode ? 0.8 : 0.6,
      scale: 1.2,
      duration: 0.4,
      ease: 'power2.out'
    })
    .to('.logo-glow', {
      opacity: isDarkMode ? 0.4 : 0.3,
      scale: 1,
      duration: 0.8,
      ease: 'power2.in'
    })
    // Outer ring pulse
    .fromTo('.logo-ring', 
      {
        scale: 0.8,
        opacity: 0
      },
      {
        scale: 1.5,
        opacity: isDarkMode ? 0.4 : 0.2,
        duration: 0.6,
        ease: 'power2.out'
      }
    )
    .to('.logo-ring', {
      scale: 2,
      opacity: 0,
      duration: 0.8,
      ease: 'power2.in'
    });
    
    // Create particles
    if (logoContainerRef.current) {
      const createParticle = () => {
        if (!logoContainerRef.current) return;
        
        const particle = document.createElement('div');
        particle.className = 'absolute w-1 h-1 rounded-full bg-emerald-400/60';
        
        // Random position around the logo
        const angle = Math.random() * Math.PI * 2;
        const radius = 12 + Math.random() * 5;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        
        particle.style.left = `calc(50% + ${x}px)`;
        particle.style.top = `calc(50% + ${y}px)`;
        
        logoContainerRef.current.appendChild(particle);
        
        // Animate particle
        gsap.to(particle, {
          x: x + (Math.random() - 0.5) * 30,
          y: y + (Math.random() - 0.5) * 30,
          opacity: 0,
          scale: 0,
          duration: 1 + Math.random() * 1.5,
          ease: 'power2.out',
          onComplete: () => {
            if (particle.parentNode) {
              particle.parentNode.removeChild(particle);
            }
          }
        });
      };
      
      // Create particles periodically
      const particleInterval = setInterval(() => {
        if (document.visibilityState === 'visible') {
          createParticle();
        }
      }, 300);
      
      return () => {
        tl.kill();
        clearInterval(particleInterval);
        
        // Clean up any remaining particles
        if (logoContainerRef.current) {
          const particles = logoContainerRef.current.querySelectorAll('div:not(.logo-icon):not(.logo-glow):not(.sidebar-power-line):not(.logo-ring)');
          particles.forEach(particle => {
            if (particle.parentNode) {
              particle.parentNode.removeChild(particle);
            }
          });
        }
      };
    }
    
    return () => {
      tl.kill();
    };
  }, [isDarkMode]);

  const toggleSidebar = () => {
    const newState = !sidebarCollapsed;
    setSidebarCollapsed(newState);
    localStorage.setItem('app_sidebar_collapsed', newState.toString());
  };

  // Render the collapsed sidebar with just icons
  if (sidebarCollapsed) {
    return (
      <div className="h-full flex flex-col transition-all duration-300 w-16 bg-card/95 backdrop-blur-sm">
        {/* Logo */}
        <div className="p-4 flex flex-col items-center">
          <Link to={publicView ? "javascript:void(0)" : "/"} className="mb-2">
            <div ref={logoContainerRef} className="logo-container relative flex items-center justify-center w-8 h-8 transition-all duration-300 overflow-visible">
              <div className="logo-ring absolute inset-0 rounded-full border border-emerald-400/30 opacity-0"></div>
              <div className="logo-glow absolute inset-0 rounded-full bg-gradient-to-br from-green-300/40 via-emerald-400/30 to-transparent opacity-40 blur-[4px]"></div>
              <Zap className="logo-icon w-5 h-5 text-emerald-400 drop-shadow-[0_0_3px_rgba(16,185,129,0.5)] relative z-10 transition-all" />
              <div className="sidebar-power-line absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-green-400 via-emerald-500 to-green-400 rounded-full shadow-[0_0_5px_rgba(16,185,129,0.7)]"></div>
            </div>
          </Link>
          <button 
            onClick={toggleSidebar}
            className="p-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white mt-2"
          >
            {/* <ChevronRight className="w-4 h-4" /> */}
            <PanelLeftOpen className="w-4 h-4" />
          </button>
        </div>
        
        {/* Navigation Icons */}
        <div className="flex-1 py-4">
          <nav className="space-y-2 px-2 flex flex-col h-full">
            {/* REMOVE the Link component below 
            <Link 
              to="/projects" 
              className={cn(
                "flex justify-center p-2 rounded-md",
                location.pathname === '/projects' || location.pathname === '/'
                  ? "bg-accent text-accent-foreground" 
                  : "text-muted-foreground hover:bg-accent/50"
              )}
            >
              <FileText className="w-5 h-5" />
            </Link>
            */}
          </nav>
        </div>
      </div>
    );
  }

  // Render the expanded sidebar
  return (
    <div className="h-full flex flex-col transition-all duration-300 w-64 bg-card/95 backdrop-blur-sm">
      {/* Logo and collapse button */}
      <div className="p-4 flex items-center justify-between">
        <Link to={publicView ? "javascript:void(0)" : "/"} className="flex items-center space-x-2 group">
          <div ref={logoContainerRef} className="logo-container relative flex items-center justify-center w-8 h-8 transition-all duration-300 overflow-visible">
            <div className="logo-ring absolute inset-0 rounded-full border border-emerald-400/30 opacity-0"></div>
            <div className="logo-glow absolute inset-0 rounded-full bg-gradient-to-br from-green-300/40 via-emerald-400/30 to-transparent opacity-40 blur-[4px]"></div>
            <Zap className="logo-icon w-5 h-5 text-emerald-400 drop-shadow-[0_0_3px_rgba(16,185,129,0.5)] relative z-10 transition-all" />
            <div className="sidebar-power-line absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-green-400 via-emerald-500 to-green-400 rounded-full shadow-[0_0_5px_rgba(16,185,129,0.7)]"></div>
          </div>
          <span className="logo-text text-lg font-semibold tracking-tight text-foreground group-hover:text-emerald-500 transition-colors">
            IntelliAudit
          </span>
        </Link>
        <button 
          onClick={toggleSidebar}
          className="p-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white ml-2"
        >
          {/* <ChevronLeft className="w-4 h-4" /> */}
          <PanelLeftClose className="w-4 h-4" />
        </button>
      </div>
      
      {/* If there's custom sidebar content, show it */}
      {sidebarContent ? (
        <div className="flex-1 flex flex-col overflow-auto">
          {sidebarContent}
        </div>
      ) : (
        /* Otherwise show the default navigation */
        <div className="flex-1 py-4">
          <nav className="space-y-1 px-2">
            <Link 
              to="/projects" 
              className={cn(
                "flex items-center px-3 py-2 rounded-md",
                location.pathname === '/projects' || location.pathname === '/'
                  ? "bg-accent text-accent-foreground" 
                  : "text-muted-foreground hover:bg-accent/50"
              )}
            >
              <FileText className="w-5 h-5 mr-3" />
              <span>Projects</span>
            </Link>
          </nav>
        </div>
      )}

      {/* Powered by vertbuild.ai */}
      <div className="mt-auto p-3 border-t border-border/50">
        <div className="flex items-center justify-center space-x-1.5 text-xs text-muted-foreground/70">
          <span>Powered by</span>
          <div className="relative">
            <img 
              src={vertbuildLogo} 
              alt="vertbuild.ai" 
              className="h-3 w-auto animate-pulse" 
            />
            <div className="absolute inset-0 bg-emerald-400/20 animate-[flash_2s_ease-in-out_infinite] rounded-full blur-sm"></div>
          </div>
        </div>
      </div>
    </div>
  );
} 