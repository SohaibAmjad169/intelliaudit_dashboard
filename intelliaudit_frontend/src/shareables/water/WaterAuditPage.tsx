import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Droplets,
  Building2,
  TrendingUp,
  Settings,
  FileText,
  ChevronRight,
  BarChart3,
  Lightbulb,
  Star,
  ExternalLink,
  Sprout,
  Gauge,
  AlertTriangle,
  CheckCircle,
  Flame,
  Sparkles,
  Wrench,
  Trees,
  DollarSign,
  Target,
} from "lucide-react";
import { useProjectOverview } from "../hooks/useProjectOverview";
import { useWaterData } from "../hooks/useWaterData";
import { useMeasures } from "@/hooks/useMeasures";
import { formatEnergy } from "../utils/format";

// Import existing detailed components
import { WaterOverview } from "@/features/water/WaterOverview";
import { WaterEfficiencyMeasures } from "@/features/reports/shareable/WaterAudit/WaterEfficiencyMeasures";
import { WEMsCostSavingsTable } from "@/features/reports/shareable/WaterAudit/WEMsCostSavingsTable";
import { MeasuresView } from "@/features/energy/MeasuresView";
import { NavigationButtons } from "../components/NavigationButtons";
import { MonthlyWaterChartContainer } from "@/features/water";

// Reusable Callout Badge component
interface CalloutBadgeProps {
  type: "success" | "warning" | "alert" | "priority" | "info";
  text: string;
  pulse?: boolean;
}

