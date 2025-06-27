import React, { useState } from 'react';
import { useMeasures } from '@/hooks/useMeasures';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Zap, Droplets, Settings, X, Camera, Info, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { usePhotoManagement } from '@/hooks/usePhotoManagement';
import { Link } from 'react-router-dom';

interface Props {
  projectId: string;
  project?: any;
}

interface Measure {
  id: string;
  title: string;
  existingCondition: string;
  recommendation: string;
  benefits: string[];
  implementationNotes?: string;
  calculationNotes?: string;
  estimatedSavings?: {
    cost?: number;
    energy?: number;
    demand?: number;
    therms?: number;
    water?: number;
    paybackPeriod?: number;
  };
  implementationCost?: number;
  incentives?: number;
  photoReferences?: string[];
  supportingImages?: {
    existing?: string;
    replacement?: string;
  };
}

// Clickable Photo ID component (copied from MeasuresView)
interface ClickablePhotoIdProps {
  text: string;
  photos: any[];
}

const ClickablePhotoId: React.FC<ClickablePhotoIdProps> = ({ text, photos }) => {
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);

  const combinedRegex = /(Photo ID ([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}))|(Photo URL (https?:\/\/[^\s]+(?:\.jpg|\.jpeg|\.png|\.gif)))|((https?:\/\/[^\s]+(?:\.jpg|\.jpeg|\.png|\.gif)))/gi;

  const parts: any[] = [];
  let lastIndex = 0;
  let match;

  while ((match = combinedRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: text.substring(lastIndex, match.index)
      });
    }

    if (match[1]) {
      parts.push({
        type: 'uuid',
        content: match[1],
        uuid: match[2]
      });
    } else if (match[3]) {
      parts.push({
        type: 'image',
        content: 'View Photo',
        url: match[4]
      });
    } else if (match[5]) {
      parts.push({
        type: 'image',
        content: 'View Photo',
        url: match[5]
      });
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({
      type: 'text',
      content: text.substring(lastIndex)
    });
  }

  const handleImageClick = (url: string) => {
    setSelectedImageUrl(url);
  };

  return (
    <>
      {parts.map((part, index) => {
        if (part.type === 'text') {
          return <span key={index}>{part.content}</span>;
        } else if (part.type === 'image') {
          return (
            <button
              key={index}
              className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/20 rounded"
              onClick={() => handleImageClick(part.url)}
              title={part.url}
            >
              <Camera className="h-4 w-4" /> {part.content}
            </button>
          );
        }
        return <span key={index}>{part.content}</span>;
      })}

      {selectedImageUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">Image Preview</h3>
              <button 
                onClick={() => setSelectedImageUrl(null)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            <div className="p-4">
              <img 
                src={selectedImageUrl} 
                alt="Preview" 
                className="max-w-full max-h-[80vh] object-contain mx-auto"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Measure Details Modal
const MeasureDetails: React.FC<{ measure: Measure; onClose: () => void; photos: any[] }> = ({ 
  measure, 
  onClose, 
  photos 
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold">{measure.title}</h2>
          <Button 
            onClick={onClose} 
            variant="ghost" 
            size="icon"
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Existing Condition</h3>
              <p className="text-gray-700 dark:text-gray-300 text-sm">
                <ClickablePhotoId text={measure.existingCondition} photos={photos} />
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Recommendation</h3>
              <p className="text-gray-700 dark:text-gray-300 text-sm">
                <ClickablePhotoId text={measure.recommendation} photos={photos} />
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Benefits</h3>
            <ul className="list-disc ml-5 space-y-1">
              {measure.benefits.map((benefit, index) => (
                <li key={index} className="text-gray-700 dark:text-gray-300 text-sm">
                  <ClickablePhotoId text={benefit} photos={photos} />
                </li>
              ))}
            </ul>
          </div>

          {measure.implementationNotes && (
            <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2 flex items-center">
                <Info className="h-5 w-5 mr-2 text-amber-600" />
                Implementation Notes
              </h3>
              <p className="text-gray-700 dark:text-gray-300 text-sm">
                <ClickablePhotoId text={measure.implementationNotes} photos={photos} />
              </p>
            </div>
          )}

          {measure.calculationNotes && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2 flex items-center">
                <Info className="h-5 w-5 mr-2 text-blue-600" />
                Savings & Incentive Calculation Notes
              </h3>
              <p className="text-gray-700 dark:text-gray-300 text-sm">
                <ClickablePhotoId text={measure.calculationNotes} photos={photos} />
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <h3 className="text-sm font-semibold mb-1">Cost Savings</h3>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                ${measure.estimatedSavings?.cost?.toLocaleString() || '0'}
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h3 className="text-sm font-semibold mb-1">Energy Savings</h3>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {measure.estimatedSavings?.energy?.toLocaleString() || '0'} kWh
              </p>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
              <h3 className="text-sm font-semibold mb-1">Payback Period</h3>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {Math.round(measure.estimatedSavings?.paybackPeriod || 0)} years
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Individual Audit Dashboard Component
const AuditDashboard: React.FC<{
  title: string;
  icon: React.ComponentType<any>;
  measures: Measure[];
  color: string;
  photos: any[];
  auditType: 'energy' | 'water' | 'rcx';
  projectId: string;
}> = ({ title, icon: Icon, measures, color, photos, auditType, projectId }) => {
  const [selectedMeasure, setSelectedMeasure] = useState<Measure | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const formatCurrency = (value?: number) => {
    if (!value) return '$0';
    return `$${value.toLocaleString()}`;
  };

  const totalSavings = measures.reduce((sum, m) => sum + (m.estimatedSavings?.cost || 0), 0);
  const avgPayback = measures.length > 0 
    ? measures.reduce((sum, m) => sum + (m.estimatedSavings?.paybackPeriod || 0), 0) / measures.length 
    : 0;

  // Show 2 measures initially, or all if expanded
  const visibleMeasures = isExpanded ? measures : measures.slice(0, 2);
  const hasMore = measures.length > 2;

  return (
    <>
      <Card className="h-full flex flex-col">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Icon className={`h-5 w-5 ${color}`} />
            {title}
            <Badge variant="secondary">{measures.length} measures</Badge>
          </CardTitle>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>Total Savings: {formatCurrency(totalSavings)}</span>
            <span>Avg Payback: {avgPayback.toFixed(1)} years</span>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col flex-1">
          <div className="space-y-2 flex-1">
            {visibleMeasures.map((measure, index) => (
              <div
                key={measure.id}
                className="p-3 border border-border rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => setSelectedMeasure(measure)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">{measure.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {measure.recommendation.length > 80 
                        ? `${measure.recommendation.substring(0, 80)}...` 
                        : measure.recommendation
                      }
                    </p>
                  </div>
                  <div className="text-right ml-3 flex-shrink-0">
                    <div className="text-sm font-semibold text-green-600">
                      {formatCurrency(measure.estimatedSavings?.cost)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {Math.round(measure.estimatedSavings?.paybackPeriod || 0)}yr payback
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {hasMore && (
              <div className="text-center py-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-xs"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="h-3 w-3 mr-1" />
                      Show less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3 w-3 mr-1" />
                      Show {measures.length - 2} more
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Call to action button - always at bottom */}
          <div className="border-t pt-4 mt-4">
            <Link to={`/share/projects/${projectId}/${auditType}`}>
              <Button className="w-full" size="sm">
                <ExternalLink className="h-4 w-4 mr-2" />
                View Full {title} Dashboard
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {selectedMeasure && (
        <MeasureDetails
          measure={selectedMeasure}
          onClose={() => setSelectedMeasure(null)}
          photos={photos}
        />
      )}
    </>
  );
};

export const AuditDashboards: React.FC<Props> = ({ projectId }) => {
  const { eems, wems, rcms, isLoading } = useMeasures(projectId);
  const { photos } = usePhotoManagement(projectId);

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading audit dashboards...</div>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-4">Audit Dashboards</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <AuditDashboard
            title="Energy Audit"
            icon={Zap}
            measures={eems}
            color="text-yellow-600"
            photos={photos}
            auditType="energy"
            projectId={projectId}
          />
          
          <AuditDashboard
            title="Water Audit"
            icon={Droplets}
            measures={wems}
            color="text-blue-600"
            photos={photos}
            auditType="water"
            projectId={projectId}
          />
          
          <AuditDashboard
            title="Retro-Commissioning"
            icon={Settings}
            measures={rcms}
            color="text-purple-600"
            photos={photos}
            auditType="rcx"
            projectId={projectId}
          />
        </div>
      </div>
    </div>
  );
}; 