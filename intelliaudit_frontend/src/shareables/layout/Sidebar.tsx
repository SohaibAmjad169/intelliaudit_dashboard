import React, { useState, useEffect, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Zap, 
  Droplets, 
  Settings,
  FileText,
  CheckCircle,
  Menu,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useTheme as useNextTheme } from 'next-themes';
import gsap from 'gsap';
import { useMeasures } from '@/hooks/useMeasures';

interface SidebarProps {
  projectId: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ projectId }) => {
  const location = useLocation();
  const { theme } = useNextTheme();
  const isDarkMode = theme === 'dark';
  const logoContainerRef = useRef<HTMLDivElement>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [visitedSections, setVisitedSections] = useState<Set<string>>(new Set());
  
  // Get real project data
  const { eems, wems, rcms, isLoading } = useMeasures(projectId);

  // Calculate real metrics
  const allMeasures = [...eems, ...wems, ...rcms];
  const totalAnnualSavings = allMeasures.reduce((sum, m) => sum + (m.estimatedSavings?.cost || 0), 0);
  const totalProjectCost = allMeasures.reduce((sum, m) => {
    const cost = m.detailedCost?.total || 
      (m.estimatedSavings?.cost && m.estimatedSavings?.paybackPeriod
        ? m.estimatedSavings.cost * m.estimatedSavings.paybackPeriod
        : 0);
    return sum + cost;
  }, 0);
  const avgPayback = allMeasures.length > 0 
    ? allMeasures.reduce((sum, m) => sum + (m.estimatedSavings?.paybackPeriod || 0), 0) / allMeasures.length 
    : 0;

  // Track visited sections
  useEffect(() => {
    const storageKey = `audit-report-visited-${projectId}`;
    
    // Load visited sections from localStorage on mount
    const stored = localStorage.getItem(storageKey);
    let currentVisited = new Set<string>();
    
    if (stored) {
      try {
        const parsedVisited = JSON.parse(stored);
        currentVisited = new Set(parsedVisited);
      } catch (e) {
        console.warn('Failed to parse visited sections from localStorage');
      }
    }
    
    // Mark current section as visited
    const currentPath = location.pathname;
    if (!currentVisited.has(currentPath)) {
      currentVisited.add(currentPath);
      localStorage.setItem(storageKey, JSON.stringify([...currentVisited]));
    }
    
    setVisitedSections(currentVisited);
  }, [location.pathname, projectId]);

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

  const menuItems = [
    {
      label: 'Dashboard',
      icon: LayoutDashboard,
      path: `/share/projects/${projectId}`,
      description: 'Project overview and summary',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      hoverColor: 'hover:bg-blue-500/20',
      section: 'overview'
    },
    {
      label: 'Energy Audit',
      icon: Zap,
      path: `/share/projects/${projectId}/energy`,
      description: 'Energy efficiency analysis',
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
      hoverColor: 'hover:bg-yellow-500/20',
      section: 'audits'
    },
    {
      label: 'Water Audit',
      icon: Droplets,
      path: `/share/projects/${projectId}/water`,
      description: 'Water conservation assessment',
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-500/10',
      hoverColor: 'hover:bg-cyan-500/20',
      section: 'audits'
    },
    {
      label: 'Retro Commissioning',
      icon: Settings,
      path: `/share/projects/${projectId}/rcx`,
      description: 'Building system optimization',
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      hoverColor: 'hover:bg-purple-500/20',
      section: 'audits'
    },
    {
      label: 'Appendices',
      icon: FileText,
      path: `/share/projects/${projectId}/appendices`,
      description: 'Supporting documentation',
      color: 'text-gray-500',
      bgColor: 'bg-gray-500/10',
      hoverColor: 'hover:bg-gray-500/20',
      section: 'documentation'
    },
    {
      label: 'Next Steps',
      icon: CheckCircle,
      path: `/share/projects/${projectId}/next-steps`,
      description: 'Implementation support',
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      hoverColor: 'hover:bg-green-500/20',
      section: 'documentation'
    }
  ];

  // Group menu items by section
  const menuSections = [
    {
      title: 'Overview',
      items: menuItems.filter(item => item.section === 'overview'),
      icon: LayoutDashboard,
      color: 'text-blue-500'
    },
    {
      title: 'Technical Audits',
      items: menuItems.filter(item => item.section === 'audits'),
      icon: Zap,
      color: 'text-amber-500'
    },
    {
      title: 'Documentation & Next Steps',
      items: menuItems.filter(item => item.section === 'documentation'),
      icon: FileText,
      color: 'text-emerald-500'
    }
  ];

  const isActiveItem = (itemPath: string) => {
    if (itemPath === `/share/projects/${projectId}`) {
      // For overview, only match exact path
      return location.pathname === itemPath;
    }
    // For other items, match if path starts with the item path
    return location.pathname.startsWith(itemPath);
  };

  const SidebarContent = () => (
    <div className="h-full bg-card border-r border-border flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-center space-x-2 mb-3 group">
          <div ref={logoContainerRef} className="logo-container relative flex items-center justify-center w-8 h-8 transition-all duration-300 overflow-visible">
            <div className="logo-ring absolute inset-0 rounded-full border border-emerald-400/30 opacity-0"></div>
            <div className="logo-glow absolute inset-0 rounded-full bg-gradient-to-br from-green-300/40 via-emerald-400/30 to-transparent opacity-40 blur-[4px]"></div>
            <Zap className="logo-icon w-5 h-5 text-emerald-400 drop-shadow-[0_0_3px_rgba(16,185,129,0.5)] relative z-10 transition-all" />
            <div className="sidebar-power-line absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-green-400 via-emerald-500 to-green-400 rounded-full shadow-[0_0_5px_rgba(16,185,129,0.7)]"></div>
          </div>
          <span className="logo-text text-lg font-semibold tracking-tight text-foreground group-hover:text-emerald-500 transition-colors">
            IntelliAudit
          </span>
        </div>
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-50/30 via-blue-50/20 to-purple-50/30 dark:from-emerald-900/10 dark:via-blue-900/5 dark:to-purple-900/10 rounded-lg blur-sm"></div>
          <div className="relative bg-gradient-to-r from-background/80 to-background/60 backdrop-blur-sm rounded-lg px-3 py-2 border border-border/30">
            <div className="text-center space-y-1">
              <div className="text-xs font-bold bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 bg-clip-text text-transparent tracking-wide">
                ASHRAE LEVEL II
              </div>
              <div className="text-[10px] font-medium text-muted-foreground/80 leading-tight">
                Energy Audit • Water Audit • RCx Report
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-3">
        {menuSections.map((section, sectionIndex) => (
          <div key={section.title} className="space-y-1">
            {/* Section Header */}
            <div className="flex items-center gap-2 px-2 py-1 mb-2">
              <section.icon className={cn("h-3.5 w-3.5", section.color)} />
              <span className="text-xs font-semibold tracking-wide uppercase text-muted-foreground/80">
                {section.title}
              </span>
            </div>
            
            {/* Section Items */}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = isActiveItem(item.path);
                const isVisited = visitedSections.has(item.path);
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200",
                      "hover:scale-[1.02] hover:shadow-sm",
                      isActive 
                        ? cn(
                            "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-md",
                            "hover:from-primary/90 hover:to-primary/70"
                          )
                        : cn(
                            "text-muted-foreground hover:text-foreground",
                            item.hoverColor,
                            item.bgColor,
                            "hover:bg-opacity-100"
                          )
                    )}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <div className={cn(
                      "flex items-center justify-center w-8 h-8 rounded-md transition-all duration-200",
                      isActive 
                        ? "bg-white/20 shadow-sm" 
                        : cn(item.bgColor, "group-hover:scale-110")
                    )}>
                      <Icon className={cn(
                        "h-4 w-4 transition-all duration-200",
                        isActive 
                          ? "text-primary-foreground drop-shadow-sm" 
                          : cn(item.color, "group-hover:scale-110")
                      )} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={cn(
                        "font-medium truncate transition-colors",
                        isActive ? "text-primary-foreground" : "group-hover:text-foreground"
                      )}>
                        {item.label}
                      </div>
                      <div className={cn(
                        "text-xs truncate transition-colors",
                        isActive 
                          ? "text-primary-foreground/80" 
                          : "text-muted-foreground/70 group-hover:text-muted-foreground"
                      )}>
                        {item.description}
                      </div>
                    </div>
                    {isActive && (
                      <div className="w-1 h-6 bg-white/30 rounded-full" />
                    )}
                    {!isActive && isVisited && (
                      <div className="flex items-center justify-center w-5 h-5 bg-green-500/20 rounded-full">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
            
            {/* Section Divider */}
            {sectionIndex < menuSections.length - 1 && (
              <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent my-3" />
            )}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="mt-auto border-t border-border/50">
        {/* Mini Metrics Dashboard */}
        <div className="p-3 bg-gradient-to-r from-muted/30 to-muted/10">
          {!isLoading && allMeasures.length > 0 ? (
            <>
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="text-center">
                  <div className="flex items-center justify-center w-8 h-8 mx-auto mb-1 bg-green-500/10 rounded-lg">
                    <span className="text-xs font-bold text-green-500">$</span>
                  </div>
                  <div className="text-xs font-semibold text-green-600 dark:text-green-400">
                    ${Math.round(totalAnnualSavings / 1000)}K
                  </div>
                  <div className="text-[10px] text-muted-foreground leading-tight">Annual Savings</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center w-8 h-8 mx-auto mb-1 bg-blue-500/10 rounded-lg">
                    <span className="text-xs font-bold text-blue-500">⏱</span>
                  </div>
                  <div className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                    {avgPayback.toFixed(1)}yr
                  </div>
                  <div className="text-[10px] text-muted-foreground leading-tight">Avg Payback</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center w-8 h-8 mx-auto mb-1 bg-purple-500/10 rounded-lg">
                    <Zap className="h-3.5 w-3.5 text-purple-500" />
                  </div>
                  <div className="text-xs font-semibold text-purple-600 dark:text-purple-400">
                    {allMeasures.length}
                  </div>
                  <div className="text-[10px] text-muted-foreground leading-tight">Total Measures</div>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="mb-3">
                <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                  <span>Report Navigation</span>
                  <span>{visitedSections.size}/{menuItems.length} sections viewed</span>
                </div>
                <div className="w-full bg-muted/50 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-400 via-cyan-500 to-emerald-500 rounded-full transition-all duration-1000 ease-out" 
                    style={{ width: `${(visitedSections.size / menuItems.length) * 100}%` }} 
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="text-xs text-muted-foreground">
                {isLoading ? 'Loading project data...' : 'No measures data available'}
              </div>
            </div>
          )}
        </div>
        
        {/* Vertbuild Branding */}
        <div className="p-3">
          <div className="flex items-center justify-center space-x-1.5 text-xs text-muted-foreground/70">
            <span>Powered by</span>
            <div className="relative">
              <img 
                src="/assets/vertbuild-logo.svg" 
                alt="vertbuild.ai" 
                className="h-3 w-auto opacity-80 hover:opacity-100 transition-opacity" 
              />
              <div className="absolute inset-0 bg-emerald-400/20 animate-[pulse_3s_ease-in-out_infinite] rounded-full blur-sm"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="bg-background/80 backdrop-blur-sm"
        >
          {isMobileMenuOpen ? (
            <X className="h-4 w-4" />
          ) : (
            <Menu className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-64 h-full">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar */}
      <div className={cn(
        "lg:hidden fixed left-0 top-0 h-full w-64 z-50 transform transition-transform duration-200 ease-in-out",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <SidebarContent />
      </div>
    </>
  );
}; 