const CalloutBadge: React.FC<CalloutBadgeProps> = ({
  type,
  text,
  pulse = false,
}) => {
  const baseClasses =
    "absolute -top-3 -right-3 px-2 py-1 text-xs font-bold rounded-full shadow-lg z-20 flex items-center gap-1 border-2 border-white dark:border-gray-800";

  const typeStyles = {
    success: "bg-green-500 text-white",
    warning: "bg-yellow-500 text-white",
    alert: "bg-red-500 text-white",
    priority: "bg-blue-500 text-white",
    info: "bg-purple-500 text-white",
  };

  const icons = {
    success: CheckCircle,
    warning: AlertTriangle,
    alert: AlertTriangle,
    priority: Star,
    info: Sparkles,
  };

  const Icon = icons[type];

  return (
    <div
      className={`${baseClasses} ${typeStyles[type]} ${
        pulse ? "animate-pulse" : ""
      }`}
    >
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

const DrillDownModal: React.FC<DrillDownModalProps> = ({
  title,
  isOpen,
  onClose,
  children,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-background border border-border rounded-lg shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-border bg-muted/30">
          <h2 className="text-2xl font-bold text-foreground">{title}</h2>
          <Button variant="ghost" onClick={onClose} className="hover:bg-muted">
            ✕
          </Button>
        </div>
        <div className="p-6 bg-background">{children}</div>
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
    type: "success" | "warning" | "alert" | "priority" | "info";
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
  callout,
}) => {
  // Dynamic styling based on card title for more visual variety
  const getCardStyling = (title: string) => {
    if (title.includes("Water Use") || title.includes("Analysis")) {
      return "border-blue-300 bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-blue-950/10 dark:via-background dark:to-blue-950/10 hover:shadow-blue-200/50";
    } else if (title.includes("Efficiency") || title.includes("Assessment")) {
      return "border-cyan-300 bg-gradient-to-br from-cyan-50 via-white to-cyan-50 dark:from-cyan-950/10 dark:via-background dark:to-cyan-950/10 hover:shadow-cyan-200/50";
    } else if (title.includes("Fixture") || title.includes("System")) {
      return "border-teal-300 bg-gradient-to-br from-teal-50 via-white to-teal-50 dark:from-teal-950/10 dark:via-background dark:to-teal-950/10 hover:shadow-teal-200/50";
    } else if (title.includes("Existing") || title.includes("Conditions")) {
      return "border-indigo-300 bg-gradient-to-br from-indigo-50 via-white to-indigo-50 dark:from-indigo-950/10 dark:via-background dark:to-indigo-950/10 hover:shadow-indigo-200/50";
    } else if (title.includes("Measures")) {
      return "border-green-300 bg-gradient-to-br from-green-50 via-white to-green-50 dark:from-green-950/10 dark:via-background dark:to-green-950/10 hover:shadow-green-200/50";
    } else if (title.includes("Conservation") || title.includes("Summary")) {
      return "border-purple-300 bg-gradient-to-br from-purple-50 via-white to-purple-50 dark:from-purple-950/10 dark:via-background dark:to-purple-950/10 hover:shadow-purple-200/50";
    }
    return "border-slate-300 bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950/10 dark:via-background dark:to-slate-950/10 hover:shadow-slate-200/50";
  };

  const getIconColor = (title: string) => {
    if (title.includes("Water Use") || title.includes("Analysis"))
      return "text-blue-600";
    if (title.includes("Efficiency") || title.includes("Assessment"))
      return "text-cyan-600";
    if (title.includes("Fixture") || title.includes("System"))
      return "text-teal-600";
    if (title.includes("Existing") || title.includes("Conditions"))
      return "text-indigo-600";
    if (title.includes("Measures")) return "text-green-600";
    if (title.includes("Conservation") || title.includes("Summary"))
      return "text-purple-600";
    return "text-slate-600";
  };

  return (
    <Card
      className={`h-full flex flex-col relative overflow-visible transition-all duration-300 hover:shadow-lg ${getCardStyling(
        title
      )}`}
    >
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
            {badge && (
              <Badge
                variant="secondary"
                className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
              >
                {badge}
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDrillDown}
            className="text-muted-foreground hover:text-foreground"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col flex-1">
        <p className="text-sm text-muted-foreground mb-4">{summary}</p>

        {metrics.length > 0 && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            {metrics.map((metric, idx) => (
              <div
                key={idx}
                className="text-center p-2 bg-white/50 dark:bg-black/20 rounded-lg border border-white/20 backdrop-blur-sm"
              >
                <div className="text-xs text-muted-foreground">
                  {metric.label}
                </div>
                <div className="font-semibold text-foreground">
                  {metric.value}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={onDrillDown}
            className="w-full hover:bg-white/50 dark:hover:bg-black/20"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export const WaterAuditPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { project, isLoading } = useProjectOverview(projectId);
  const { waterUsage, waterCost, waterUseIntensity } = useWaterData(projectId);
  const { wems } = useMeasures(projectId || "");

  const [activeModal, setActiveModal] = useState<string | null>(null);

  if (isLoading) {
    return <div className="p-6">Loading water audit...</div>;
  }

  if (!project) {
    return <div className="p-6">Project not found</div>;
  }

  // Calculate key metrics
  const totalSavings = wems.reduce(
    (sum, m) => sum + (m.estimatedSavings?.cost || 0),
    0
  );
  const totalWaterSavings = wems.reduce(
    (sum, m) => sum + (m.estimatedSavings?.water || 0),
    0
  );
  const avgPayback =
    wems.length > 0
      ? wems.reduce(
          (sum, m) => sum + (m.estimatedSavings?.paybackPeriod || 0),
          0
        ) / wems.length
      : 0;
      
  const waterUsageGallons = waterUsage * 748;
  const totalWaterSaved = wems.reduce(
    (sum, wem) => sum + (wem.estimatedSavings?.water || 0),
    0
  );
  const percentReduction = (totalWaterSaved / waterUsageGallons) * 100 || 0;
  const potentialSavingsPercentage = `${percentReduction.toFixed(0)}`;

  const totalImplementationCost = wems.reduce(
    (sum, wem) => sum + (Number(wem.implementationCost) || 0),
    0
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto pt-16 lg:pt-6">
      {/* Enhanced Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-blue-950/20 dark:via-background dark:to-cyan-950/20 rounded-xl border border-border shadow-lg">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="relative p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl shadow-lg">
              <Droplets className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground mb-1">
                Water Audit Dashboard
              </h1>
              <p className="text-blue-700 dark:text-blue-300 font-medium">
                Comprehensive water efficiency analysis for {project.name}
              </p>
            </div>
            <div className="hidden sm:block text-right">
              <div className="text-sm text-muted-foreground">
                Conservation Focus
              </div>
              <div className="text-lg font-semibold text-foreground">
                Efficiency & Savings
              </div>
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
                  <div className="font-medium text-foreground">
                    {project.property_city}, {project.property_state}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-md">
                  <Gauge className="h-3.5 w-3.5 text-green-600" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">
                    Floor Area
                  </div>
                  <div className="font-medium text-foreground">
                    {project.property_gross_floor_area?.toLocaleString() ??
                      "--"}{" "}
                    ft²
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-cyan-100 dark:bg-cyan-900/30 rounded-md">
                  <Droplets className="h-3.5 w-3.5 text-cyan-600" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">
                    Annual Usage
                  </div>
                  <div className="font-medium text-foreground">
                    {waterUsage > 0
                      ? `${formatEnergy(waterUsage)} HCF`
                      : "Data N/A"}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-md">
                  <TrendingUp className="h-3.5 w-3.5 text-purple-600" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">
                    Savings Potential
                  </div>
                  <div className="font-medium text-foreground">
                    ${Math.round(totalSavings).toLocaleString()}/yr
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Page Header */}
      <div className="text-center space-y-2">
        {/* <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <Droplets className="h-8 w-8 text-blue-600" />
          Water Audit Dashboard
        </h1> */}
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Analysis of water usage patterns, efficiency opportunities, and
          conservation recommendations
        </p>
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 mx-4">
        <Card className="relative overflow-visible border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/30 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {waterUsage > 0 ? `${formatEnergy(waterUsage)} HCF` : "Data N/A"}
            </div>
            <div className="text-sm text-blue-700/80 dark:text-blue-300/80">
              Annual Water Usage
            </div>
            {waterUsage === 0 && (
              <CalloutBadge type="alert" text="NO DATA" pulse={true} />
            )}
          </CardContent>
        </Card>

        <Card className="relative overflow-visible border-cyan-200 bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-950/20 dark:to-cyan-900/30 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-cyan-600">
              {waterUseIntensity !== "--"
                ? `${waterUseIntensity} HCF/ft²`
                : "Data N/A"}
            </div>
            <div className="text-sm text-cyan-700/80 dark:text-cyan-300/80">
              Water Use Intensity
            </div>
            {waterUseIntensity === "--" && (
              <CalloutBadge type="warning" text="CALC NEEDED" />
            )}
          </CardContent>
        </Card>

        <Card className="relative overflow-visible border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/30 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {waterCost > 0
                ? `$${Math.round(waterCost).toLocaleString()}`
                : "Data N/A"}
            </div>
            <div className="text-sm text-purple-700/80 dark:text-purple-300/80">
              Annual Water Cost
            </div>
            {waterCost === 0 && (
              <CalloutBadge type="alert" text="NO DATA" pulse={true} />
            )}
          </CardContent>
        </Card>

        <Card className="relative overflow-visible border-green-200 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/30 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              ${Math.round(totalSavings).toLocaleString()}
            </div>
            <div className="text-sm text-green-700/80 dark:text-green-300/80">
              Potential Annual Savings
            </div>
            {totalSavings > 5000 && (
              <CalloutBadge type="priority" text="HIGH IMPACT" pulse={true} />
            )}
            {totalSavings > 1000 && totalSavings <= 5000 && (
              <CalloutBadge type="info" text="GOOD" />
            )}
            {totalSavings === 0 && wems.length === 0 && (
              <CalloutBadge type="warning" text="LIMITED" />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mx-4 mb-8">
        {/* Water Conservation Measures */}
        <SummaryCard
          title="Water Conservation Measures"
          icon={Droplets}
          summary="Comprehensive analysis of water-saving opportunities including fixture upgrades, system optimization, and behavioral improvements."
          metrics={[
            { label: "Measures Identified", value: wems.length + " opportunities" },
            { label: "Potential Savings", value: potentialSavingsPercentage + "% reduction" },
          ]}
          callout={{ type: "priority", text: "HIGH IMPACT" }}
          onDrillDown={() => setActiveModal("measures")}
        />

        {/* Fixture & Equipment Assessment */}
        <SummaryCard
          title="Fixture & Equipment Assessment"
          icon={Wrench}
          summary="Detailed evaluation of existing plumbing fixtures, flow rates, and equipment efficiency throughout the facility."
          metrics={[
            { label: "Fixtures Audited", value: "45 total" },
            { label: "Replacement Candidates", value: "18 fixtures" },
          ]}
          onDrillDown={() => setActiveModal("fixtures")}
        />

        {/* Irrigation Systems */}
        <SummaryCard
          title="Irrigation Systems Analysis"
          icon={Trees}
          summary="Assessment of landscape irrigation efficiency, controller programming, and water scheduling optimization."
          metrics={[
            { label: "Coverage Area", value: "12,500 ft²" },
            { label: "Controller Zones", value: "8 zones" },
          ]}
          onDrillDown={() => setActiveModal("irrigation")}
        />

        {/* Usage Analysis */}
        <SummaryCard
          title="Water Usage Analysis"
          icon={BarChart3}
          summary="Monthly consumption patterns, peak usage identification, and baseline establishment for conservation tracking."
          metrics={[
            { label: "Annual Usage", value: formatEnergy(waterUsageGallons) + " gallons" },
            { label: "Peak Month", value: "July 2024" },
          ]}
          onDrillDown={() => setActiveModal("waterUsageAnalysis")}
        />

        {/* Cost-Benefit Analysis */}
        <SummaryCard
          title="Cost-Benefit Analysis"
          icon={DollarSign}
          summary="Financial evaluation of water conservation investments including payback periods and long-term savings projections."
          metrics={[
            { label: "Implementation Cost", value: `$${formatEnergy(totalImplementationCost)}` },
            { label: "Annual Savings", value: `$${formatEnergy(totalSavings)}` },
          ]}
          callout={{ type: "success", text: "POSITIVE ROI" }}
          onDrillDown={() => setActiveModal("cost-benefit")}
        />

        {/* Implementation Roadmap */}
        <SummaryCard
          title="Implementation Roadmap"
          icon={Target}
          summary="Phased approach to water conservation implementation with prioritized recommendations and timeline."
          metrics={[
            { label: "Phase 1 Projects", value: "4 measures" },
            { label: "Quick Wins", value: "2-4 weeks" },
          ]}
          onDrillDown={() => setActiveModal("implementation")}
        />
      </div>

      {/* Navigation */}
      <NavigationButtons currentPage="water" />

      {/* Drill-down Modals */}

      <DrillDownModal
        title="Water Conservation Measures"
        isOpen={activeModal === "measures"}
        onClose={() => setActiveModal(null)}
      >
        <div className="space-y-4">
          <WaterEfficiencyMeasures projectId={projectId || ""} />
        </div>
      </DrillDownModal>

      <DrillDownModal
        title="Fixture & System Audit"
        isOpen={activeModal === "fixtures"}
        onClose={() => setActiveModal(null)}
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Droplets className="h-5 w-5 text-blue-600" />
                  Restroom Fixtures
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>
                    • Toilets: Assessment of flush volumes and efficiency
                    ratings
                  </li>
                  <li>• Urinals: Water usage and sensor functionality</li>
                  <li>• Faucets: Flow rates and aerator conditions</li>
                  <li>• Leak detection and maintenance needs</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sprout className="h-5 w-5 text-green-600" />
                  Irrigation Systems
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>• Sprinkler system efficiency and coverage</li>
                  <li>• Smart controller capabilities</li>
                  <li>• Landscape water requirements</li>
                  <li>• Weather-based irrigation opportunities</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="text-sm text-muted-foreground">
            Detailed fixture audit data will be integrated with existing water
            system components.
          </div>
        </div>
      </DrillDownModal>

      <DrillDownModal
        title="Water Conservation Summary"
        isOpen={activeModal === "conservation"}
        onClose={() => setActiveModal(null)}
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  ${Math.round(totalSavings).toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">
                  Total Annual Savings
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {totalWaterSavings.toLocaleString()} gal
                </div>
                <div className="text-sm text-muted-foreground">
                  Annual Water Savings
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {avgPayback.toFixed(1)} years
                </div>
                <div className="text-sm text-muted-foreground">
                  Average Payback
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Key Findings</h3>
            <ul className="list-disc ml-6 space-y-2 text-sm">
              <li>
                Building consumes{" "}
                {waterUsage > 0
                  ? `${formatEnergy(waterUsage)} HCF`
                  : "unknown amount"}{" "}
                of water annually
              </li>
              <li>
                Annual water costs are{" "}
                {waterCost > 0
                  ? `$${Math.round(waterCost).toLocaleString()}`
                  : "not available"}
              </li>
              <li>
                Water use intensity is{" "}
                {waterUseIntensity !== "--"
                  ? `${waterUseIntensity} HCF/ft²`
                  : "not calculated"}
              </li>
              <li>
                Water efficiency improvements could save{" "}
                {totalWaterSavings.toLocaleString()} gallons per year
              </li>
              <li>
                Potential cost savings of $
                {Math.round(totalSavings).toLocaleString()} annually from water
                measures
              </li>
              <li>
                Average payback period for recommendations is{" "}
                {avgPayback.toFixed(1)} years
              </li>
            </ul>

            <h3 className="text-lg font-semibold">Conservation Strategies</h3>
            <ol className="list-decimal ml-6 space-y-2 text-sm">
              <li>
                Replace high-flow fixtures with water-efficient alternatives
              </li>
              <li>
                Install smart irrigation controls and weather-based systems
              </li>
              <li>
                Implement leak detection and preventive maintenance programs
              </li>
              <li>Consider drought-tolerant landscaping options</li>
              <li>Educate occupants on water conservation practices</li>
              <li>Monitor usage patterns and track conservation progress</li>
            </ol>
          </div>
        </div>
      </DrillDownModal>

      <DrillDownModal
        title="Water Use Analysis"
        isOpen={activeModal === "waterUsageAnalysis"}
        onClose={() => setActiveModal(null)}
      >
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Water Usage Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium mb-2">Annual Water Usage</h4>
                <div className="text-2xl font-bold text-blue-600">
                  {waterUsage > 0
                    ? `${formatEnergy(waterUsage)} HCF`
                    : "Data N/A"}
                </div>
                {waterUsage === 0 && (
                  <div className="text-xs text-orange-600 mt-1">
                    No usage data available
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium mb-2">Water Use Intensity</h4>
                <div className="text-2xl font-bold text-cyan-600">
                  {waterUseIntensity !== "--"
                    ? `${waterUseIntensity} HCF/ft²`
                    : "Data N/A"}
                </div>
                {waterUseIntensity === "--" && (
                  <div className="text-xs text-orange-600 mt-1">
                    Insufficient data
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium mb-2">Annual Water Cost</h4>
                <div className="text-2xl font-bold text-purple-600">
                  {waterCost > 0
                    ? `$${Math.round(waterCost).toLocaleString()}`
                    : "Data N/A"}
                </div>
                {waterCost === 0 && (
                  <div className="text-xs text-orange-600 mt-1">
                    No cost data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <MonthlyWaterChartContainer projectId={projectId} />
          </div>

          <div className="text-sm text-muted-foreground">
            {waterUsage > 0 || waterCost > 0
              ? "Water usage analysis provides insights into consumption patterns and efficiency opportunities."
              : "Water usage data is not currently available for this project. This may be because water utilities haven't been connected to Portfolio Manager or water meters aren't being tracked separately."}
            Future updates will include detailed water system monitoring and
            analysis.
          </div>
        </div>
      </DrillDownModal>

      <DrillDownModal
        title="Water Efficiency Assessment"
        isOpen={activeModal === "efficiency"}
        onClose={() => setActiveModal(null)}
      >
        <WEMsCostSavingsTable projectId={projectId || ""} />
      </DrillDownModal>

      <DrillDownModal
        title="Existing Conditions"
        isOpen={activeModal === "conditions"}
        onClose={() => setActiveModal(null)}
      >
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Water System Assessment</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Indoor Water Use</h4>
              <ul className="list-disc ml-6 space-y-2 text-sm">
                <li>Restroom fixtures and their efficiency ratings</li>
                <li>Kitchen and utility sink usage patterns</li>
                <li>HVAC system water consumption</li>
                <li>Domestic hot water system assessment</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-3">Outdoor Water Use</h4>
              <ul className="list-disc ml-6 space-y-2 text-sm">
                <li>Irrigation system coverage and efficiency</li>
                <li>Landscape water requirements</li>
                <li>Hardscape and pervious surface ratios</li>
                <li>Stormwater management systems</li>
              </ul>
            </div>
          </div>
        </div>
      </DrillDownModal>
    </div>
  );
};
