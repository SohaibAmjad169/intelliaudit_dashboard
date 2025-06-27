import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Building2, 
  TrendingUp, 
  Wrench, 
  FileText,
  ChevronRight,
  BarChart3,
  Lightbulb,
  Gauge,
  ExternalLink,
  Fan,
  AlertTriangle,
  CheckCircle,
  Flame,
  Sparkles
} from 'lucide-react';
import { useProjectOverview } from '../hooks/useProjectOverview';
import { useMeasures } from '@/hooks/useMeasures';
import { formatEnergy } from '../utils/format';
import { NavigationButtons } from '../components/NavigationButtons';

// Import existing detailed components
import { RetroCommissioningReport } from '@/features/reports/shareable/RetroCommissioning/RetroCommissioningReport';
import { RetroCommissioningMeasures } from '@/features/reports/shareable/RetroCommissioning/RetroCommissioningMeasures';
import { MeasuresView } from '@/features/energy/MeasuresView';

// Reusable Callout Badge component
interface CalloutBadgeProps {
  type: 'success' | 'warning' | 'alert' | 'priority' | 'info';
  text: string;
  pulse?: boolean;
}

const CalloutBadge: React.FC<CalloutBadgeProps> = ({ type, text, pulse = false }) => {
  const baseClasses = "absolute -top-3 -right-3 px-2 py-1 text-xs font-bold rounded-full shadow-lg z-20 flex items-center gap-1 border-2 border-white dark:border-gray-800";
  
  const typeStyles = {
    success: "bg-green-500 text-white",
    warning: "bg-yellow-500 text-white", 
    alert: "bg-red-500 text-white",
    priority: "bg-blue-500 text-white",
    info: "bg-purple-500 text-white"
  };

  const icons = {
    success: CheckCircle,
    warning: AlertTriangle,
    alert: AlertTriangle,
    priority: Sparkles,
    info: Settings
  };

  const Icon = icons[type];
  
  return (
    <div className={`${baseClasses} ${typeStyles[type]} ${pulse ? 'animate-pulse' : ''}`}>
      <Icon className="h-3 w-3" />
      <span>{text}</span>
    </div>
  );
};

// Drill-down modal component
interface DrillDownModalProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const DrillDownModal: React.FC<DrillDownModalProps> = ({ title, isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-background border border-border rounded-lg shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-border bg-muted/30">
          <h2 className="text-2xl font-bold text-foreground">{title}</h2>
          <Button variant="ghost" onClick={onClose} className="hover:bg-muted">✕</Button>
        </div>
        <div className="p-6 bg-background">
          {children}
        </div>
      </div>
    </div>
  );
};

// Top-level summary card component
interface SummaryCardProps {
  title: string;
  icon: React.ComponentType<any>;
  summary: string;
  metrics?: { label: string; value: string }[];
  onDrillDown: () => void;
  badge?: string;
  callout?: {
    type: 'success' | 'warning' | 'alert' | 'priority' | 'info';
    text: string;
    pulse?: boolean;
  };
}

