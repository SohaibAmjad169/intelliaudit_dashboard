import React from 'react';
import { Building } from 'lucide-react';

interface FacilityInformationProps {
  buildingType: string;
  buildingSize: number;
  buildingSizeUnit: string;
  constructionYear: number;
  location: string;
  auditDate: string;
  weatherConditions?: string;
  formatNumber: (value?: number) => string;
}

export const FacilityInformation: React.FC<FacilityInformationProps> = ({
  buildingType,
  buildingSize,
  buildingSizeUnit,
  constructionYear,
  location,
  auditDate,
  weatherConditions,
  formatNumber
}) => {
  return (
    <div>
      <h3 className="text-lg font-medium mb-4 flex items-center">
        <Building className="h-5 w-5 mr-2" />
        Facility Information
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <h4 className="font-medium mb-2">Building Details</h4>
          <ul className="space-y-2 text-sm">
            <li><span className="text-muted-foreground">Building Type:</span> {buildingType || 'N/A'}</li>
            <li><span className="text-muted-foreground">Size:</span> {formatNumber(buildingSize)} {buildingSizeUnit || 'sq ft'}</li>
            <li><span className="text-muted-foreground">Year Built:</span> {constructionYear || 'N/A'}</li>
            <li><span className="text-muted-foreground">Location:</span> {location || 'N/A'}</li>
          </ul>
        </div>
        
        <div>
          <h4 className="font-medium mb-2">Audit Information</h4>
          <ul className="space-y-2 text-sm">
            <li><span className="text-muted-foreground">Audit Date:</span> {auditDate || new Date().toLocaleDateString()}</li>
            <li><span className="text-muted-foreground">Audit Type:</span> Comprehensive Energy Assessment</li>
            <li><span className="text-muted-foreground">Weather Conditions:</span> {weatherConditions || 'N/A'}</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
