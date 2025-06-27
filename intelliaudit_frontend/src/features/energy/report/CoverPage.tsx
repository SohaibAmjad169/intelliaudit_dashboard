import React from 'react';
import { Building, Calendar, Mail, Phone } from 'lucide-react';

interface CoverPageProps {
  projectName: string;
  projectAddress: string;
  projectCity?: string;
  projectState?: string;
  projectZip?: string;
  projectId: string;
  clientName: string;
  clientCompany?: string;
  clientEmail?: string;
  clientPhone?: string;
  auditorCompany?: string;
  auditorAddress?: string;
  auditorEmail?: string;
  auditorPhone?: string;
  auditDate: string;
  // Properties that are received but not currently used in the component
  // Using underscore prefix to indicate they are intentionally unused
  _yearBuilt?: number;
  _numberOfResidentialFloors?: number;
  _numberOfParkingLevels?: number;
  _grossFloorArea?: number;
}

export const CoverPage: React.FC<CoverPageProps> = ({
  projectName,
  projectAddress,
  projectCity = 'Los Angeles',
  projectState = 'CA',
  projectZip = '90000',
  projectId,
  clientName,
  clientCompany = '',
  clientEmail = '',
  clientPhone = '',
  auditorCompany = 'IntelliAudit',
  auditorAddress = '123 Energy Way, Suite 100, Los Angeles, CA 90001',
  auditorEmail = 'info@intelliaudit.com',
  auditorPhone = '(555) 123-4567',
  auditDate,
  // These properties are received but not currently used in the component
  // @ts-ignore -- Intentionally unused property
  _yearBuilt,
  // @ts-ignore -- Intentionally unused property
  _numberOfResidentialFloors,
  // @ts-ignore -- Intentionally unused property
  _numberOfParkingLevels,
  // @ts-ignore -- Intentionally unused property
  _grossFloorArea
}) => {
  // Format the full address
  const fullAddress = projectAddress;
  const cityStateZip = `${projectCity}, ${projectState} ${projectZip}`;
  
  return (
    <div className="min-h-screen flex flex-col justify-between print:page-break-after pb-10">
      {/* Header */}
      <div className="text-center mb-16 mt-10">
        <h1 className="text-3xl font-bold mb-2">ASHRAE Level II Energy Audit, Water Audit & Retro-Commissioning Report</h1>
      </div>
      
      {/* Main Content */}
      <div className="flex-grow mb-16">
        {/* Property Information */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold mb-4">Property Address:</h2>
          <div className="text-lg">
            <p className="font-medium">{projectName || 'Property Name'}</p>
            <p>{fullAddress}</p>
            <p>{cityStateZip}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-8 mb-12">
          <div>
            <p className="flex items-center mb-2">
              <Building className="h-5 w-5 mr-2" />
              <span className="font-medium">Building ID:</span> {projectId}
            </p>
          </div>
          <div>
            <p className="flex items-center mb-2">
              <Calendar className="h-5 w-5 mr-2" />
              <span className="font-medium">Report Date:</span> {auditDate}
            </p>
          </div>
        </div>
        
        {/* Client Information */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold mb-4">Prepared For:</h2>
          <div>
            <p>{clientName}</p>
            <p>{clientCompany}</p>
            <p className="flex items-center">
              <Mail className="h-4 w-4 mr-2" />
              {clientEmail}
            </p>
            <p className="flex items-center">
              <Phone className="h-4 w-4 mr-2" />
              {clientPhone}
            </p>
          </div>
        </div>
        
        {/* Auditor Information */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Prepared By:</h2>
          <div>
            <p>{auditorCompany}</p>
            <p>{auditorAddress}</p>
            <p className="flex items-center">
              <Mail className="h-4 w-4 mr-2" />
              {auditorEmail}
            </p>
            <p className="flex items-center">
              <Phone className="h-4 w-4 mr-2" />
              {auditorPhone}
            </p>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="border-t pt-4 text-center text-sm text-muted-foreground">
        <p>CONFIDENTIAL: This document contains proprietary information and is intended only for the client listed above.</p>
      </div>
    </div>
  );
}; 