const SummaryCard: React.FC<SummaryCardProps> = ({ 
  title, 
  icon: Icon, 
  summary, 
  metrics = [], 
  onDrillDown, 
  badge,
  callout
}) => {
  // Dynamic styling based on card title for more visual variety
  const getCardStyling = (title: string) => {
    if (title.includes('System') || title.includes('Assessment')) {
      return "border-orange-300 bg-gradient-to-br from-orange-50 via-white to-orange-50 dark:from-orange-950/10 dark:via-background dark:to-orange-950/10 hover:shadow-orange-200/50";
    } else if (title.includes('Performance') || title.includes('Testing')) {
      return "border-blue-300 bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-blue-950/10 dark:via-background dark:to-blue-950/10 hover:shadow-blue-200/50";
    } else if (title.includes('HVAC') || title.includes('Optimization')) {
      return "border-red-300 bg-gradient-to-br from-red-50 via-white to-red-50 dark:from-red-950/10 dark:via-background dark:to-red-950/10 hover:shadow-red-200/50";
    } else if (title.includes('Controls') || title.includes('Assessment')) {
      return "border-gray-300 bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950/10 dark:via-background dark:to-gray-950/10 hover:shadow-gray-200/50";
    } else if (title.includes('RCx') || title.includes('Measures')) {
      return "border-green-300 bg-gradient-to-br from-green-50 via-white to-green-50 dark:from-green-950/10 dark:via-background dark:to-green-950/10 hover:shadow-green-200/50";
    } else if (title.includes('Implementation') || title.includes('Plan')) {
      return "border-purple-300 bg-gradient-to-br from-purple-50 via-white to-purple-50 dark:from-purple-950/10 dark:via-background dark:to-purple-950/10 hover:shadow-purple-200/50";
    }
    return "border-slate-300 bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950/10 dark:via-background dark:to-slate-950/10 hover:shadow-slate-200/50";
  };

  const getIconColor = (title: string) => {
    if (title.includes('System') || title.includes('Assessment')) return "text-orange-600";
    if (title.includes('Performance') || title.includes('Testing')) return "text-blue-600";
    if (title.includes('HVAC') || title.includes('Optimization')) return "text-red-600";
    if (title.includes('Controls')) return "text-gray-600";
    if (title.includes('RCx') || title.includes('Measures')) return "text-green-600";
    if (title.includes('Implementation') || title.includes('Plan')) return "text-purple-600";
    return "text-slate-600";
  };

  return (
    <Card className={`h-full flex flex-col relative overflow-visible transition-all duration-300 hover:shadow-lg ${getCardStyling(title)}`}>
      {callout && (
        <CalloutBadge 
          type={callout.type} 
          text={callout.text} 
          pulse={callout.pulse} 
        />
      )}
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className={`h-5 w-5 ${getIconColor(title)}`} />
            <span className="text-foreground">{title}</span>
            {badge && <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">{badge}</Badge>}
          </div>
          <Button variant="ghost" size="sm" onClick={onDrillDown} className="text-muted-foreground hover:text-foreground">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col flex-1">
        <p className="text-sm text-muted-foreground mb-4">{summary}</p>
        
        {metrics.length > 0 && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            {metrics.map((metric, idx) => (
              <div key={idx} className="text-center p-2 bg-white/50 dark:bg-black/20 rounded-lg border border-white/20 backdrop-blur-sm">
                <div className="text-xs text-muted-foreground">{metric.label}</div>
                <div className="font-semibold text-foreground">{metric.value}</div>
              </div>
            ))}
          </div>
        )}
        
        <div className="mt-auto">
          <Button variant="outline" size="sm" onClick={onDrillDown} className="w-full hover:bg-white/50 dark:hover:bg-black/20">
            <ExternalLink className="h-4 w-4 mr-2" />
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export const RcxAuditPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { project, totalUsage, isLoading } = useProjectOverview(projectId);
  const { rcms } = useMeasures(projectId || '');
  
  const [activeModal, setActiveModal] = useState<string | null>(null);

  if (isLoading) {
    return <div className="p-6">Loading retro-commissioning audit...</div>;
  }

  if (!project) {
    return <div className="p-6">Project not found</div>;
  }

  // Calculate key metrics
  const totalSavings = rcms.reduce((sum, m) => sum + (m.estimatedSavings?.cost || 0), 0);
  const totalEnergySavings = rcms.reduce((sum, m) => sum + (m.estimatedSavings?.energy || 0), 0);
  const avgPayback = rcms.length > 0 
    ? rcms.reduce((sum, m) => sum + (m.estimatedSavings?.paybackPeriod || 0), 0) / rcms.length 
    : 0;

  // Calculate potential energy savings percentage
  const energySavingsPercent = (totalUsage?.totalElectric && totalEnergySavings) 
    ? Math.round((totalEnergySavings / totalUsage.totalElectric) * 100)
    : 0;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto pt-16 lg:pt-6">
      {/* Enhanced Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-orange-50 via-white to-red-50 dark:from-orange-950/20 dark:via-background dark:to-red-950/20 rounded-xl border border-border shadow-lg">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="relative p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl shadow-lg">
              <Settings className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground mb-1">Retro-Commissioning Dashboard</h1>
              <p className="text-orange-700 dark:text-orange-300 font-medium">
                System optimization and operational improvements for {project.name}
              </p>
            </div>
            <div className="hidden sm:block text-right">
              <div className="text-sm text-muted-foreground">Process Type</div>
              <div className="text-lg font-semibold text-foreground">RCx Analysis</div>
            </div>
          </div>
          
          {/* Property Details - Enhanced */}
          <div className="bg-white/60 dark:bg-black/20 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-md">
                  <Building2 className="h-3.5 w-3.5 text-blue-600" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Property</div>
                  <div className="font-medium text-foreground">{project.property_city}, {project.property_state}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-md">
                  <Gauge className="h-3.5 w-3.5 text-green-600" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Floor Area</div>
                  <div className="font-medium text-foreground">{project.property_gross_floor_area?.toLocaleString() ?? '--'} ft²</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-orange-100 dark:bg-orange-900/30 rounded-md">
                  <Settings className="h-3.5 w-3.5 text-orange-600" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">RCx Measures</div>
                  <div className="font-medium text-foreground">{rcms.length} identified</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-md">
                  <TrendingUp className="h-3.5 w-3.5 text-purple-600" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Savings Potential</div>
                  <div className="font-medium text-foreground">${totalSavings.toLocaleString()}/yr</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Page Header */}
      <div className="text-center space-y-2">
        {/* <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <Settings className="h-8 w-8 text-orange-600" />
          Retro-Commissioning Dashboard
        </h1> */}
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Analysis of building system optimization opportunities and operational improvements
        </p>
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 mx-4">
        <Card className="relative overflow-visible border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/30 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {rcms.length}
            </div>
            <div className="text-sm text-orange-700/80 dark:text-orange-300/80">RCx Measures Identified</div>
          </CardContent>
        </Card>
        
        <Card className="relative overflow-visible border-green-200 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/30 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              ${totalSavings.toLocaleString()}
            </div>
            <div className="text-sm text-green-700/80 dark:text-green-300/80">Annual Cost Savings</div>
            {totalSavings > 15000 && (
              <CalloutBadge type="priority" text="HIGH IMPACT" pulse={true} />
            )}
          </CardContent>
        </Card>
        
        <Card className="relative overflow-visible border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/30 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {formatEnergy(totalEnergySavings)} kWh
            </div>
            <div className="text-sm text-blue-700/80 dark:text-blue-300/80">Annual Energy Savings</div>
          </CardContent>
        </Card>
        
        <Card className="relative overflow-visible border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/30 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {avgPayback.toFixed(1)} years
            </div>
            <div className="text-sm text-purple-700/80 dark:text-purple-300/80">Average Payback Period</div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mx-4 mb-8">
        
        {/* System Assessment */}
        <SummaryCard
          title="System Assessment"
          icon={Gauge}
          summary="Comprehensive evaluation of HVAC, lighting, and control systems to identify operational deficiencies and optimization opportunities."
          metrics={[
            { label: "Systems Evaluated", value: "HVAC, Controls" },
            { label: "Assessment Status", value: rcms.length > 0 ? "Complete" : "In Progress" }
          ]}
          onDrillDown={() => setActiveModal('assessment')}
        />

        {/* Performance Testing */}
        <SummaryCard
          title="Performance Testing"
          icon={BarChart3}
          summary="Functional testing of building systems to verify proper operation and identify performance gaps."
          metrics={[
            { label: "Testing Scope", value: "Full Systems" },
            { label: "Issues Found", value: `${rcms.length} opportunities` }
          ]}
          onDrillDown={() => setActiveModal('testing')}
        />

        {/* HVAC Optimization */}
        <SummaryCard
          title="HVAC Optimization"
          icon={Fan}
          summary="Optimization of heating, ventilation, and air conditioning systems for improved efficiency and performance."
          metrics={[
            { label: "HVAC Measures", value: `${rcms.filter(m => m.title?.toLowerCase().includes('hvac')).length}` },
            { label: "Potential Savings", value: `${energySavingsPercent}% energy` }
          ]}
          onDrillDown={() => setActiveModal('hvac')}
        />

        {/* Controls Assessment */}
        <SummaryCard
          title="Controls Assessment"
          icon={Wrench}
          summary="Evaluation of building automation systems, control sequences, and optimization of system operations."
          metrics={[
            { label: "Control Systems", value: "BAS, Manual" },
            { label: "Optimization Level", value: rcms.length > 0 ? "Opportunities" : "Optimized" }
          ]}
          onDrillDown={() => setActiveModal('controls')}
        />

        {/* RCx Measures */}
        <SummaryCard
          title="RCx Measures"
          icon={Lightbulb}
          summary="No-cost and low-cost operational improvements identified through the retro-commissioning process."
          metrics={[
            { label: "Total Measures", value: `${rcms.length}` },
            { label: "Avg Payback", value: `${avgPayback.toFixed(1)} years` }
          ]}
          badge={`$${totalSavings.toLocaleString()} savings`}
          onDrillDown={() => setActiveModal('measures')}
          callout={
            avgPayback > 0 && avgPayback <= 1 ?
            { type: 'success', text: 'NO COST' } : undefined
          }
        />

        {/* Implementation Plan */}
        <SummaryCard
          title="Implementation Plan"
          icon={TrendingUp}
          summary="Strategic approach to implementing retro-commissioning measures with prioritization and scheduling."
          metrics={[
            { label: "Priority Level", value: totalSavings > 5000 ? "High Impact" : "Standard" },
            { label: "Implementation", value: rcms.length > 0 ? "Ready" : "Pending" }
          ]}
          onDrillDown={() => setActiveModal('implementation')}
        />
      </div>

      {/* Navigation */}
      <NavigationButtons currentPage="rcx" />

      {/* Drill-down Modals */}
      <DrillDownModal
        title="System Assessment"
        isOpen={activeModal === 'assessment'}
        onClose={() => setActiveModal(null)}
      >
        <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          <h3 className="text-lg font-semibold text-foreground">Building Systems Evaluation</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  HVAC Systems
                </CardTitle>
              </CardHeader>
              <CardContent>
              <ul className="list-disc list-inside dark:text-gray-200 space-y-1 pl-2">
                <li>Air handling unit operation and controls</li>
                <li>Temperature and humidity control</li>
                <li>System scheduling and optimization</li>
                <li>Equipment maintenance and calibration</li>
              </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Building Controls
                </CardTitle>
              </CardHeader>
              <CardContent>
              <ul className="list-disc list-inside dark:text-gray-200 space-y-1 pl-2">
                <li>Building automation system functionality</li>
                <li>Sensor calibration and operation</li>
                <li>Control sequence verification</li>
                <li>Energy management strategies</li>
              </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </DrillDownModal>

      <DrillDownModal
        title="Performance Testing"
        isOpen={activeModal === 'testing'}
        onClose={() => setActiveModal(null)}
      >
        <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          <h3 className="text-lg font-semibold text-foreground">Functional Performance Testing</h3>
          <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">Testing Methodology</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside dark:text-gray-200 space-y-1 pl-2">
                  <li>System operation verification during various load conditions</li>
                  <li>Control sequence testing and calibration</li>
                  <li>Energy performance measurement and analysis</li>
                  <li>Documentation of deficiencies and opportunities</li>
                </ul>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">Test Results Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 text-sm">
                  <div>
                    <strong>Systems Tested:</strong> HVAC, Lighting, Controls
                  </div>
                  <div>
                    <strong>Issues Identified:</strong> {rcms.length} opportunities
                  </div>
                  <div>
                    <strong>Energy Impact:</strong> {energySavingsPercent}% potential savings
                  </div>
                  <div>
                    <strong>Cost Impact:</strong> ${totalSavings.toLocaleString()} annual savings
                  </div>
                </div>
              </CardContent>
            </Card>
            </div>
          </div>
        </div>
      </DrillDownModal>

      <DrillDownModal
        title="HVAC Optimization"
        isOpen={activeModal === 'hvac'}
        onClose={() => setActiveModal(null)}
      >
        <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          <h3 className="text-lg font-semibold text-foreground">HVAC System Optimization</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">Optimization Areas</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside dark:text-gray-200 space-y-1 pl-2">
                  <li>Temperature setpoint optimization</li>
                  <li>Schedule adjustments and programming</li>
                  <li>Economizer operation and controls</li>
                  <li>Variable speed drive optimization</li>
                  <li>Filter maintenance and replacement</li>
                </ul>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">Expected Benefits</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside dark:text-gray-200 space-y-1 pl-2">
                  <li>Reduced energy consumption</li>
                  <li>Improved occupant comfort</li>
                  <li>Extended equipment life</li>
                  <li>Better indoor air quality</li>
                  <li>Lower operating costs</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </DrillDownModal>

      <DrillDownModal
        title="Controls Assessment"
        isOpen={activeModal === 'controls'}
        onClose={() => setActiveModal(null)}
      >
        <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          <h3 className="text-lg font-semibold text-foreground">Building Controls Evaluation</h3>
          <div className="space-y-4">
            <div>
              <h4 className="text-lg text-emerald-600 font-medium  mb-3">Current Control Systems</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Assessment of existing building automation and manual control systems to identify optimization opportunities.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3 border rounded">
                  <div className="font-medium text-sm">Temperature Control</div>
                  <div className="text-xs text-muted-foreground mt-1">Zone-level optimization</div>
                </div>
                <div className="p-3 border rounded">
                  <div className="font-medium text-sm">Scheduling</div>
                  <div className="text-xs text-muted-foreground mt-1">Occupancy-based operation</div>
                </div>
                <div className="p-3 border rounded">
                  <div className="font-medium text-sm">Energy Management</div>
                  <div className="text-xs text-muted-foreground mt-1">Demand control strategies</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DrillDownModal>

      <DrillDownModal
        title="RCx Measures"
        isOpen={activeModal === 'measures'}
        onClose={() => setActiveModal(null)}
      >
        <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          <RetroCommissioningMeasures projectId={projectId || ''} />
          {rcms.length > 0 && (
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-4">Interactive Measures View</h3>
              <MeasuresView projectId={projectId || ''} publicView={true} />
            </div>
          )}
        </div>
      </DrillDownModal>

      <DrillDownModal
        title="Implementation Plan"
        isOpen={activeModal === 'implementation'}
        onClose={() => setActiveModal(null)}
      >
        <div className="space-y-6 text-sm leading-relaxed text-muted-foreground">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {rcms.length}
                </div>
                <div className="text-sm text-muted-foreground">Total RCx Measures</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  ${totalSavings.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Annual Savings</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {avgPayback.toFixed(1)} years
                </div>
                <div className="text-sm text-muted-foreground">Average Payback</div>
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Implementation Strategy</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">Phase 1: No-Cost Measures</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc list-inside dark:text-gray-200 space-y-1 pl-2">
                    <li>Temperature setpoint adjustments</li>
                    <li>Equipment scheduling optimization</li>
                    <li>Control sequence corrections</li>
                    <li>Sensor calibration</li>
                  </ul>
                </CardContent>
              </Card>
            
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">Phase 2: Low-Cost Measures</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc list-inside dark:text-gray-200 space-y-1 pl-2">
                    <li>Filter replacements and upgrades</li>
                    <li>Minor equipment repairs</li>
                    <li>Control system programming</li>
                    <li>Preventive maintenance improvements</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">Key Benefits</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside dark:text-gray-200 space-y-1 pl-2">
                  <li>Immediate energy and cost savings of ${totalSavings.toLocaleString()} annually</li>
                  <li>Improved system reliability and performance</li>
                  <li>Enhanced occupant comfort and satisfaction</li>
                  <li>Extended equipment life and reduced maintenance costs</li>
                  <li>Better indoor air quality and environmental conditions</li>
                  <li>Documented system operation for ongoing optimization</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </DrillDownModal>
    </div>
  );
}; 