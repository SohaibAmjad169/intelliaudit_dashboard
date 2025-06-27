import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Zap, 
  Building2, 
  TrendingUp, 
  Settings, 
  FileText,
  ChevronRight,
  BarChart3,
  Lightbulb,
  Star,
  ExternalLink,
  Gauge,
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
import { EnergyUseAnalysis } from '@/features/reports/shareable/EnergyAudit/EnergyUseAnalysis';
import { EnergyStarBenchmarking } from '@/features/reports/shareable/EnergyAudit/EnergyStarBenchmarking';
import { Equipment } from '@/features/reports/shareable/EnergyAudit/Equipment';
import { ExistingConditionsAndObservations } from '@/features/reports/shareable/EnergyAudit/ExistingConditionsAndObservations';
import { EnergyEfficiencyMeasures } from '@/features/reports/shareable/EnergyAudit/EnergyEfficiencyMeasures';
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
    priority: Star,
    info: Sparkles
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
    if (title.includes('Energy Use')) {
      return "border-blue-300 bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-blue-950/10 dark:via-background dark:to-blue-950/10 hover:shadow-blue-200/50";
    } else if (title.includes('ENERGY STAR')) {
      return "border-yellow-300 bg-gradient-to-br from-yellow-50 via-white to-yellow-50 dark:from-yellow-950/10 dark:via-background dark:to-yellow-950/10 hover:shadow-yellow-200/50";
    } else if (title.includes('Equipment')) {
      return "border-gray-300 bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950/10 dark:via-background dark:to-gray-950/10 hover:shadow-gray-200/50";
    } else if (title.includes('Existing')) {
      return "border-orange-300 bg-gradient-to-br from-orange-50 via-white to-orange-50 dark:from-orange-950/10 dark:via-background dark:to-orange-950/10 hover:shadow-orange-200/50";
    } else if (title.includes('Efficiency')) {
      return "border-green-300 bg-gradient-to-br from-green-50 via-white to-green-50 dark:from-green-950/10 dark:via-background dark:to-green-950/10 hover:shadow-green-200/50";
    } else if (title.includes('Performance')) {
      return "border-purple-300 bg-gradient-to-br from-purple-50 via-white to-purple-50 dark:from-purple-950/10 dark:via-background dark:to-purple-950/10 hover:shadow-purple-200/50";
    }
    return "border-slate-300 bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950/10 dark:via-background dark:to-slate-950/10 hover:shadow-slate-200/50";
  };

  const getIconColor = (title: string) => {
    if (title.includes('Energy Use')) return "text-blue-600";
    if (title.includes('ENERGY STAR')) return "text-yellow-600";
    if (title.includes('Equipment')) return "text-gray-600";
    if (title.includes('Existing')) return "text-orange-600";
    if (title.includes('Efficiency')) return "text-green-600";
    if (title.includes('Performance')) return "text-purple-600";
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

export const EnergyAuditPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { project, totalUsage, isLoading } = useProjectOverview(projectId);
  const { eems } = useMeasures(projectId || '');
  
  const [activeModal, setActiveModal] = useState<string | null>(null);

  if (isLoading) {
    return <div className="p-6">Loading energy audit...</div>;
  }

  if (!project) {
    return <div className="p-6">Project not found</div>;
  }

  // Calculate key metrics
  const totalSavings = eems.reduce((sum, m) => sum + (m.estimatedSavings?.cost || 0), 0);
  const avgPayback = eems.length > 0 
    ? eems.reduce((sum, m) => sum + (m.estimatedSavings?.paybackPeriod || 0), 0) / eems.length 
    : 0;

  // Helper: Format a number with commas and decimals if needed
  const format = (n, d=0) => n === undefined || n === null ? '--' : Number(n).toLocaleString(undefined, { maximumFractionDigits: d });

  // Example calculations (replace with actual project fields if names differ)
  const buildingAnnualKwh = format(totalUsage?.totalElectric, 1); // e.g., 121900
  const savings = format(totalSavings, 2); // e.g., 7650.11
  const payback = avgPayback.toFixed(1); // e.g., 10.2
  const starScoreRaw = project.energy_star_score; // Could be string | number | undefined

  let starScoreDisplay = "--";
  let starScoreNumber: number | undefined = undefined;

  if (typeof starScoreRaw === "number") {
    starScoreDisplay = starScoreRaw.toString();
    starScoreNumber = starScoreRaw;
  } else if (typeof starScoreRaw === "string" && !isNaN(Number(starScoreRaw))) {
    starScoreDisplay = starScoreRaw;
    starScoreNumber = Number(starScoreRaw);
  }

  const findings = [
    `Building consumes ${buildingAnnualKwh} kWh annually`,
    `Energy efficiency improvements could save $${savings} per year`,
    `Average payback period for recommendations is ${payback} years`,
    `ENERGY STAR score of ${starScoreDisplay} indicates ${
      starScoreNumber !== undefined && starScoreNumber > 50 ? "above average" : "below average"
    } performance`,
    `Priority should be given to measures with shortest payback periods`
  ];

  const nextSteps = [
    "Review detailed energy efficiency measures and their financial analysis",
    "Prioritize implementation based on payback periods and available capital",
    "Obtain detailed engineering studies for selected measures",
    "Apply for utility rebates and incentives",
    "Schedule implementation with qualified contractors",
    "Monitor and verify energy savings post-implementation"
  ];


  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto pt-16 lg:pt-6">
      {/* Enhanced Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-yellow-50 via-white to-orange-50 dark:from-yellow-950/20 dark:via-background dark:to-orange-950/20 rounded-xl border border-border shadow-lg">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="relative p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl shadow-lg">
              <Zap className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground mb-1">Energy Audit Dashboard</h1>
              <p className="text-yellow-700 dark:text-yellow-300 font-medium">
                Comprehensive energy performance analysis for {project.name}
              </p>
            </div>
            <div className="hidden sm:block text-right">
              <div className="text-sm text-muted-foreground">Audit Scope</div>
              <div className="text-lg font-semibold text-foreground">ASHRAE Level II</div>
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
                <div className="p-1.5 bg-yellow-100 dark:bg-yellow-900/30 rounded-md">
                  <Zap className="h-3.5 w-3.5 text-yellow-600" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Annual Usage</div>
                  <div className="font-medium text-foreground">{formatEnergy(totalUsage?.totalElectric)} kWh</div>
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
          <Zap className="h-8 w-8 text-yellow-600" />
          Energy Audit Dashboard
        </h1> */}
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Detailed analysis of energy performance, efficiency opportunities, and improvement recommendations
        </p>
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 mx-4">
        <Card className="relative overflow-visible border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/30 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {formatEnergy(totalUsage?.totalElectric)} kWh
            </div>
            <div className="text-sm text-blue-700/80 dark:text-blue-300/80">Annual Electric Usage</div>
          </CardContent>
        </Card>
        
        <Card className="relative overflow-visible border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/30 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {formatEnergy(totalUsage?.naturalGasUsage)} therms
            </div>
            <div className="text-sm text-orange-700/80 dark:text-orange-300/80">Annual Gas Usage</div>
          </CardContent>
        </Card>
        
        <Card className="relative overflow-visible border-green-200 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/30 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              ${totalSavings.toLocaleString()}
            </div>
            <div className="text-sm text-green-700/80 dark:text-green-300/80">Potential Annual Savings</div>
            {/* High savings potential badge */}
            {totalSavings > 15000 && (
              <CalloutBadge type="priority" text="HIGH IMPACT" pulse={true} />
            )}
          </CardContent>
        </Card>
        
        <Card className="relative overflow-visible border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/30 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {project.energy_star_score || '--'}
            </div>
            <div className="text-sm text-purple-700/80 dark:text-purple-300/80">ENERGY STAR Score</div>
            {/* ENERGY STAR performance badges */}
            {project.energy_star_score && project.energy_star_score >= 75 && (
              <CalloutBadge type="success" text="EXCELLENT" />
            )}
            {project.energy_star_score && project.energy_star_score < 50 && (
              <CalloutBadge type="alert" text="NEEDS IMPROVEMENT" pulse={true} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mx-4 mb-8">
        
        {/* Energy Use Analysis */}
        <SummaryCard
          title="Energy Use Analysis"
          icon={BarChart3}
          summary="Detailed analysis of energy consumption patterns, including monthly trends, weather correlations, and usage intensity metrics."
          metrics={[
            { label: "Site EUI", value: `${project.site_intensity ? Number(project.site_intensity).toFixed(1) : '--'} kBtu/ft²` },
            { label: "Source EUI", value: `${((Number(project.source_total_energy) || 0) / (Number(project.property_gross_floor_area) || 1) * 3.412).toFixed(1)} kBtu/ft²` }
          ]}
          onDrillDown={() => setActiveModal('energy-analysis')}
          callout={
            project.site_intensity && Number(project.site_intensity) > 100 ? 
            { type: 'warning', text: 'HIGH EUI' } : undefined
          }
        />

        {/* ENERGY STAR Benchmarking */}
        <SummaryCard
          title="ENERGY STAR Benchmarking"
          icon={Star}
          summary="Portfolio Manager benchmarking results comparing building performance to similar properties nationwide."
          metrics={[
            { label: "Benchmark Score", value: `${project.energy_star_score || '--'}` },
            { label: "Percentile", value: project.energy_star_score ? `${project.energy_star_score}th` : '--' }
          ]}
          badge={project.energy_star_score && project.energy_star_score >= 75 ? "ENERGY STAR Eligible" : undefined}
          onDrillDown={() => setActiveModal('benchmarking')}
          callout={
            project.energy_star_score && project.energy_star_score >= 75 ? 
            { type: 'success', text: 'EXCELLENT' } : undefined
          }
        />

        {/* Equipment Audit */}
        <SummaryCard
          title="Equipment Audit"
          icon={Settings}
          summary="Comprehensive inventory and assessment of HVAC, lighting, and other energy-consuming equipment throughout the facility."
          metrics={[
            { label: "HVAC Systems", value: "Central Air" },
            { label: "Lighting", value: "Mixed Types" }
          ]}
          onDrillDown={() => setActiveModal('equipment')}
        />

        {/* Existing Conditions */}
        <SummaryCard
          title="Existing Conditions"
          icon={Building2}
          summary="Field observations of building envelope, systems performance, and operational characteristics affecting energy use."
          metrics={[
            { label: "Building Age", value: `${project.property_year_built || '--'}` },
            { label: "Floor Area", value: `${(Number(project.property_gross_floor_area) || 0).toLocaleString()} ft²` }
          ]}
          onDrillDown={() => setActiveModal('conditions')}
          callout={
            project.property_year_built && (new Date().getFullYear() - project.property_year_built) > 30 ?
            { type: 'warning', text: 'AGING BUILDING' } : undefined
          }
        />

        {/* Energy Efficiency Measures */}
        <SummaryCard
          title="Energy Efficiency Measures"
          icon={Lightbulb}
          summary="Recommended improvements to reduce energy consumption and costs, with detailed financial analysis."
          metrics={[
            { label: "Total Measures", value: `${eems.length}` },
            { label: "Avg Payback", value: `${avgPayback.toFixed(1)} years` }
          ]}
          badge={`$${totalSavings.toLocaleString()} savings`}
          onDrillDown={() => setActiveModal('measures')}
          callout={
            eems.length > 5 ? 
            { type: 'priority', text: 'MANY OPPORTUNITIES', pulse: true } : undefined
          }
        />

        {/* Performance Metrics */}
        <SummaryCard
          title="Performance Summary"
          icon={TrendingUp}
          summary="Key performance indicators and improvement potential based on the comprehensive energy audit analysis."
          metrics={[
            { label: "Efficiency Rating", value: (project.energy_star_score && project.energy_star_score >= 50) ? "Above Average" : "Below Average" },
            { label: "Savings Potential", value: `${Math.round((totalSavings / ((totalUsage?.totalElectric || 1) * 0.12)) * 100)}%` }
          ]}
          onDrillDown={() => setActiveModal('performance')}
        />
      </div>

      {/* Navigation */}
      <NavigationButtons currentPage="energy" />

      {/* Drill-down Modals */}
      <DrillDownModal
        title="Energy Use Analysis"
        isOpen={activeModal === 'energy-analysis'}
        onClose={() => setActiveModal(null)}
      >
        <EnergyUseAnalysis projectId={projectId || ''} project={project} />
      </DrillDownModal>

      <DrillDownModal
        title="ENERGY STAR Benchmarking"
        isOpen={activeModal === 'benchmarking'}
        onClose={() => setActiveModal(null)}
      >
        <EnergyStarBenchmarking projectId={projectId || ''} />
      </DrillDownModal>

      <DrillDownModal
        title="Equipment Audit"
        isOpen={activeModal === 'equipment'}
        onClose={() => setActiveModal(null)}
      >
        <Equipment projectId={projectId || ''} project={project} publicView={true} />
      </DrillDownModal>

      <DrillDownModal
        title="Existing Conditions & Observations"
        isOpen={activeModal === 'conditions'}
        onClose={() => setActiveModal(null)}
      >
        <ExistingConditionsAndObservations projectId={projectId || ''} />
      </DrillDownModal>

      <DrillDownModal
        title="Energy Efficiency Measures"
        isOpen={activeModal === 'measures'}
        onClose={() => setActiveModal(null)}
      >
        <EnergyEfficiencyMeasures projectId={projectId || ''} />
      </DrillDownModal>

      <DrillDownModal
        title="Performance Summary"
        isOpen={activeModal === 'performance'}
        onClose={() => setActiveModal(null)}
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  ${totalSavings.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Total Annual Savings</div>
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
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {eems.length} measures
                </div>
                <div className="text-sm text-muted-foreground">Total Recommendations</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Key Findings */}
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Key Findings
                </CardTitle>
              </CardHeader>
              <CardContent>
              <ul className="list-disc list-inside dark:text-gray-200 space-y-1 pl-2">
                {findings.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
              </CardContent>
            </Card>
            {/* Next Steps */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Next Steps
                </CardTitle>
              </CardHeader>
              <CardContent>
              <ul className="list-disc list-inside dark:text-gray-200 space-y-1 pl-2">
                {nextSteps.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </DrillDownModal>
    </div>
  );
}; 