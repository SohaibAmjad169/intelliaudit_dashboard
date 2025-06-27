import React from 'react';
import { Building, Thermometer, Lightbulb, Fan, Droplets, Plug } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface SystemObservation {
  system: string;
  condition: string;
  notes: string;
  recommendations?: string[];
  images?: string[];
}

interface ExistingConditionsProps {
  buildingData: any;
  equipment: any[];
  observations: {
    hvac?: SystemObservation[];
    lighting?: SystemObservation[];
    envelope?: SystemObservation[];
    plumbing?: SystemObservation[];
    electrical?: SystemObservation[];
    controls?: SystemObservation[];
  };
  formatNumber: (value?: number) => string;
  showEquipmentOnly?: boolean;
}

export const ExistingConditions: React.FC<ExistingConditionsProps> = ({
  buildingData,
  equipment,
  observations,
  formatNumber,
  showEquipmentOnly = false
}) => {
  // Group equipment by type
  const groupedEquipment: Record<string, any[]> = {};
  equipment.forEach(item => {
    const type = item.type || 'other';
    if (!groupedEquipment[type]) {
      groupedEquipment[type] = [];
    }
    groupedEquipment[type].push(item);
  });
  
  // Get appropriate icon for each system
  const getSystemIcon = (system: string) => {
    switch (system.toLowerCase()) {
      case 'hvac':
        return <Thermometer className="h-5 w-5 mr-2" />;
      case 'lighting':
        return <Lightbulb className="h-5 w-5 mr-2" />;
      case 'plumbing':
      case 'water':
        return <Droplets className="h-5 w-5 mr-2" />;
      case 'electrical':
        return <Plug className="h-5 w-5 mr-2" />;
      case 'ventilation':
        return <Fan className="h-5 w-5 mr-2" />;
      default:
        return <Building className="h-5 w-5 mr-2" />;
    }
  };
  
  return (
    <div className="print:page-break-after">
      <h3 className="text-xl font-semibold mb-4 flex items-center">
        <Building className="h-6 w-6 mr-2" />
        Existing Conditions & Observations
      </h3>
      
      {!showEquipmentOnly && (
        <div className="mb-8">
          <h4 className="text-lg font-medium mb-4">Building Overview</h4>
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h5 className="font-medium mb-3">General Description</h5>
                  <p className="text-sm text-muted-foreground mb-4">
                    The subject building is a {buildingData.property_primary_function || 'multi-unit'} property constructed in {buildingData.property_year_built || 'N/A'}.
                    It has a gross floor area of approximately {formatNumber(buildingData.property_gross_floor_area || 0)} square feet.
                  </p>
                  
                  <h5 className="font-medium mb-2">Construction Details</h5>
                  <ul className="space-y-1 text-sm">
                    <li><span className="text-muted-foreground">Foundation:</span> Concrete slab on grade</li>
                    <li><span className="text-muted-foreground">Structure:</span> Reinforced concrete frame</li>
                    <li><span className="text-muted-foreground">Exterior Walls:</span> Brick veneer with CMU backup</li>
                    <li><span className="text-muted-foreground">Roof:</span> Built-up roofing on flat concrete deck</li>
                    <li><span className="text-muted-foreground">Windows:</span> Aluminum frame, double-pane</li>
                  </ul>
                </div>
                
                <div>
                  <h5 className="font-medium mb-3">Operating Profile</h5>
                  <table className="w-full text-sm">
                    <tbody>
                      <tr className="border-b">
                        <td className="py-2 text-muted-foreground">Typical Occupancy Hours:</td>
                        <td className="py-2">24/7 (residential)</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 text-muted-foreground">Estimated Occupancy:</td>
                        <td className="py-2">~90%</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 text-muted-foreground">HVAC Operating Hours:</td>
                        <td className="py-2">24/7 (tenant controlled)</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 text-muted-foreground">Common Area Lighting:</td>
                        <td className="py-2">18 hours/day</td>
                      </tr>
                      <tr>
                        <td className="py-2 text-muted-foreground">Exterior Lighting:</td>
                        <td className="py-2">Dusk to dawn (photocell)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* System-by-System Observations */}
      <div className="mb-8">
        <h4 className="text-lg font-medium mb-4">System Observations</h4>
        
        <Accordion type="multiple" defaultValue={['hvac', 'lighting', 'plumbing']}>
          {/* HVAC Systems */}
          <AccordionItem value="hvac">
            <AccordionTrigger className="text-base font-medium">
              <div className="flex items-center">
                {getSystemIcon('hvac')}
                HVAC Systems
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 p-1">
                {observations.hvac && observations.hvac.length > 0 ? (
                  observations.hvac.map((obs, index) => (
                    <Card key={index} className="overflow-hidden">
                      <CardHeader className="bg-muted/30 py-3">
                        <CardTitle className="text-base">{obs.system}</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <div className="mb-3">
                          <span className="font-medium">Condition:</span>{' '}
                          <span className="text-muted-foreground">{obs.condition}</span>
                        </div>
                        <p className="text-sm mb-3">{obs.notes}</p>
                        
                        {obs.recommendations && obs.recommendations.length > 0 && (
                          <div>
                            <h6 className="font-medium mb-2">Observations:</h6>
                            <ul className="list-disc list-inside text-sm space-y-1">
                              {obs.recommendations.map((rec, recIndex) => (
                                <li key={recIndex}>{rec}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="p-4 text-center text-muted-foreground">
                    The building is primarily served by packaged terminal heat pumps in each apartment unit, with 
                    common areas served by split systems. Equipment is generally 10-15 years old and in fair to good 
                    condition, though some units show signs of deferred maintenance.
                  </div>
                )}
                
                {/* Equipment Table - HVAC only */}
                {groupedEquipment['hvac'] && groupedEquipment['hvac'].length > 0 && (
                  <div className="mt-4">
                    <h6 className="font-medium mb-2">HVAC Equipment</h6>
                    <div className="rounded-md border overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="px-4 py-2 text-left">Type</th>
                            <th className="px-4 py-2 text-left">Manufacturer</th>
                            <th className="px-4 py-2 text-left">Model</th>
                            <th className="px-4 py-2 text-left">Location</th>
                            <th className="px-4 py-2 text-right">Capacity</th>
                            <th className="px-4 py-2 text-right">Annual kWh</th>
                          </tr>
                        </thead>
                        <tbody>
                          {groupedEquipment['hvac'].map((item, index) => (
                            <tr key={index} className="border-t">
                              <td className="px-4 py-2">{item.type}</td>
                              <td className="px-4 py-2">{item.manufacturer || 'N/A'}</td>
                              <td className="px-4 py-2">{item.model || 'N/A'}</td>
                              <td className="px-4 py-2">{item.location || 'N/A'}</td>
                              <td className="px-4 py-2 text-right">{item.rated_power ? `${item.rated_power} kW` : 'N/A'}</td>
                              <td className="px-4 py-2 text-right">{formatNumber(item.annual_kwh)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
          
          {/* Lighting Systems */}
          <AccordionItem value="lighting">
            <AccordionTrigger className="text-base font-medium">
              <div className="flex items-center">
                <Lightbulb className="h-5 w-5 mr-2 text-amber-500" />
                Lighting Systems
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 p-1">
                {observations.lighting && observations.lighting.length > 0 ? (
                  observations.lighting.map((obs, index) => (
                    <Card key={index} className="overflow-hidden">
                      <CardHeader className="bg-muted/30 py-3">
                        <CardTitle className="text-base">{obs.system}</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <div className="mb-3">
                          <span className="font-medium">Condition:</span>{' '}
                          <span className="text-muted-foreground">{obs.condition}</span>
                        </div>
                        <p className="text-sm mb-3">{obs.notes}</p>
                        
                        {obs.recommendations && obs.recommendations.length > 0 && (
                          <div>
                            <h6 className="font-medium mb-2">Observations:</h6>
                            <ul className="list-disc list-inside text-sm space-y-1">
                              {obs.recommendations.map((rec, recIndex) => (
                                <li key={recIndex}>{rec}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="p-4 text-center text-muted-foreground">
                    Exterior and common area lighting is primarily fluorescent T8 and compact fluorescent, with some 
                    incandescent fixtures still in use. Minimal occupancy sensors are installed in common areas, 
                    and many fixtures operate on timers or manual controls. In-unit lighting is tenant-controlled 
                    and varies significantly.
                  </div>
                )}
                
                {/* Equipment Table - Lighting only */}
                {groupedEquipment['lighting'] && groupedEquipment['lighting'].length > 0 && (
                  <div className="mt-4">
                    <h6 className="font-medium mb-2">Lighting Fixtures</h6>
                    <div className="rounded-md border overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="px-4 py-2 text-left">Type</th>
                            <th className="px-4 py-2 text-left">Fixture</th>
                            <th className="px-4 py-2 text-right">Watts</th>
                            <th className="px-4 py-2 text-right">Quantity</th>
                            <th className="px-4 py-2 text-left">Location</th>
                            <th className="px-4 py-2 text-right">Annual kWh</th>
                          </tr>
                        </thead>
                        <tbody>
                          {groupedEquipment['lighting'].map((item, index) => (
                            <tr key={index} className="border-t">
                              <td className="px-4 py-2">{item.type}</td>
                              <td className="px-4 py-2">{item.model || 'N/A'}</td>
                              <td className="px-4 py-2 text-right">{item.rated_power || 'N/A'}</td>
                              <td className="px-4 py-2 text-right">{item.quantity || 1}</td>
                              <td className="px-4 py-2">{item.location || 'N/A'}</td>
                              <td className="px-4 py-2 text-right">{formatNumber(item.annual_kwh)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
          
          {/* Plumbing & DHW Systems */}
          <AccordionItem value="plumbing">
            <AccordionTrigger className="text-base font-medium">
              <div className="flex items-center">
                <Droplets className="h-5 w-5 mr-2 text-blue-500" />
                Plumbing & Domestic Hot Water
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 p-1">
                {observations.plumbing && observations.plumbing.length > 0 ? (
                  observations.plumbing.map((obs, index) => (
                    <Card key={index} className="overflow-hidden">
                      <CardHeader className="bg-muted/30 py-3">
                        <CardTitle className="text-base">{obs.system}</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <div className="mb-3">
                          <span className="font-medium">Condition:</span>{' '}
                          <span className="text-muted-foreground">{obs.condition}</span>
                        </div>
                        <p className="text-sm mb-3">{obs.notes}</p>
                        
                        {obs.recommendations && obs.recommendations.length > 0 && (
                          <div>
                            <h6 className="font-medium mb-2">Observations:</h6>
                            <ul className="list-disc list-inside text-sm space-y-1">
                              {obs.recommendations.map((rec, recIndex) => (
                                <li key={recIndex}>{rec}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="p-4 text-center text-muted-foreground">
                    Domestic hot water is provided by central gas-fired water heaters located in the mechanical 
                    room, with a recirculation system maintaining temperature throughout the building. Most 
                    fixtures are standard flow devices without water-saving features. Several minor leaks were 
                    observed during the site assessment, primarily at faucets and toilets.
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
          
          {/* Envelope */}
          <AccordionItem value="envelope">
            <AccordionTrigger className="text-base font-medium">
              <div className="flex items-center">
                <Building className="h-5 w-5 mr-2 text-slate-500" />
                Building Envelope
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="p-4 text-center text-muted-foreground">
                The building envelope is in fair condition with visible signs of degradation in the 
                weatherstripping around windows and doors. Air infiltration was detected at several locations 
                during the site visit. Window glazing is double-pane but lacks low-E coating or thermal breaks 
                in the frames. The roof appears to be in good condition but likely has minimal insulation 
                by modern standards.
              </div>
            </AccordionContent>
          </AccordionItem>
          
          {/* Controls & Energy Management */}
          <AccordionItem value="controls">
            <AccordionTrigger className="text-base font-medium">
              <div className="flex items-center">
                <Plug className="h-5 w-5 mr-2 text-slate-500" />
                Controls & Energy Management
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="p-4 text-center text-muted-foreground">
                The building does not have a centralized building management system. HVAC controls are 
                primarily manual thermostats in individual units. Common area HVAC is controlled via 
                programmable thermostats that appeared to be inconsistently programmed. Lighting controls 
                are primarily manual switches with some timers for exterior lighting. No demand management 
                or energy monitoring systems are currently installed.
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}; 