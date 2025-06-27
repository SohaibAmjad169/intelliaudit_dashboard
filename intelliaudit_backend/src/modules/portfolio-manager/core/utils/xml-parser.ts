import { Logger } from '@nestjs/common';
import * as xml2js from 'xml2js';

const logger = new Logger('XmlParser');

/**
 * Parse property XML response from Portfolio Manager API
 * @param xml - XML response from Portfolio Manager API
 * @param propertyId - Portfolio Manager property ID
 * @returns Parsed property data
 */
export async function parsePropertyXml(xml: string, propertyId: string): Promise<any> {
  try {
    
    // Configure parser options
    // explicitArray: false - This prevents single elements from being converted to arrays
    // This helps with simpler access to values
    const parser = new xml2js.Parser({ explicitArray: false });
    const result = await parser.parseStringPromise(xml);
    
    if (!result.property) {
      throw new Error('No property data found in XML response');
    }
    
    // Extract relevant property data
    const property = result.property;


    
    // Extract values based on the actual XML structure
    // The structure is different than previously assumed
    // Property values may be direct text or nested under 'value' elements
    
    // Extract gross floor area
    let grossFloorArea = null;
    if (property.grossFloorArea) {
      if (typeof property.grossFloorArea === 'string') {
        grossFloorArea = parseFloat(property.grossFloorArea);
      } else if (property.grossFloorArea.value) {
        if (typeof property.grossFloorArea.value === 'string') {
          grossFloorArea = parseFloat(property.grossFloorArea.value);
        } else if (property.grossFloorArea.value._) {
          grossFloorArea = parseFloat(property.grossFloorArea.value._);
        } else if (property.grossFloorArea.value.$) {
          grossFloorArea = parseFloat(property.grossFloorArea.value.$);
        }
      }
    }
    
    // Extract year built
    let yearBuilt = null;
    if (property.yearBuilt) {
      if (typeof property.yearBuilt === 'string') {
        yearBuilt = parseInt(property.yearBuilt);
      } else if (property.yearBuilt._) {
        yearBuilt = parseInt(property.yearBuilt._);
      } else if (property.yearBuilt.$) {
        yearBuilt = parseInt(property.yearBuilt.$);
      }
    }
    
    // Extract property name
    let name = null;
    if (property.name) {
      if (typeof property.name === 'string') {
        name = property.name;
      } else if (property.name._) {
        name = property.name._;
      } else if (property.name.$) {
        name = property.name.$;
      }
    } else if (property.n) {
      // Try alternate field name based on the XML preview
      if (typeof property.n === 'string') {
        name = property.n;
      } else if (property.n._) {
        name = property.n._;
      }
    }
    
    // Extract address information
    let address = null;
    let city = null;
    let state = null;
    let postalCode = null;
    
    if (property.address) {
      if (property.address.address1) {
        if (typeof property.address.address1 === 'string') {
          address = property.address.address1;
        } else if (property.address.address1._) {
          address = property.address.address1._;
        }
      } else if (property.address.$ && property.address.$.address1) {
        address = property.address.$.address1;
      }
      
      if (property.address.city) {
        if (typeof property.address.city === 'string') {
          city = property.address.city;
        } else if (property.address.city._) {
          city = property.address.city._;
        }
      } else if (property.address.$ && property.address.$.city) {
        city = property.address.$.city;
      }
      
      if (property.address.state) {
        if (typeof property.address.state === 'string') {
          state = property.address.state;
        } else if (property.address.state._) {
          state = property.address.state._;
        }
      } else if (property.address.$ && property.address.$.state) {
        state = property.address.$.state;
      }
      
      if (property.address.postalCode) {
        if (typeof property.address.postalCode === 'string') {
          postalCode = property.address.postalCode;
        } else if (property.address.postalCode._) {
          postalCode = property.address.postalCode._;
        }
      } else if (property.address.$ && property.address.$.postalCode) {
        postalCode = property.address.$.postalCode;
      }
    }
    
    // Extract primary function
    let primaryFunction = null;
    if (property.primaryFunction) {
      if (typeof property.primaryFunction === 'string') {
        primaryFunction = property.primaryFunction;
      } else if (property.primaryFunction.description) {
        if (typeof property.primaryFunction.description === 'string') {
          primaryFunction = property.primaryFunction.description;
        } else if (property.primaryFunction.description._) {
          primaryFunction = property.primaryFunction.description._;
        }
      } else if (property.primaryFunction._) {
        primaryFunction = property.primaryFunction._;
      }
    }
    
   

    
    return {
      id: propertyId,
      name,
      address,
      city,
      state,
      postalCode,
      primaryFunction,
      grossFloorArea,
      yearBuilt,
    };
  } catch (error) {

    throw error;
  }
}

/**
 * Parse meter XML response from Portfolio Manager API
 * @param xml - XML response from Portfolio Manager API
 * @returns Parsed meter data
 */
