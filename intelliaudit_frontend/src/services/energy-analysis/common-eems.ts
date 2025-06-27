export interface MeasureCategory {
  id: string;
  name: string;
  description: string;
  measures: Measure[];
}

export interface Measure {
  id: string;
  title: string;
  existingCondition: string;
  recommendation: string;
  benefits: string[];
  supportingImages?: {
    existing?: string;
    replacement?: string;
  };
  estimatedSavings?: {
    energy?: number;
    cost?: number;
    paybackPeriod?: number;
  };
}

export const MEASURE_CATEGORIES: MeasureCategory[] = [
  {
    id: 'eem',
    name: 'Energy Efficiency Measures',
    description: 'Improvements that reduce energy consumption',
    measures: [
      {
        id: 'eem-1',
        title: 'LED Lighting Upgrades',
        existingCondition: 'Several of the building\'s lights consist of a number of inefficient fixtures. These fixtures are equipped with a combination of 32-watt T-8 fluorescent lamps and 13-watt Compact Fluorescents.',
        recommendation: 'Replace traditional lighting with LED (Light Emitting Diode) lighting.',
        benefits: [
          'Energy Savings: LEDs use significantly less electricity, reducing costs.',
          'Long Lifespan: Last longer, requiring fewer replacements and maintenance.',
          'Lower Heat Emission: Emit less heat, reducing cooling costs.',
          'Instant Lighting: Reach full brightness immediately.',
          'Dimmability: Allows for energy savings and flexible lighting control.',
          'Directional Light: Minimizes light spillage, focusing illumination.',
          'Color Temperature Control: Matches lighting to ambiance, potentially reducing the need for additional fixtures.',
          'Government Incentives: Many governments offer incentives for LED adoption.',
          'Smart Control Compatibility: Works with smart controls for enhanced energy efficiency.'
        ],
        supportingImages: {
          existing: '/images/lighting/fluorescent.jpg',
          replacement: '/images/lighting/led.jpg'
        },
        estimatedSavings: {
          energy: 30,
          cost: 25,
          paybackPeriod: 2.5
        }
      },
      {
        id: 'eem-2',
        title: 'Install Lighting Controls',
        existingCondition: 'Lighting fixtures for the rental office remain lit regardless of current space occupancy. Light fixtures are controlled by either manual switches or mechanical timers.',
        recommendation: 'Install occupancy sensors and lighting controls.',
        benefits: [
          'Dimming Controls: Adjust brightness as needed, reducing energy consumption and creating optimal lighting atmospheres.',
          'Occupancy Sensors: Automatically turn off lights in unoccupied areas, preventing wastage.',
          'Daylight Harvesting: Adjust artificial lighting based on natural light levels, reducing energy use when daylight is sufficient.',
          'Time Scheduling: Program lights to turn on and off at specific times, minimizing unnecessary energy use.',
          'Zoning and Individual Control: Customize lighting in different areas to reduce energy waste.',
          'Integration with Energy Management Systems (EMS): Integrate controls into broader energy management for adaptive, efficient lighting.',
          'Reduced Over-Lighting: Prevent excessive illumination, saving energy.',
          'Extended Light Source Lifespan: Dimming and control measures extend bulb life, reducing replacement frequency.',
          'Improved User Awareness: Encourage users to adjust lighting and develop energy-efficient habits.'
        ],
        supportingImages: {
          existing: '/images/controls/manual-switch.jpg',
          replacement: '/images/controls/occupancy-sensor.jpg'
        }
      },
      {
        id: 'eem-3',
        title: 'HVAC Upgrade',
        existingCondition: 'The property is equipped with HVAC equipment that has exceeded the useful life cycle of 15-years, and no longer operates at modern efficiency standards.',
        recommendation: 'Upgrade the existing HVAC systems with modern, energy-efficient units.',
        benefits: [
          'Enhanced Efficiency: New HVAC units feature advanced technologies and design improvements, resulting in reduced energy usage and lower operating costs.',
          'Cost Reduction: The energy savings over time can offset the initial purchase and installation expenses, leading to significant long-term financial savings.',
          'Improved Comfort: Modern systems provide better temperature control, humidity management, and quieter operation, ensuring a more comfortable indoor environment.',
          'Environmental Impact: Energy-efficient HVAC systems help lower greenhouse gas emissions, contributing to a smaller carbon footprint and environmental sustainability.',
          'Reliability: Aging systems often require frequent repairs and maintenance, which can be costly. Newer units tend to be more reliable, reducing ongoing service expenses.',
          'Incentives: Many regions offer incentives, rebates, or tax credits for upgrading to energy-efficient HVAC systems, making the investment more financially attractive.',
          'Regulatory Compliance: New HVAC systems meet or exceed current energy efficiency standards and regulations, ensuring compliance with local and national requirements.'
        ],
        supportingImages: {
          existing: '/images/hvac/old-unit.jpg',
          replacement: '/images/hvac/new-unit.jpg'
        }
      },
      {
        id: 'eem-4',
        title: 'Smart Thermostats',
        existingCondition: 'Currently some of the split system HVAC units for this building are controlled via standard digital thermostats.',
        recommendation: 'Install smart thermostats to optimize HVAC operation and reduce energy consumption.',
        benefits: [
          'Programmable Schedules: Custom heating/cooling schedules reduce energy waste.',
          'Remote Control: Adjust settings from anywhere, preventing unnecessary energy use.',
          'Learning Capabilities: Algorithms fine-tune preferences for efficiency.',
          'Geofencing: Auto-adjusts temperature based on user location.',
          'Temperature Zoning: Control specific areas to minimize energy use.',
          'Energy Usage Tracking: Monitor consumption for informed decisions.',
          'HVAC Compatibility: Works with various HVAC systems for efficient integration.',
          'Adaptive Features: Utilizes external data for predictive adjustments.',
          'Voice Control: Convenient voice-activated adjustments.',
          'Energy Savings Reports: Provides feedback on energy-saving efforts.',
          'Utility Incentives: Eligible for incentives and demand response programs.'
        ],
        supportingImages: {
          existing: '/images/controls/standard-thermostat.jpg',
          replacement: '/images/controls/smart-thermostat.jpg'
        }
      },
      {
        id: 'eem-5',
        title: 'Smart Power Strips',
        existingCondition: 'The property relies on conventional power strips that operate only during regular business hours.',
        recommendation: 'Install smart power strips to reduce standby power consumption.',
        benefits: [
          'Standby Power Reduction: Drastically minimizes standby power usage, preventing energy waste.',
          'Individual Outlet Control: Allows for precise device management, eliminating unnecessary energy consumption.',
          'Timed Scheduling: Automates on/off times, reducing idle power consumption during non-use hours.',
          'Remote Operation: Enables remote control through apps or voice commands for convenient power management.',
          'Energy Monitoring: Tracks device energy consumption, promoting efficient usage.',
          'Occupancy Sensors: Automatically turns off devices in unoccupied areas, preventing energy waste.',
          'Surge Protection: Safeguards devices from power surges, enhancing electrical safety and reducing replacements.',
          'Cost Savings: Lowers electricity bills over time, providing a cost-effective solution.',
          'User Awareness: Encourages energy-conscious habits, leading to further energy savings.'
        ],
        supportingImages: {
          existing: '/images/power/standard-strip.jpg',
          replacement: '/images/power/smart-strip.jpg'
        }
      }
    ]
  },
  {
    id: 'wem',
    name: 'Water Efficiency Measures',
    description: 'Improvements that reduce water consumption',
    measures: [
      {
        id: 'wem-1',
        title: 'Low Flow Lavatory Aerators',
        existingCondition: 'The building is equipped with lavatory faucets with aerators that permit a flowrate of 1.9 gallons/minute (GPM).',
        recommendation: 'Install aerators that limit the water flow rate to 0.5 gallons/minute or less. This is in accordance with the current California plumbing code.',
        benefits: [
          'Water Conservation: Low-flow aerators restrict the flow of water from the faucet to 0.5 gallons per minute (GPM), significantly less than standard faucets. This reduces water wastage during handwashing or other activities.',
          'Energy Savings: Using less hot water due to lower water flow reduces the energy required to heat water, leading to lower energy bills.',
          'Cost Reduction: Less water usage means lower water bills, contributing to cost savings over time.',
          'Easy Retrofit: Low-flow aerators are often easy to install and can be retrofitted onto existing faucets, making them a cost-effective and accessible way to save water and money.',
          'Government Incentives: Some regions offer incentives, rebates, or tax credits for installing low-flow fixtures, further enhancing cost savings.'
        ],
        supportingImages: {
          existing: '/images/plumbing/standard-aerator.jpg',
          replacement: '/images/plumbing/low-flow-aerator.jpg'
        }
      },
      {
        id: 'wem-2',
        title: 'Low Flow Showerheads',
        existingCondition: 'The building is equipped with showerheads which have an average flow rate of 2.2 gallons/minute (GPM).',
        recommendation: 'Install low-flow showerheads that limit the water flow rate to 1.8 gallons/minute or less. This is in accordance with the current California plumbing code.',
        benefits: [
          'Water Conservation: Low-flow showerheads restrict the flow of water to 1.8 gallons per minute (GPM), significantly less than standard showerheads.',
          'Energy Savings: Using less hot water reduces the energy required to heat water, leading to lower energy bills.',
          'Cost Reduction: Less water usage means lower water bills, contributing to cost savings over time.',
          'Easy Retrofit: Low-flow showerheads are easy to install and can be retrofitted onto existing plumbing.',
          'Government Incentives: Some regions offer incentives, rebates, or tax credits for installing low-flow fixtures.'
        ],
        supportingImages: {
          existing: '/images/plumbing/standard-showerhead.jpg',
          replacement: '/images/plumbing/low-flow-showerhead.jpg'
        }
      },
      {
        id: 'wem-3',
        title: 'Install Drip Irrigation',
        existingCondition: 'The landscaped area is equipped with sprinkler irrigation.',
        recommendation: 'Replace the sprinkler irrigation with a drip irrigation system.',
        benefits: [
          'Water Conservation: Drip irrigation delivers water directly to plant roots, reducing evaporation and runoff.',
          'Reduced Weed Growth: By watering only the intended plants, drip irrigation limits water availability to weeds.',
          'Cost Savings: Lower water consumption translates to reduced utility bills.',
          'Improved Plant Health: Consistent moisture levels promote healthier plant growth and reduce stress.',
          'Adaptability: Drip irrigation can be customized for different plant types and landscape layouts.',
          'Environmental Benefits: Less runoff means fewer contaminants entering storm drains and water systems.'
        ],
        supportingImages: {
          existing: '/images/irrigation/sprinkler.jpg',
          replacement: '/images/irrigation/drip.jpg'
        }
      }
    ]
  },
  {
    id: 'rcm',
    name: 'Renewable/Clean Measures',
    description: 'Improvements that enhance sustainability and maintenance',
    measures: [
      {
        id: 'rcm-1',
        title: 'Hot Water Pipe Insulation',
        existingCondition: 'The domestic hot water system\'s piping was observed to be partially insulated.',
        recommendation: 'Insulate all hot water pipes leading to or from the boiler.',
        benefits: [
          'Reduced Heat Loss: Insulation creates a barrier that traps heat within the pipes, preventing it from escaping into the surrounding environment.',
          'Improved Efficiency: By reducing heat loss, boiler pipe insulation allows heating systems to operate more efficiently.',
          'Energy Cost Savings: The energy savings resulting from reduced heat loss can lead to lower energy bills.',
          'Faster Heating: Insulated pipes deliver heat more efficiently, resulting in quicker warm-up times.',
          'Environmental Benefits: Lower energy consumption translates to reduced greenhouse gas emissions.',
          'Condensation Prevention: Insulation can prevent condensation from forming on the exterior of pipes, which can lead to corrosion and damage.',
          'Comfort Improvement: Better heat retention and more efficient heating can result in improved comfort levels in buildings.'
        ],
        supportingImages: {
          existing: '/images/pipes/uninsulated.jpg',
          replacement: '/images/pipes/insulated.jpg'
        }
      },
      {
        id: 'rcm-2',
        title: 'HVAC Yearly Maintenance',
        existingCondition: 'Currently the HVAC units are only serviced as needed and replaced when they break down beyond repair.',
        recommendation: 'Implement a regular maintenance routine or hire an HVAC contractor to perform annual maintenance checks.',
        benefits: [
          'Improved Efficiency: Regular maintenance ensures HVAC systems operate at optimal efficiency, reducing energy consumption.',
          'Extended Equipment Life: Proper maintenance can significantly extend the operational lifespan of HVAC systems.',
          'Reduced Breakdowns: Proactive maintenance helps identify potential issues before they lead to system failures.',
          'Enhanced Air Quality: Clean filters and components result in better indoor air quality and a healthier environment.',
          'Cost Savings: Regular maintenance reduces energy costs and prevents expensive emergency repairs.',
          'Consistent Comfort: Well-maintained systems provide more consistent heating and cooling throughout the building.'
        ],
        supportingImages: {
          existing: '/images/hvac/unmaintained.jpg',
          replacement: '/images/hvac/maintenance.jpg'
        }
      },
      {
        id: 'rcm-3',
        title: 'Clean PV Panels',
        existingCondition: 'The rooftop solar panels were found to be covered in dust during the site visit.',
        recommendation: 'Inspect the rooftop solar quarterly, and clean the panels as needed.',
        benefits: [
          'Improved Efficiency: Clean panels allow more sunlight to reach the PV cells, increasing electricity generation.',
          'Higher Energy Output: Regular cleaning can increase energy output by 3-25% depending on dust levels.',
          'Extended Panel Life: Removing abrasive dust and debris prevents premature wear and damage.',
          'Maximized Investment Return: Maintain optimal performance to ensure the best return on your solar investment.',
          'Visual Inspection: Regular cleaning provides opportunities to check for damage or maintenance needs.'
        ],
        supportingImages: {
          existing: '/images/solar/dirty-panels.jpg',
          replacement: '/images/solar/clean-panels.jpg'
        }
      }
    ]
  }
]; 