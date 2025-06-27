import React from 'react';
import { Lightbulb, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Recommendation {
  id?: string;
  title: string;
  description: string;
  estimatedSavings: string;
  implementationCost: string;
  paybackPeriod: string;
}

interface RecommendationsProps {
  recommendations: Recommendation[];
}

export const Recommendations: React.FC<RecommendationsProps> = ({
  recommendations
}) => {
  return (
    <div>
      <h3 className="text-lg font-medium mb-4 flex items-center print:page-break-before">
        <Lightbulb className="h-5 w-5 mr-2" />
        Recommendations
      </h3>
      
      {recommendations.length > 0 ? (
        <div className="space-y-4">
          {recommendations.map((rec, index) => (
            <Card key={index}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                  {rec.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-3">{rec.description}</p>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground block">Estimated Savings:</span>
                    <span className="font-medium">{rec.estimatedSavings}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Implementation Cost:</span>
                    <span className="font-medium">{rec.implementationCost}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Payback Period:</span>
                    <span className="font-medium">{rec.paybackPeriod}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="bg-muted/20 p-6 rounded-md text-center">
          <Lightbulb className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <h4 className="font-medium mb-2">No Recommendations Available</h4>
          <p className="text-muted-foreground">
            Energy-saving recommendations will appear here after completing an energy analysis.
          </p>
        </div>
      )}
    </div>
  );
};
