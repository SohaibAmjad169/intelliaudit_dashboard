import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Measure } from '@/services/energy-analysis/common-eems';

interface MeasuresListProps {
  title: string;
  description: string;
  measures: Measure[];
  onSelectMeasure: (measure: Measure) => void;
}

export const MeasuresList: React.FC<MeasuresListProps> = ({
  title,
  description,
  measures,
  onSelectMeasure
}) => {
  if (!measures || measures.length === 0) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">No measures available.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          <Badge variant="outline">{measures.length}</Badge>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {measures.map((measure, index) => (
            <AccordionItem key={measure.id || index} value={measure.id || `measure-${index}`}>
              <AccordionTrigger className="text-base font-medium">
                {measure.title}
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 p-1">
                  <div>
                    <h4 className="text-sm font-semibold mb-1">Existing Condition</h4>
                    <p className="text-sm text-muted-foreground">{measure.existingCondition}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-semibold mb-1">Recommendation</h4>
                    <p className="text-sm text-muted-foreground">{measure.recommendation}</p>
                  </div>
                  
                  {measure.benefits && measure.benefits.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-1">Benefits</h4>
                      <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                        {measure.benefits.map((benefit, i) => (
                          <li key={i}>{benefit}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {measure.estimatedSavings && (
                    <div className="grid grid-cols-3 gap-2 mt-4">
                      {measure.estimatedSavings.energy !== undefined && (
                        <div className="bg-muted p-2 rounded-md text-center">
                          <p className="text-xs text-muted-foreground mb-1">Energy Savings</p>
                          <p className="font-semibold">{measure.estimatedSavings.energy}%</p>
                        </div>
                      )}
                      
                      {measure.estimatedSavings.cost !== undefined && (
                        <div className="bg-muted p-2 rounded-md text-center">
                          <p className="text-xs text-muted-foreground mb-1">Cost Savings</p>
                          <p className="font-semibold">{measure.estimatedSavings.cost}%</p>
                        </div>
                      )}
                      
                      {measure.estimatedSavings.paybackPeriod !== undefined && (
                        <div className="bg-muted p-2 rounded-md text-center">
                          <p className="text-xs text-muted-foreground mb-1">Payback Period</p>
                          <p className="font-semibold">{measure.estimatedSavings.paybackPeriod} years</p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <button 
                    className="mt-2 text-sm text-blue-500 hover:text-blue-600 underline"
                    onClick={() => onSelectMeasure(measure)}
                  >
                    View Details
                  </button>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}; 