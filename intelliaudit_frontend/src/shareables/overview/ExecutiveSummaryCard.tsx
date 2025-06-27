import React from 'react';
import { Link } from 'react-router-dom';
import { useMeasures } from '@/hooks/useMeasures';
import { buildIntroText, SCOPE_DEFINITIONS } from '../utils/buildExecutiveSummary';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  TrendingUp, 
  DollarSign, 
  Zap, 
  Droplets, 
  Settings, 
  Lightbulb,
  CheckCircle,
  Target,
  Calendar,
  Award,
  BarChart3,
  PieChart,
  ArrowRight,
  ExternalLink
} from 'lucide-react';

interface Props {
  projectId: string;
  project?: any;
}

export const ExecutiveSummaryCard: React.FC<Props> = ({ projectId, project }) => {
  const { eems, wems, rcms, isLoading } = useMeasures(projectId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        <span className="ml-3 text-muted-foreground">Loading executive summary...</span>
      </div>
    );
  }

  // Calculate key metrics
  const allMeasures = [...eems, ...wems, ...rcms];
  const totalAnnualSavings = allMeasures.reduce((sum, m) => sum + (m.estimatedSavings?.cost || 0), 0);
  const totalEnergySavings = allMeasures.reduce((sum, m) => sum + (m.estimatedSavings?.energy || 0), 0);
  const avgPayback = allMeasures.length > 0 
    ? allMeasures.reduce((sum, m) => sum + (m.estimatedSavings?.paybackPeriod || 0), 0) / allMeasures.length 
    : 0;

  // Build intro text
  const clientName = project?.company_name || project?.property_name || 'Client';
  const buildingAddress = project?.property_address || project?.building_address || 'Property Address';
  const constructionYear = project?.property_year_built || project?.year_built || 'N/A';
  const buildingType = project?.property_primary_function || 'commercial building';
  const squareFootage = project?.property_gross_floor_area || 0;

  const introText = buildIntroText(clientName, buildingAddress, constructionYear, buildingType, squareFootage);

  // Key findings for hero section
  const keyFindings = [
    {
      icon: DollarSign,
      title: "Annual Cost Savings",
      value: `$${Math.round(totalAnnualSavings / 1000)}K`,
      subtitle: "Projected annual savings",
      color: "text-green-600",
      bgColor: "bg-green-500",
      bgAccent: "bg-green-50 dark:bg-green-900/20"
    },
    {
      icon: Target,
      title: "Energy Reduction",
      value: totalEnergySavings > 0 ? `${Math.round(totalEnergySavings / 1000)}K` : '--',
      subtitle: "kWh annual savings",
      color: "text-blue-600", 
      bgColor: "bg-blue-500",
      bgAccent: "bg-blue-50 dark:bg-blue-900/20"
    },
    {
      icon: Calendar,
      title: "Payback Period", 
      value: avgPayback > 0 ? `${avgPayback.toFixed(1)} yrs` : '--',
      subtitle: "Average investment return",
      color: "text-purple-600",
      bgColor: "bg-purple-500", 
      bgAccent: "bg-purple-50 dark:bg-purple-900/20"
    },
    {
      icon: CheckCircle,
      title: "Measures Identified",
      value: allMeasures.length.toString(),
      subtitle: "Efficiency opportunities",
      color: "text-emerald-600",
      bgColor: "bg-emerald-500",
      bgAccent: "bg-emerald-50 dark:bg-emerald-900/20"
    }
  ];

  return (
    <div className="space-y-8">
      {/* Hero Section with Key Findings */}
      <div className="relative">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 dark:from-emerald-900/10 dark:via-blue-900/10 dark:to-purple-900/10 rounded-2xl"></div>
        
        <div className="relative p-6 space-y-6 relative">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="p-2 bg-emerald-600 rounded-lg">
                <Award className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">Key Findings & Recommendations</h2>
            </div>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our comprehensive audit identified significant opportunities for energy efficiency improvements and cost savings.
            </p>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {keyFindings.map((finding, idx) => (
              <div key={idx} className={`${finding.bgAccent} border border-border rounded-xl p-4 hover:shadow-lg transition-all duration-300 group`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 ${finding.bgColor} rounded-lg group-hover:scale-110 transition-transform`}>
                    <finding.icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm text-foreground">{finding.title}</h3>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className={`text-2xl font-bold ${finding.color}`}>{finding.value}</div>
                  <div className="text-xs text-muted-foreground">{finding.subtitle}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Call to Action */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              💡 Implementation support available to help execute these recommendations
            </p>
          </div>
        </div>
      </div>

      {/* Executive Summary Text */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-foreground">Executive Summary</h3>
        </div>
        <div className="text-sm leading-relaxed text-muted-foreground">
          {introText.split('\n\n').map((paragraph, idx) => (
            <p key={idx} className={idx > 0 ? 'mt-4' : ''}>
              {paragraph}
            </p>
          ))}
        </div>
      </div>

      {/* Audit Scope Sections */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Energy Audit */}
        <Link
          to={`/share/projects/${projectId}/energy`}
          className="group flex flex-col bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/10 dark:to-orange-900/10 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-pointer h-full"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-yellow-500 rounded-lg group-hover:scale-110 transition-transform">
                <Zap className="h-4 w-4 text-white" />
              </div>
              <h4 className="font-semibold text-foreground">Energy Audit</h4>
            </div>
            <ArrowRight className="h-4 w-4 text-yellow-600 group-hover:translate-x-1 transition-transform" />
          </div>
          <p className="text-xs text-muted-foreground mb-3">Comprehensive analysis of electrical systems and energy consumption patterns.</p>
          <div className="text-xs space-y-1 mb-3 flex-1">
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-green-500" />
              <span>HVAC System Analysis</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-green-500" />
              <span>Lighting Assessment</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-green-500" />
              <span>Building Envelope Review</span>
            </div>
          </div>
          <div className="mt-auto pt-3 border-t border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center gap-2 text-xs font-medium text-yellow-700 dark:text-yellow-400">
              <ExternalLink className="h-3 w-3" />
              <span>View Detailed Energy Analysis</span>
            </div>
          </div>
        </Link>

        {/* Water Audit */}
        <Link
          to={`/share/projects/${projectId}/water`}
          className="group flex flex-col bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/10 dark:to-cyan-900/10 border border-blue-200 dark:border-blue-800 rounded-xl p-4 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-pointer h-full"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-500 rounded-lg group-hover:scale-110 transition-transform">
                <Droplets className="h-4 w-4 text-white" />
              </div>
              <h4 className="font-semibold text-foreground">Water Audit</h4>
            </div>
            <ArrowRight className="h-4 w-4 text-blue-600 group-hover:translate-x-1 transition-transform" />
          </div>
          <p className="text-xs text-muted-foreground mb-3">Water usage analysis and conservation opportunity identification.</p>
          <div className="text-xs space-y-1 mb-3 flex-1">
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-green-500" />
              <span>Fixture Efficiency Analysis</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-green-500" />
              <span>Leak Detection Assessment</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-green-500" />
              <span>Conservation Strategies</span>
            </div>
          </div>
          <div className="mt-auto pt-3 border-t border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 text-xs font-medium text-blue-700 dark:text-blue-400">
              <ExternalLink className="h-3 w-3" />
              <span>View Water Conservation Analysis</span>
            </div>
          </div>
        </Link>

        {/* Retro-commissioning */}
        <Link
          to={`/share/projects/${projectId}/rcx`}
          className="group flex flex-col bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10 border border-purple-200 dark:border-purple-800 rounded-xl p-4 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-pointer h-full"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-500 rounded-lg group-hover:scale-110 transition-transform">
                <Settings className="h-4 w-4 text-white" />
              </div>
              <h4 className="font-semibold text-foreground">Retro-commissioning</h4>
            </div>
            <ArrowRight className="h-4 w-4 text-purple-600 group-hover:translate-x-1 transition-transform" />
          </div>
          <p className="text-xs text-muted-foreground mb-3">Building system optimization and performance tuning.</p>
          <div className="text-xs space-y-1 mb-3 flex-1">
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-green-500" />
              <span>System Optimization</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-green-500" />
              <span>Control Strategy Review</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-green-500" />
              <span>Performance Verification</span>
            </div>
          </div>
          <div className="mt-auto pt-3 border-t border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-2 text-xs font-medium text-purple-700 dark:text-purple-400">
              <ExternalLink className="h-3 w-3" />
              <span>View RCx Optimization Results</span>
            </div>
          </div>
        </Link>
      </div>

      {/* Detailed Scope Accordions */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <PieChart className="h-5 w-5 text-emerald-600" />
          <h3 className="text-lg font-semibold text-foreground">Detailed Scope of Work</h3>
        </div>
        
        <Accordion type="multiple" className="w-full">
          <AccordionItem value="energy" className="border-b border-border">
            <AccordionTrigger className="text-sm font-medium transition-colors focus:outline-none">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-500" />
                Energy Efficiency Audit Scope of Work
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <ol className="list-decimal list-inside space-y-2 text-sm ml-6">
                {SCOPE_DEFINITIONS.energy.map((item, idx) => (
                  <li key={idx} className="text-foreground/80 leading-relaxed">{item}</li>
                ))}
              </ol>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="water" className="border-b border-border">
            <AccordionTrigger className="text-sm font-medium transition-colors focus:outline-none">
              <div className="flex items-center gap-2">
                <Droplets className="h-4 w-4 text-blue-500" />
                Water Audit Scope of Work
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <ol className="list-decimal list-inside space-y-2 text-sm ml-6">
                {SCOPE_DEFINITIONS.water.map((item, idx) => (
                  <li key={idx} className="text-foreground/80 leading-relaxed">{item}</li>
                ))}
              </ol>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="rcx">
            <AccordionTrigger className="text-sm font-medium transition-colors focus:outline-none">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-purple-500" />
                Retro-commissioning (RCx) Scope of Work
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <ol className="list-decimal list-inside space-y-2 text-sm ml-6">
                {SCOPE_DEFINITIONS.rcx.map((item, idx) => (
                  <li key={idx} className="text-foreground/80 leading-relaxed">{item}</li>
                ))}
              </ol>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}; 