export async function parseMeterXml(xml: string): Promise<any> {
  try {

    
    const parser = new xml2js.Parser({ explicitArray: false });
    const result = await parser.parseStringPromise(xml);
    
    if (!result.meter) {
      logger.error('No meter data found in XML response');
      throw new Error('No meter data found in XML response');
    }
    
    // Extract relevant meter data
    const meter = result.meter;

    
    // Helper function to extract values properly regardless of structure
    const extractValue = (obj: any, key: string): any => {
      if (!obj || !obj[key]) return null;
      
      // Handle direct value (most common case in current API responses)
      if (typeof obj[key] === 'string' || typeof obj[key] === 'number' || typeof obj[key] === 'boolean') {
        return obj[key];
      }
      
      // Handle nested structure with _ property (seen in some responses)
      if (obj[key]._ !== undefined) {
        return obj[key]._;
      }
      
      // Handle other possible structures
      if (obj[key].$ !== undefined) {
        return obj[key].$;
      }
      
      return null;
    };
    
    // Convert string 'true'/'false' to boolean
    const toBool = (val: any): boolean => {
      if (typeof val === 'boolean') return val;
      if (typeof val === 'string') return val.toLowerCase() === 'true';
      return false;
    };
    
    const parsedMeter = {
      id: extractValue(meter, 'id'),
      name: extractValue(meter, 'name'),
      type: extractValue(meter, 'type'),
      unitOfMeasure: extractValue(meter, 'unitOfMeasure'),
      metered: extractValue(meter, 'metered'),
      firstBillDate: extractValue(meter, 'firstBillDate'),
      inUse: toBool(extractValue(meter, 'inUse')),
    };
    

    return parsedMeter;
  } catch (error) {
    logger.error(`Error parsing meter XML: ${error.message}`, error.stack);
    throw error;
  }
}

interface ConsumptionEntry {
  startDate: string;
  endDate: string;
  usage: number;
  cost: number;
  estimation: boolean;
}

/**
 * Parse consumption data XML response from Portfolio Manager API
 * @param xml - XML response from Portfolio Manager API
 * @returns Parsed consumption data
 */
export async function parseConsumptionDataXml(xml: string): Promise<ConsumptionEntry[]> {
    // Use more flexible parsing settings 
    const parser = new xml2js.Parser({ 
      explicitArray: false,  // Don't create arrays for single elements
      mergeAttrs: true       // Merge attributes into the same object
    });
    
    const result = await parser.parseStringPromise(xml);
    
    // Check if we have valid meterData structure
    if (!result || !result.meterData || !result.meterData.meterConsumption) {
      return [];
    }
    
    // Handle both array and single object cases
    const consumptionArray = Array.isArray(result.meterData.meterConsumption) 
      ? result.meterData.meterConsumption 
      : result.meterData.meterConsumption ? [result.meterData.meterConsumption] : [];
    
    // Map to our simplified structure
    const mappedData = consumptionArray.map((consumption: any) => {
      if (!consumption) return null;
      
      // Parse numeric values from string representations
      const usage = consumption.usage ? Number(consumption.usage) : 0;
      const cost = consumption.cost ? Number(consumption.cost) : 0;
      
      // Take the estimatedValue attribute if present
      const estimation = consumption.estimatedValue === 'true';
      
      // Create the standardized entry
      return {
        startDate: consumption.startDate,
        endDate: consumption.endDate,
        usage: usage,
        cost: cost,
        estimation: estimation,
      };
    }).filter((entry: ConsumptionEntry | null): entry is ConsumptionEntry => entry !== null); // Type-safe null check
    
    return mappedData;
}

/**
 * Parse meter list XML response from Portfolio Manager API
 * @param xml - XML response from Portfolio Manager API
 * @returns Array of meter IDs
 */
export async function parseMeterListXml(xml: string): Promise<any[]> {
  try {
 
    
    // For Portfolio Manager API, the parser needs to handle attributes
    const parser = new xml2js.Parser({ 
      explicitArray: false, 
      explicitRoot: true,
      mergeAttrs: false,
      attrkey: '$'
    });
    
    const result = await parser.parseStringPromise(xml);

    
    // Handle the response structure from Portfolio Manager API
    if (result.response && result.response.links && result.response.links.link) {

      
      // Extract meter links - could be array or single object
      const meterLinks = Array.isArray(result.response.links.link) 
        ? result.response.links.link 
        : [result.response.links.link];
      
   
      
      // Map the links to meter objects with relevant info
      const meters = meterLinks.map((link: any) => {
        // Extract ID directly from the id attribute
        const id = link.$ ? link.$.id : null;
        
        // Extract name/type from the hint attribute
        const hint = link.$ ? link.$.hint : null;
        
        // If link contains path like /meter/123, extract that as well
        const linkPath = link.$ && link.$.link ? link.$.link : null;
        
        return {
          id: id,
          name: hint,
          type: hint ? hint.split(' - ')[0] : null, // Try to extract type from hint if possible
          unitOfMeasure: null, // Will be populated later when getting meter details
          link: linkPath
        };
      }).filter((meter: any) => meter.id !== null);
      
   
      return meters;
    } else if (result.links && result.links.link) {
      // Alternative structure without the response wrapper
   
      
      const meterLinks = Array.isArray(result.links.link) 
        ? result.links.link 
        : [result.links.link];
      
      
      
      const meters = meterLinks.map((link: any) => {
        const id = link.$ ? link.$.id : null;
        const hint = link.$ ? link.$.hint : null;
        const linkPath = link.$ && link.$.link ? link.$.link : null;
        
        return {
          id: id,
          name: hint,
          type: hint ? hint.split(' - ')[0] : null,
          unitOfMeasure: null,
          link: linkPath
        };
      }).filter((meter: any) => meter.id !== null);
      
    
      return meters;
    }
    
  

    return [];
  } catch (error) {
    throw error;
  }
}
