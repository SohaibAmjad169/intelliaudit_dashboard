import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building, Users, Home, Layers } from 'lucide-react';
import { BuildingInfo } from '../types/energyAnalysis.types';

interface BuildingInformationCardProps {
  buildingInfo: BuildingInfo;
}

export const BuildingInformationCard: React.FC<BuildingInformationCardProps> = ({
  buildingInfo
}) => {
  const { totalUnits, unitTypes, occupancyRate, buildingType, floors, squareFootage } = buildingInfo;
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center text-lg">
          <Building className="w-5 h-5 mr-2" />
          Building Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center text-muted-foreground">
              <Home className="w-4 h-4 mr-2" />
              <span>Building Type</span>
            </div>
            <span className="font-medium capitalize">{buildingType}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center text-muted-foreground">
              <Layers className="w-4 h-4 mr-2" />
              <span>Floors</span>
            </div>
            <span className="font-medium">{floors}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center text-muted-foreground">
              <Users className="w-4 h-4 mr-2" />
              <span>Occupancy Rate</span>
            </div>
            <span className="font-medium">{occupancyRate} persons/unit</span>
          </div>
          
          {squareFootage && (
            <div className="flex items-center justify-between">
              <div className="flex items-center text-muted-foreground">
                <span>Square Footage</span>
              </div>
              <span className="font-medium">{squareFootage.toLocaleString()} sq ft</span>
            </div>
          )}
          
          <div className="pt-4 border-t">
            <h3 className="text-sm font-semibold mb-3">Unit Breakdown</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-muted/50 p-3 rounded-md">
                <div className="text-muted-foreground text-xs">Total Units</div>
                <div className="text-xl font-bold">{totalUnits}</div>
              </div>
              
              <div className="bg-muted/50 p-3 rounded-md">
                <div className="text-muted-foreground text-xs">Two Bedroom</div>
                <div className="text-xl font-bold">{unitTypes.twoBedroom}</div>
              </div>
              
              <div className="bg-muted/50 p-3 rounded-md">
                <div className="text-muted-foreground text-xs">One BR/Studio</div>
                <div className="text-xl font-bold">{unitTypes.oneBedroom + unitTypes.studio}</div>
                <div className="text-xs text-muted-foreground flex justify-between">
                  <span>1BR: {unitTypes.oneBedroom}</span>
                  <span>Studio: {unitTypes.studio}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 