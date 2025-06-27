import React from 'react';
import { Building, Building2, Flame, Zap, Calendar, FileSearch } from 'lucide-react';
import { ReportData, EcoData, FacilityInfo } from './types';

interface SiteOverviewProps {
  reportData: ReportData;
  ecoData: EcoData;
}

export const SiteOverview: React.FC<SiteOverviewProps> = ({ reportData, ecoData }) => {
  // Extract facility information
  const extractFacilityInfo = (observations: string[] = []): FacilityInfo => {
    const facilityObs = observations.find(obs => 
      obs?.toLowerCase().includes('building') || 
      obs?.toLowerCase().includes('facility')
    ) || '';

    // Try to parse building_info if available
    let buildingInfo = null;
    try {
      if (reportData.project?.building_info) {
        buildingInfo = typeof reportData.project.building_info === 'string' 
          ? JSON.parse(reportData.project.building_info)
          : reportData.project.building_info;
      }
    } catch (error) {
      console.error('Error parsing building_info:', error);
    }

    return {
      type: buildingInfo?.type || (facilityObs.includes('multifamily') ? 'Multifamily Housing' : 'Commercial Building'),
      size: facilityObs.match(/(\d{1,3}(,\d{3})*(\.\d+)?\s*sq\s*ft)/i)?.[0] || 'Not available',
      purpose: facilityObs.includes('multifamily') ? 'Residential Housing' : 'Commercial Use',
      notes: buildingInfo?.notes || '',
      floors: buildingInfo?.floors || 0,
      total_units: reportData.project?.total_units || buildingInfo?.total_units || 0,
      unit_types: buildingInfo?.unit_types || [],
      location: reportData.project?.property_address || reportData.project?.building_address || buildingInfo?.address || 'Address not available',
      inspectionDate: new Date().toLocaleDateString()
    };
  };

  // Get facility info
  const facilityInfo = extractFacilityInfo(ecoData.observations);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-8">
      {ecoData.isLoading ? (
        <div className="py-4 text-center text-gray-500">Loading site overview...</div>
      ) : (
        <>
          {/* Facility Description */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2 flex items-center">
              <Building2 className="h-4 w-4 mr-1 text-emerald-600" />
              Facility Description
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {ecoData.summary || 'No facility description available.'}
            </p>
            
            {facilityInfo.notes && (
              <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700 mb-4">
                <h4 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Building Notes</h4>
                <p className="text-gray-600 dark:text-gray-400">{facilityInfo.notes}</p>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
              <div>
                <div className="mb-3">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Building Type:</span>
                  <span className="ml-2 text-gray-700 dark:text-gray-300">{facilityInfo.type}</span>
                </div>
                
                <div className="mb-3">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Number of Floors:</span>
                  <span className="ml-2 text-gray-700 dark:text-gray-300">{facilityInfo.floors || 'Not specified'}</span>
                </div>
                
                <div className="mb-3">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Address:</span>
                  <span className="ml-2 text-gray-700 dark:text-gray-300">{facilityInfo.location}</span>
                </div>
              </div>
              
              <div>
                <div className="mb-3">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Units:</span>
                  <span className="ml-2 text-gray-700 dark:text-gray-300">{facilityInfo.total_units || 'Not specified'}</span>
                </div>
                
                {facilityInfo.unit_types && facilityInfo.unit_types.length > 0 && (
                  <div className="mb-3">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Unit Types:</span>
                    <ul className="mt-1 pl-5 list-disc text-sm text-gray-700 dark:text-gray-300">
                      {facilityInfo.unit_types.map((unit, index) => (
                        <li key={index}>{unit.type} ({unit.count} units)</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <hr className="my-5 border-t border-gray-200 dark:border-gray-700" />
          
          {/* HVAC Systems */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2 flex items-center">
              <Flame className="h-4 w-4 mr-1 text-orange-500" />
              HVAC Systems
            </h3>
            {ecoData.hvacEquipment && ecoData.hvacEquipment.length > 0 ? (
              <>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {ecoData.hvacSystemDescription || ecoData.observations?.find((obs) => obs?.includes('HVAC'))}
                </p>
                <div className="mt-2">
                  <h4 className="text-sm font-medium mb-2">Equipment Inventory:</h4>
                  <ul className="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
                    {Array.isArray(ecoData.hvacEquipment) ? (
                      ecoData.hvacEquipment.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))
                    ) : (
                      <li>{ecoData.hvacEquipment}</li>
                    )}
                  </ul>
                </div>
              </>
            ) : (
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {ecoData.hvacSystemDescription || ecoData.observations?.find((obs) => obs?.includes('HVAC')) || 'No HVAC system information available.'}
              </p>
            )}
          </div>
          
          <hr className="my-5 border-t border-gray-200 dark:border-gray-700" />
          
          {/* Lighting Systems */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2 flex items-center">
              <Zap className="h-4 w-4 mr-1 text-yellow-500" />
              Lighting Systems
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {ecoData.lightingSystemDescription || ecoData.observations?.find((obs) => obs?.toLowerCase().includes('lighting')) || 'No lighting system information available.'}
            </p>
            {ecoData.lightingEquipment && ecoData.lightingEquipment.length > 0 && (
              <div className="mt-2">
                <h4 className="text-sm font-medium mb-2">Equipment Inventory:</h4>
                <ul className="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
                  {Array.isArray(ecoData.lightingEquipment) ? (
                    ecoData.lightingEquipment.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))
                  ) : (
                    <li>{ecoData.lightingEquipment}</li>
                  )}
                </ul>
              </div>
            )}
          </div>
          
          <hr className="my-5 border-t border-gray-200 dark:border-gray-700" />
          
          {/* Building Envelope */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2 flex items-center">
              <Building className="h-4 w-4 mr-1 text-emerald-500" />
              Building Envelope
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {ecoData.buildingEnvelopeDescription || ecoData.observations?.find((obs) => obs?.toLowerCase().includes('building')) || 'No building envelope information available.'}
            </p>
            {ecoData.buildingEnvelopeComponents && ecoData.buildingEnvelopeComponents.length > 0 && (
              <div className="mt-2">
                <h4 className="text-sm font-medium mb-2">Envelope Components:</h4>
                <ul className="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
                  {Array.isArray(ecoData.buildingEnvelopeComponents) ? (
                    ecoData.buildingEnvelopeComponents.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))
                  ) : (
                    <li>{ecoData.buildingEnvelopeComponents}</li>
                  )}
                </ul>
              </div>
            )}
          </div>
          
          {/* Two Columns for Weather and Occupancy */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Weather Conditions */}
            {ecoData.weatherConditions && (
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium mb-2 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-1 text-yellow-500">
                    <circle cx="12" cy="12" r="5"></circle>
                    <line x1="12" y1="1" x2="12" y2="3"></line>
                    <line x1="12" y1="21" x2="12" y2="23"></line>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                    <line x1="1" y1="12" x2="3" y2="12"></line>
                    <line x1="21" y1="12" x2="23" y2="12"></line>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                  </svg>
                  Weather Conditions
                </h3>
                <p className="text-gray-600 dark:text-gray-400">{ecoData.weatherConditions}</p>
              </div>
            )}
            
            {/* Occupancy Schedule */}
            {ecoData.occupancyScheduleDetails && ecoData.occupancyScheduleDetails.length > 0 && (
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium mb-2 flex items-center">
                  <Calendar className="h-4 w-4 mr-1 text-emerald-500" />
                  Occupancy Schedule
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-2">Based on field notes assessment:</p>
                <ul className="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
                  {Array.isArray(ecoData.occupancyScheduleDetails) ? (
                    ecoData.occupancyScheduleDetails.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))
                  ) : (
                    <li>{ecoData.occupancyScheduleDetails}</li>
                  )}
                </ul>
              </div>
            )}
          </div>
          
          {/* Key Observations */}
          {ecoData.observations && ecoData.observations.length > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-2 flex items-center">
                <FileSearch className="h-4 w-4 mr-1 text-emerald-500" />
                Key Observations
                <span className="ml-2 px-2 py-1 text-xs font-medium rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-800/20 dark:text-emerald-400">
                  {ecoData.observations.length} items
                </span>
              </h3>
              <ul className="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
                {ecoData.observations.map((observation, index) => (
                  <li key={index}>{observation}</li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}; 