import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { reportsService } from '@/services/reports/index';
import {
  Users,
  Download,
  Phone,
  Mail,
  MapPin,
  Star,
  CheckCircle,
  Calendar,
  FileText,
  Building,
  DollarSign,
  ExternalLink,
  ChevronRight,
  AlertTriangle,
  Award,
  Shield,
  Target,
  Sparkles,
  Clock,
  Rocket,
  Loader2
} from 'lucide-react';
import { useProjectOverview } from '../hooks/useProjectOverview';
import { NavigationButtons } from '../components/NavigationButtons';

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
    priority: Award,
    info: Shield
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
    if (title.includes('Contractor') || title.includes('Network')) {
      return "border-green-300 bg-gradient-to-br from-green-50 via-white to-green-50 dark:from-green-950/10 dark:via-background dark:to-green-950/10 hover:shadow-green-200/50";
    } else if (title.includes('Project') || title.includes('Management')) {
      return "border-blue-300 bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-blue-950/10 dark:via-background dark:to-blue-950/10 hover:shadow-blue-200/50";
    } else if (title.includes('Financing') || title.includes('Incentives')) {
      return "border-purple-300 bg-gradient-to-br from-purple-50 via-white to-purple-50 dark:from-purple-950/10 dark:via-background dark:to-purple-950/10 hover:shadow-purple-200/50";
    } else if (title.includes('Implementation') || title.includes('Planning')) {
      return "border-orange-300 bg-gradient-to-br from-orange-50 via-white to-orange-50 dark:from-orange-950/10 dark:via-background dark:to-orange-950/10 hover:shadow-orange-200/50";
    } else if (title.includes('Quality') || title.includes('Verification')) {
      return "border-teal-300 bg-gradient-to-br from-teal-50 via-white to-teal-50 dark:from-teal-950/10 dark:via-background dark:to-teal-950/10 hover:shadow-teal-200/50";
    } else if (title.includes('Documentation') || title.includes('Support')) {
      return "border-indigo-300 bg-gradient-to-br from-indigo-50 via-white to-indigo-50 dark:from-indigo-950/10 dark:via-background dark:to-indigo-950/10 hover:shadow-indigo-200/50";
    }
    return "border-slate-300 bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950/10 dark:via-background dark:to-slate-950/10 hover:shadow-slate-200/50";
  };

  const getIconColor = (title: string) => {
    if (title.includes('Contractor') || title.includes('Network')) return "text-green-600";
    if (title.includes('Project') || title.includes('Management')) return "text-blue-600";
    if (title.includes('Financing') || title.includes('Incentives')) return "text-purple-600";
    if (title.includes('Implementation') || title.includes('Planning')) return "text-orange-600";
    if (title.includes('Quality') || title.includes('Verification')) return "text-teal-600";
    if (title.includes('Documentation') || title.includes('Support')) return "text-indigo-600";
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

export const NextStepsPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { project, isLoading } = useProjectOverview(projectId);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const [activeModal, setActiveModal] = useState<string | null>(null);

  if (isLoading) {
    return <div className="p-6">Loading next steps...</div>;
  }

  if (!project) {
    return <div className="p-6">Project not found</div>;
  }

  const handleDownloadPdf = async () => {
    if (!projectId) return;

    try {
      setGeneratingPdf(true);

      // 1. Generate the PDF (replace with your actual API call)
      const pdfBlob = await reportsService.generateProjectReportPdf(projectId);

      // 2. Create download link
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `energy-audit-report-${projectId}.pdf`;

      // 3. Trigger download
      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('PDF download failed:', error);
      alert('Failed to download PDF. Please try again.');
    } finally {
      setGeneratingPdf(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto pt-16 lg:pt-6">
      {/* Enhanced Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-green-50 via-white to-teal-50 dark:from-green-950/20 dark:via-background dark:to-teal-950/20 rounded-xl border border-border shadow-lg">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="relative p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl shadow-lg">
              <Target className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground mb-1">Next Steps & Implementation</h1>
              <p className="text-green-700 dark:text-green-300 font-medium">
                Ready to implement your energy efficiency recommendations for {project.name}
              </p>
            </div>
            <div className="hidden sm:block text-right">
              <div className="text-sm text-muted-foreground">Implementation Status</div>
              <div className="text-lg font-semibold text-foreground">Ready to Start</div>
            </div>
          </div>

          {/* Implementation Overview - Enhanced */}
          <div className="bg-white/60 dark:bg-black/20 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-md">
                  <Users className="h-3.5 w-3.5 text-green-600" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Contractors</div>
                  <div className="font-medium text-foreground">50+ qualified</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-md">
                  <Building className="h-3.5 w-3.5 text-blue-600" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Project Support</div>
                  <div className="font-medium text-foreground">End-to-end</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-md">
                  <DollarSign className="h-3.5 w-3.5 text-purple-600" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Financing</div>
                  <div className="font-medium text-foreground">Multiple options</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-teal-100 dark:bg-teal-900/30 rounded-md">
                  <CheckCircle className="h-3.5 w-3.5 text-teal-600" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Quality</div>
                  <div className="font-medium text-foreground">Guaranteed results</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Actions Row - Enhanced */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mx-4">
        <Card className="relative overflow-visible border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/30 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-4 text-center">
            <Button className="w-full mb-2 bg-blue-600 hover:bg-blue-700" onClick={() => setActiveModal('contact')}>
              <Phone className="h-4 w-4 mr-2" />
              Contact Us
            </Button>
            <div className="text-sm text-blue-700/80 dark:text-blue-300/80">Get expert guidance</div>
          </CardContent>
        </Card>

        <Card className="relative overflow-visible border-green-200 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/30 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-4 text-center">
            <Button variant="outline" className="w-full mb-2 border-green-600 text-green-700 hover:bg-green-50" onClick={() => setActiveModal('downloads')}>
              <Download className="h-4 w-4 mr-2" />
              Download Report
            </Button>
            <div className="text-sm text-green-700/80 dark:text-green-300/80">Full documentation</div>
          </CardContent>
        </Card>

        <Card className="relative overflow-visible border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/30 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-4 text-center">
            <Button variant="outline" className="w-full mb-2 border-purple-600 text-purple-700 hover:bg-purple-50" onClick={() => setActiveModal('contractors')}>
              <Users className="h-4 w-4 mr-2" />
              Find Contractors
            </Button>
            <div className="text-sm text-purple-700/80 dark:text-purple-300/80">Qualified professionals</div>
          </CardContent>
        </Card>

        <Card className="relative overflow-visible border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/30 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-4 text-center">
            <Button variant="outline" className="w-full mb-2 border-orange-600 text-orange-700 hover:bg-orange-50" onClick={() => setActiveModal('schedule')}>
              <Calendar className="h-4 w-4 mr-2" />
              Schedule Consultation
            </Button>
            <div className="text-sm text-orange-700/80 dark:text-orange-300/80">Free 30-min call</div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mx-4 mb-8">

        {/* Contractor Network */}
        <SummaryCard
          title="Qualified Contractor Network"
          icon={Users}
          summary="Access our network of pre-screened, qualified contractors specializing in energy efficiency upgrades and building improvements."
          metrics={[
            { label: "Local Contractors", value: "50+ vetted" },
            { label: "Success Rate", value: "98% satisfaction" }
          ]}
          badge="Free Matching"
          callout={{ type: 'success', text: 'VERIFIED' }}
          onDrillDown={() => setActiveModal('contractors')}
        />

        {/* Project Management */}
        <SummaryCard
          title="Project Management Support"
          icon={Building}
          summary="End-to-end project support from planning through completion, including permit assistance and quality oversight."
          metrics={[
            { label: "Project Tracking", value: "Real-time updates" },
            { label: "Quality Assurance", value: "On-site inspections" }
          ]}
          onDrillDown={() => setActiveModal('project-support')}
        />

        {/* Financing Assistance */}
        <SummaryCard
          title="Financing & Incentives"
          icon={DollarSign}
          summary="Help identifying and applying for rebates, tax credits, and financing options to maximize your project ROI."
          metrics={[
            { label: "Rebate Programs", value: "Utility & State" },
            { label: "Financing Options", value: "Multiple sources" }
          ]}
          onDrillDown={() => setActiveModal('financing')}
        />

        {/* Implementation Planning */}
        <SummaryCard
          title="Implementation Planning"
          icon={Calendar}
          summary="Strategic project planning to minimize disruption and ensure successful completion of your efficiency upgrades."
          metrics={[
            { label: "Timeline Planning", value: "Optimized schedule" },
            { label: "Coordination", value: "Multi-trade projects" }
          ]}
          onDrillDown={() => setActiveModal('planning')}
        />

        {/* Quality Assurance */}
        <SummaryCard
          title="Quality Assurance & Verification"
          icon={CheckCircle}
          summary="Post-installation verification and commissioning to ensure measures are performing as expected."
          metrics={[
            { label: "Performance Testing", value: "IPMVP protocols" },
            { label: "Warranty Support", value: "1-year guarantee" }
          ]}
          onDrillDown={() => setActiveModal('quality')}
        />

        {/* Documentation & Support */}
        <SummaryCard
          title="Documentation & Support"
          icon={FileText}
          summary="Complete project documentation, O&M manuals, and ongoing support for your energy efficiency investments."
          metrics={[
            { label: "Documentation", value: "Complete package" },
            { label: "Support", value: "12-month follow-up" }
          ]}
          onDrillDown={() => setActiveModal('documentation')}
        />
      </div>

      {/* Enhanced Contact Form Section */}
      <Card className="mt-8 relative overflow-hidden border border-border shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-emerald-950/10 dark:via-background dark:to-teal-950/10"></div>
        <div className="relative">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg">
                <Rocket className="h-5 w-5 text-white" />
              </div>
              Get Started Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-emerald-600" />
                  Ready to move forward?
                </h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Contact us to discuss your project and connect with qualified contractors in your area.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Free contractor matching service
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Project management support
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Financing and incentive assistance
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Quality assurance and verification
                  </li>
                </ul>
              </div>
              <div className="space-y-4">
                <Button className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700" size="lg" onClick={() => setActiveModal('contact')}>
                  <Phone className="h-5 w-5 mr-2" />
                  Schedule Free Consultation
                </Button>
                <Button variant="outline" className="w-full border-emerald-600 text-emerald-700 hover:bg-emerald-50" size="lg" onClick={() => setActiveModal('downloads')}>
                  <Download className="h-5 w-5 mr-2" />
                  Download Complete Report
                </Button>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Questions? Call us at <strong className="text-emerald-700">(555) 123-4567</strong>
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </div>
      </Card>

      {/* Navigation */}
      <NavigationButtons currentPage="next-steps" />

      {/* Drill-down Modals */}
      <DrillDownModal
        title="Contact Information"
        isOpen={activeModal === 'contact'}
        onClose={() => setActiveModal(null)}
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Phone className="h-5 w-5 text-blue-600" />
                  Phone Support
                </h4>
                <p className="text-lg font-semibold mb-2">(555) 123-4567</p>
                <p className="text-sm text-muted-foreground">
                  Monday - Friday: 8:00 AM - 6:00 PM PST<br />
                  Emergency support available 24/7
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Mail className="h-5 w-5 text-green-600" />
                  Email Support
                </h4>
                <p className="text-lg font-semibold mb-2">support@intelliaudit.com</p>
                <p className="text-sm text-muted-foreground">
                  Response time: Within 2 hours<br />
                  For urgent matters, please call
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-4">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-orange-600" />
                Office Location
              </h4>
              <p className="mb-2">
                123 Energy Efficiency Drive<br />
                Suite 200<br />
                Green Building City, CA 90210
              </p>
              <Button variant="outline" size="sm">
                <MapPin className="h-4 w-4 mr-2" />
                Get Directions
              </Button>
            </CardContent>
          </Card>
        </div>
      </DrillDownModal>

      <DrillDownModal
        title="Qualified Contractor Network"
        isOpen={activeModal === 'contractors'}
        onClose={() => setActiveModal(null)}
      >
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Our network includes pre-screened contractors specializing in energy efficiency upgrades.
          </p>

          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h5 className="font-medium mb-2">EcoEfficiency Contractors #{i}</h5>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex">
                          {[...Array(5)].map((_, j) => (
                            <Star key={j} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                        <span className="text-sm text-muted-foreground">4.9/5 (127 reviews)</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Specializes in HVAC upgrades, lighting retrofits, and building envelope improvements.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">HVAC</Badge>
                        <Badge variant="secondary">Lighting</Badge>
                        <Badge variant="secondary">Insulation</Badge>
                        <Badge variant="secondary">Controls</Badge>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Contact
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardContent className="p-4 text-center">
              <h5 className="font-medium mb-2">Need contractor recommendations?</h5>
              <p className="text-sm text-muted-foreground mb-4">
                We'll match you with the best contractors for your specific project needs.
              </p>
              <Button>
                <Users className="h-4 w-4 mr-2" />
                Request Contractor Matching
              </Button>
            </CardContent>
          </Card>
        </div>
      </DrillDownModal>

      <DrillDownModal
        title="Download Reports & Documentation"
        isOpen={activeModal === 'downloads'}
        onClose={() => setActiveModal(null)}
      >
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Download your complete audit report and supporting documentation.
          </p>

          <div className="grid gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-medium">Complete Energy Audit Report</h5>
                    <p className="text-sm text-muted-foreground">Comprehensive PDF with all findings and recommendations</p>
                  </div>

                  <Button
                    onClick={handleDownloadPdf}
                    disabled={generatingPdf}
                  >
                    {generatingPdf ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Download PDF
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Download PDF
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-medium">Financial Analysis Spreadsheet</h5>
                    <p className="text-sm text-muted-foreground">Detailed calculations and ROI analysis</p>
                  </div>
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Download Excel
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-medium">Implementation Checklist</h5>
                    <p className="text-sm text-muted-foreground">Step-by-step guide for project execution</p>
                  </div>
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-medium">Equipment Specifications</h5>
                    <p className="text-sm text-muted-foreground">Technical specs for recommended equipment</p>
                  </div>
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DrillDownModal>

      {/* Additional modals for other sections */}
      <DrillDownModal
        title="Schedule Consultation"
        isOpen={activeModal === 'schedule'}
        onClose={() => setActiveModal(null)}
      >
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Schedule a free 30-minute consultation to discuss your project implementation.
          </p>

          <Card>
            <CardContent className="p-6 text-center">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-blue-600" />
              <h5 className="font-medium mb-2">Free Project Consultation</h5>
              <p className="text-sm text-muted-foreground mb-4">
                Discuss your audit results, implementation timeline, and contractor selection.
              </p>
              <Button size="lg">
                <Calendar className="h-5 w-5 mr-2" />
                Schedule Now
              </Button>
            </CardContent>
          </Card>
        </div>
      </DrillDownModal>

      <DrillDownModal
        title="Project Management Support"
        isOpen={activeModal === 'project-support'}
        onClose={() => setActiveModal(null)}
      >
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Comprehensive project management from planning through completion.
          </p>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Services Included
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside dark:text-gray-200 space-y-1 pl-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Project timeline development and coordination
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Permit assistance and regulatory compliance
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Quality control and on-site inspections
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Progress tracking and reporting
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Final commissioning and performance verification
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </DrillDownModal>

      <DrillDownModal
        title="Financing & Incentives"
        isOpen={activeModal === 'financing'}
        onClose={() => setActiveModal(null)}
      >
        <div className="space-y-4">
          <p className="text-muted-foreground">
            We help you identify and secure financing and incentives to maximize your project ROI.
          </p>

          <div className="grid gap-4">
            <Card>
              <CardContent className="p-4">
                <h5 className="font-medium mb-2">Utility Rebates</h5>
                <p className="text-sm text-muted-foreground">
                  Access to local utility rebate programs for energy efficiency upgrades.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h5 className="font-medium mb-2">Tax Credits</h5>
                <p className="text-sm text-muted-foreground">
                  Federal and state tax credit opportunities for qualifying improvements.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h5 className="font-medium mb-2">PACE Financing</h5>
                <p className="text-sm text-muted-foreground">
                  Property Assessed Clean Energy financing for commercial properties.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </DrillDownModal>

      <DrillDownModal
        title="Implementation Planning"
        isOpen={activeModal === 'planning'}
        onClose={() => setActiveModal(null)}
      >
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Strategic planning to ensure successful project implementation with minimal disruption.
          </p>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Planning Process
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside dark:text-gray-200 space-y-1 pl-2">
                  <li>Project scope finalization and prioritization</li>
                  <li>Contractor selection and qualification</li>
                  <li>Permit applications and approvals</li>
                  <li>Material procurement and staging</li>
                  <li>Installation scheduling and coordination</li>
                  <li>Commissioning and performance testing</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </DrillDownModal>

      <DrillDownModal
        title="Quality Assurance & Verification"
        isOpen={activeModal === 'quality'}
        onClose={() => setActiveModal(null)}
      >
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Comprehensive quality assurance to ensure your energy efficiency investments perform as expected.
          </p>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Quality Processes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside dark:text-gray-200 space-y-1 pl-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Pre-installation equipment verification
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Installation quality inspections
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Functional performance testing
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Energy savings verification
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    12-month performance monitoring
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </DrillDownModal>

      <DrillDownModal
        title="Documentation & Support"
        isOpen={activeModal === 'documentation'}
        onClose={() => setActiveModal(null)}
      >
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Complete documentation package and ongoing support for your energy efficiency investments.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Documentation Package
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>As-built drawings and specifications</li>
                  <li>Operation and maintenance manuals</li>
                  <li>Warranty information and contacts</li>
                  <li>Performance baseline and monitoring plan</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Ongoing Support
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>12-month performance follow-up</li>
                  <li>Troubleshooting and technical support</li>
                  <li>Additional optimization opportunities</li>
                  <li>Energy management best practices</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </DrillDownModal>
    </div>
  );
}; 


