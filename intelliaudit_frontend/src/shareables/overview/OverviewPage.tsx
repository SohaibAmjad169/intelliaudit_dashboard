import React from "react";
import { Briefcase, Zap, Flame, Globe, Gauge, Building2, TrendingUp, Award, Target, ExternalLink } from "lucide-react";
import { useParams } from "react-router-dom";

import { SectionCard, StatBlock, PortfolioScoresCard } from "../components";
import { ExecutiveSummaryCard } from "./ExecutiveSummaryCard";
import { useProjectOverview } from "../hooks/useProjectOverview";
import { formatEnergy } from "../utils/format";
import { NavigationButtons } from '../components/NavigationButtons';
import { useMeasures } from '@/hooks/useMeasures';

export const OverviewPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { project, totalUsage, isLoading, error } = useProjectOverview(projectId);
  const { eems, wems, rcms } = useMeasures(projectId || '');

  // Calculate summary metrics
  const allMeasures = [...eems, ...wems, ...rcms];
  const totalAnnualSavings = allMeasures.reduce((sum, m) => sum + (m.estimatedSavings?.cost || 0), 0);
  const totalEnergySavings = allMeasures.reduce((sum, m) => sum + (m.estimatedSavings?.energy || 0), 0);
  const energySavingsPercent = (totalUsage?.totalElectric && totalEnergySavings) 
    ? Math.round((totalEnergySavings / totalUsage.totalElectric) * 100) 
    : 0;

  const stats = [
    {
      label: "Electric Usage",
      value: formatEnergy(totalUsage?.totalElectric),
      unit: "kWh/year",
      icon: Zap,
      description: "Annual electricity consumption",
      color: "text-yellow-600",
      bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
      borderColor: "border-yellow-200 dark:border-yellow-800"
    },
    {
      label: "Gas Usage", 
      value: formatEnergy(totalUsage?.naturalGasUsage),
      unit: "therms/year",
      icon: Flame,
      description: "Annual natural gas consumption",
      color: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-900/20", 
      borderColor: "border-orange-200 dark:border-orange-800"
    },
    {
      label: "Site EUI",
      value: (() => {
        if (project?.site_intensity) {
          const val = Number(project.site_intensity);
          if (!isNaN(val)) return val.toFixed(1);
        }
        if (project?.site_total_energy && project?.property_gross_floor_area) {
          const kWhPerFt2 = project.site_total_energy / project.property_gross_floor_area;
          const kBtuPerFt2 = kWhPerFt2 * 3.412;
          return kBtuPerFt2.toFixed(1);
        }
        return '--';
      })(),
      unit: "kBtu/ft²",
      icon: Gauge,
      description: "Energy use intensity per sq ft",
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      borderColor: "border-blue-200 dark:border-blue-800"
    },
    {
      label: "Potential Savings",
      value: energySavingsPercent > 0 ? `${energySavingsPercent}%` : '--',
      unit: "energy reduction",
      icon: TrendingUp,
      description: "Estimated energy savings opportunity", 
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-900/20",
      borderColor: "border-green-200 dark:border-green-800"
    },
    {
      label: "Annual Cost Savings",
      value: totalAnnualSavings > 0 ? `$${Math.round(totalAnnualSavings / 1000)}K` : '$0',
      unit: "per year",
      icon: Target,
      description: "Projected annual cost savings",
      color: "text-emerald-600", 
      bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
      borderColor: "border-emerald-200 dark:border-emerald-800"
    },
    {
      label: "GHG Reduction",
      value: project?.direct_ghg_emissions?.toLocaleString() ?? "--",
      unit: "kgCO2e/year",
      icon: Globe,
      description: "Greenhouse gas emissions impact",
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-900/20", 
      borderColor: "border-purple-200 dark:border-purple-800"
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 space-y-4 max-w-screen-xl mx-auto pt-16 lg:pt-4">
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600"></div>
            <span className="ml-2 text-sm text-muted-foreground">Loading project dashboard...</span>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <p className="text-sm text-red-600 dark:text-red-400">Failed to load project data. Please try again.</p>
          </div>
        )}

        {!isLoading && project && (
          <>
            {/* Hero Section - Enhanced */}
            <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-blue-50 dark:from-emerald-950/20 dark:via-background dark:to-blue-950/20 rounded-xl border border-border shadow-lg">
              <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
              <div className="relative p-6 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg">
                    <Building2 className="h-7 w-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold text-foreground mb-1">{project.name ?? "Property Dashboard"}</h1>
                    <p className="text-emerald-600 font-medium">ASHRAE Level II Energy Audit Report</p>
                  </div>
                  <div className="hidden sm:block text-right">
                    <div className="text-sm text-muted-foreground">Report Generated</div>
                    <div className="text-lg font-semibold text-foreground">{new Date().toLocaleDateString()}</div>
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
                        <div className="text-xs text-muted-foreground">Location</div>
                        <div className="font-medium text-foreground">{project.property_city}, {project.property_state}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-md">
                        <Award className="h-3.5 w-3.5 text-purple-600" />
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Built</div>
                        <div className="font-medium text-foreground">{project.property_year_built || "--"}</div>
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
                        <Target className="h-3.5 w-3.5 text-orange-600" />
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Property Type</div>
                        <div className="font-medium text-foreground capitalize">{project.property_primary_function || 'Commercial'}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Key Metrics + Benchmarks */}
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">Performance Overview</h2>
              
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Stats grid left */}
                <div className="flex-1 grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {stats.map((stat) => (
                    <div
                      key={stat.label}
                      className={`p-3 rounded-lg border ${stat.borderColor} ${stat.bgColor} hover:shadow-md transition-shadow`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <stat.icon className={`h-4 w-4 ${stat.color}`} />
                        <span className="font-medium text-foreground text-sm">{stat.label}</span>
                        {stat.label === "Potential Savings" && energySavingsPercent > 20 && (
                          <Award className="h-3 w-3 text-amber-500 ml-auto" />
                        )}
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold text-foreground">{stat.value}</span>
                        {stat.unit && <span className="text-sm text-muted-foreground">{stat.unit}</span>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 leading-tight">{stat.description}</p>
                    </div>
                  ))}
                </div>

                {/* Benchmarks on the right */}
                <div className="w-full lg:w-80">
                  <div className="bg-muted/30 rounded-lg p-4 h-full">
                    <h3 className="text-lg font-semibold text-foreground mb-3">Benchmark Performance</h3>
                    <PortfolioScoresCard
                      energyStar={project.energy_star_score as any}
                      waterScore={(project as any).water_score}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Executive Summary */}
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="bg-muted/50 px-4 py-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-emerald-600" />
                  <h2 className="text-lg font-semibold text-foreground">Executive Summary</h2>
                </div>
              </div>
              <div className="p-4">
                <ExecutiveSummaryCard projectId={projectId ?? ''} project={project} />
              </div>
            </div>
          </>
        )}

        {/* Navigation */}
        <NavigationButtons currentPage="overview" />
      </div>
    </div>
  );
}; 