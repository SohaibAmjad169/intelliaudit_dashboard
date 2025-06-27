import React from 'react';
import { PlaceholderHighlight } from '@/components/ui/PlaceholderHighlight';
import { FunctionalTestSheetsTable } from './FunctionalTestSheetsTable';

interface AppendicesReportProps {
  projectData: any;
}

export function AppendicesReport({ projectData }: AppendicesReportProps): JSX.Element {
  return (
    <div id="appendices" className="max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-emerald-700 dark:text-emerald-500">
        Appendices
      </h1>

      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-6 text-emerald-700 dark:text-emerald-500">
          A. Assumptions
        </h2>
        <p className="mb-6 dark:text-gray-300">
          The assumptions utilized in this energy audit include but are not limited to following:
        </p>

        <div className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2">A.</h3>
            <p className="dark:text-gray-300">
              Cost Estimates noted within this report are based on industry accepted costing data such as RS Means™ 
              Cost Data, contractor pricing and engineering estimates. All cost estimates for this level of auditing 
              are +/- 20%. The cost estimates indicated within this audit should be utilized by the owner for 
              prioritizing further project development post the energy audit. Project development would include 
              investment grade auditing and detailed engineering.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">B.</h3>
            <p className="dark:text-gray-300">
              Energy savings noted within this audit are calculated utilizing industry standard procedures and 
              accepted engineering assumptions. For this level of auditing, energy savings are not guaranteed.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">C.</h3>
            <p className="dark:text-gray-300">
              Information gathering for each facility is strongly based on interviews with operations personnel. 
              Information dependent on verbal feedback is used for calculation assumptions including but not 
              limited to the following:
            </p>
            <ul className="list-disc pl-8 mt-2 space-y-1 dark:text-gray-300">
              <li>operating hours</li>
              <li>equipment type</li>
              <li>control strategies</li>
              <li>scheduling</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">D.</h3>
            <p className="dark:text-gray-300">
              Information contained within the major equipment list is based on the existing owner documentation 
              where available (drawings, O&M manuals, etc.). If existing owner documentation is not available, 
              catalog information is utilized to populate the required information.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">E.</h3>
            <p className="dark:text-gray-300">
              Equipment incentives and energy credits are based on current pricing and status of rebate programs. 
              Rebate availability is dependent on the individual program funding and applicability.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">F.</h3>
            <p className="dark:text-gray-300">
              Equipment (HVAC, Plumbing, Electrical, & Lighting) noted within the energy and water saving measures 
              recommendation is strictly noted as a basis for calculation of energy savings. The owner should use 
              this equipment information as a benchmark when pursuing further investment grade project development 
              and detailed engineering for specific energy conservation measures.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">G.</h3>
            <p className="dark:text-gray-300">
              Utility bill annual averages are utilized for calculation of all energy costs unless otherwise noted. 
              Accuracy of the utility energy usage and costs are based on the information provided. Utility 
              information including usage and costs is estimated where incomplete data is provided.
            </p>
          </div>
        </div>
      </section>

      {/* Utility Rates Section */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-6 text-emerald-700 dark:text-emerald-500">
          B. Blended Utility Rates
        </h2>
        <div className="dark:text-gray-300">
          <table className="min-w-full text-sm">
            <tbody>
              <tr>
                <td className="py-2 pr-4">Blended kWh Rate:</td>
                <td className="py-2">
                  <PlaceholderHighlight 
                    defaultValue="$0.18" 
                    actualValue={projectData?.utilityRates?.kwhRate}
                  >
                    ${projectData?.utilityRates?.kwhRate?.toFixed(2) || "0.18"}
                  </PlaceholderHighlight>
                </td>
              </tr>
              <tr>
                <td className="py-2 pr-4">Blended Therm rate:</td>
                <td className="py-2">
                  <PlaceholderHighlight 
                    defaultValue="$1.05" 
                    actualValue={projectData?.utilityRates?.thermRate}
                  >
                    ${projectData?.utilityRates?.thermRate?.toFixed(2) || "1.05"}
                  </PlaceholderHighlight>
                </td>
              </tr>
              <tr>
                <td className="py-2 pr-4">Blended Lbs Steam rate:</td>
                <td className="py-2">
                  <PlaceholderHighlight 
                    defaultValue="$0.03" 
                    actualValue={projectData?.utilityRates?.steamRate}
                  >
                    ${projectData?.utilityRates?.steamRate?.toFixed(2) || "0.03"}
                  </PlaceholderHighlight>
                </td>
              </tr>
              <tr>
                <td className="py-2 pr-4">Water & Sewer Cost per gallon:</td>
                <td className="py-2">
                  <PlaceholderHighlight 
                    defaultValue="$0.01" 
                    actualValue={projectData?.utilityRates?.waterRate}
                  >
                    ${projectData?.utilityRates?.waterRate?.toFixed(2) || "0.01"}
                  </PlaceholderHighlight>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Equations Section */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-6 text-emerald-700 dark:text-emerald-500">
          C. Equations
        </h2>
        <div className="space-y-4 dark:text-gray-300">
          <div>
            <p className="font-mono">kWh<sub>saved</sub> = kWh<sub>baseline</sub> - kWh<sub>post retrofit</sub></p>
          </div>

          <div>
            <p className="font-mono">
              Lighting Upgrade kWh Saving = (# Fixtures)(# Lamps/Fixture)(1 KW/1000 W)(W pre - W post)(Hrs operating)
            </p>
          </div>

          <div>
            <p className="font-mono">
              Lighting Control Upgrade kWh Saving = (# Fixtures)(# Lamps/Fixture)(1 KW/1000 W)[(W pre * Hrs pre) - (W post * Hrs post)]
            </p>
          </div>

          <div>
            <p className="font-mono">
              Average Demand (kW<sub>avg</sub>) = (Cooling Capacity (kBtu/h)) / (SEER)
            </p>
          </div>

          <div>
            <p className="font-mono">
              Annual Energy Use (kWh/yr) = (kW<sub>avg</sub>)*(equivalent full load annual hours)
            </p>
          </div>

          <div>
            <p className="font-mono">
              Motor Draw (kWh) = (hp)(0.746 kW/hp)(%Loaded)(hours)/Efficiency
            </p>
          </div>

          <div>
            <p className="font-mono">
              Conduction (Btu/h) = (U-Value)(Area in sq ft)(T<sub>outside</sub>-T<sub>inside</sub>)
            </p>
          </div>

          <div>
            <p className="font-mono">
              Ventilation / Infiltration (Btu/h) = (1.085)(CFM)(T<sub>outside</sub>-T<sub>inside</sub>)
            </p>
          </div>

          <div>
            <p className="font-semibold mt-6 mb-2">Efficiency Conversions:</p>
            <ul className="list-none space-y-2 pl-4 font-mono">
              <li>kW/ton = 12 / EER</li>
              <li>COP = EER / 3.412</li>
              <li>COP = 3.516 / (kW/ton)</li>
            </ul>
          </div>

          <div>
            <p className="font-semibold mt-6 mb-2">Heat Transfer in Water:</p>
            <p className="font-mono pl-4">
              Capacity (kBTU/h) = GPM * ΔT / 2
            </p>
          </div>

          <div>
            <p className="font-semibold mt-6 mb-2">Power from hp:</p>
            <p className="font-mono pl-4">
              Power (kW) = 0.746 * Power (hp)
            </p>
          </div>

          <div>
            <p className="font-semibold mt-6 mb-2">Pump power:</p>
            <ul className="list-none space-y-2 pl-4 font-mono">
              <li>Waterpower (hp) = (ft of head) * (GPM) / 3960</li>
              <li>Pump Power = Waterpower / [Pump eff * Motor eff]</li>
            </ul>
          </div>

          <div className="mt-6">
            <p className="font-mono">
              Building Site EUI = (Electric Usage in kBTU + Gas Usage in kBTU) / Building Square Footage
            </p>
          </div>
        </div>
      </section>

      {/* Supporting Documents Section */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-6 text-emerald-700 dark:text-emerald-500">
          D. Supporting Documents
        </h2>
        
        <h3 className="text-xl font-semibold mb-4">1. Functional Test Sheets</h3>
        
        <FunctionalTestSheetsTable />
      </section>

      {/* Equivalent Full Load Hours Section */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-6 text-emerald-700 dark:text-emerald-500">
          E. Equivalent Full Load Hours (EFLH)
        </h2>

        <div className="overflow-x-auto">
          <div className="mb-4 text-sm dark:text-gray-300">
            Values on low end of range assume units off during unoccupied hours in cooling season and 10°F set-back in heating. Values on high end assume no set-back control. Unoccupied ventilation air and internal loads minimized for both high and low range values.
          </div>
          
          <table className="min-w-full border-collapse text-sm mb-4">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700">
                <th className="border border-gray-300 dark:border-gray-600 px-4 py-2"></th>
                <th colSpan={2} className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center">Nine Month Schools</th>
                <th colSpan={2} className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center">Office – 8 to 5<br />Five Days / Week</th>
                <th colSpan={2} className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center">Retail – 8 to 10 Seven<br />Days / Week</th>
              </tr>
              <tr className="bg-gray-50 dark:bg-gray-800">
                <th className="border border-gray-300 dark:border-gray-600 px-4 py-2">Annual Hours</th>
                <th colSpan={2} className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center">1300 - 1500</th>
                <th colSpan={2} className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center">2200 - 2400</th>
                <th colSpan={2} className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center">2800 - 3600</th>
              </tr>
              <tr className="bg-gray-50 dark:bg-gray-800">
                <th className="border border-gray-300 dark:border-gray-600 px-4 py-2"></th>
                <th className="border border-gray-300 dark:border-gray-600 px-4 py-2">Cooling</th>
                <th className="border border-gray-300 dark:border-gray-600 px-4 py-2">Heating</th>
                <th className="border border-gray-300 dark:border-gray-600 px-4 py-2">Cooling</th>
                <th className="border border-gray-300 dark:border-gray-600 px-4 py-2">Heating</th>
                <th className="border border-gray-300 dark:border-gray-600 px-4 py-2">Cooling</th>
                <th className="border border-gray-300 dark:border-gray-600 px-4 py-2">Heating</th>
              </tr>
            </thead>
            <tbody>
              {[
                { city: "Atlanta", s_cool: "590-830", s_heat: "200-290", o_cool: "950-1360", o_heat: "480-690", r_cool: "1300-1860", r_heat: "380-600" },
                { city: "Baltimore", s_cool: "410-610", s_heat: "320-460", o_cool: "690-1080", o_heat: "720-890", r_cool: "880-1480", r_heat: "570-770" },
                { city: "Bismarck", s_cool: "150-250", s_heat: "460-500", o_cool: "250-540", o_heat: "950-990", r_cool: "340-780", r_heat: "810-900" },
                { city: "Boston", s_cool: "300-510", s_heat: "450-520", o_cool: "550-970", o_heat: "960-1000", r_cool: "610-1380", r_heat: "760-870" },
                { city: "Charleston, WV", s_cool: "430-570", s_heat: "310-440", o_cool: "620-1140", o_heat: "770-840", r_cool: "820-1600", r_heat: "620-730" },
                { city: "Charlotte", s_cool: "510-730", s_heat: "200-320", o_cool: "940-1340", o_heat: "530-780", r_cool: "1280-1830", r_heat: "420-670" },
                { city: "Chicago", s_cool: "280-410", s_heat: "390-470", o_cool: "520-920", o_heat: "820-920", r_cool: "550-1090", r_heat: "670-810" },
                { city: "Dallas", s_cool: "620-890", s_heat: "120-200", o_cool: "1100-1580", o_heat: "340-520", r_cool: "1460-2090", r_heat: "280-440" },
                { city: "Detroit", s_cool: "230-360", s_heat: "400-480", o_cool: "390-820", o_heat: "970-1020", r_cool: "530-1170", r_heat: "790-900" },
                { city: "Fairbanks, AK", s_cool: "25-50", s_heat: "560-630", o_cool: "60-200", o_heat: "1050-1170", r_cool: "110-320", r_heat: "930-1090" },
                { city: "Great Falls", s_cool: "130-220", s_heat: "360-430", o_cool: "210-490", o_heat: "820-890", r_cool: "290-710", r_heat: "680-800" },
                { city: "Hilo, HI", s_cool: "970-1390", s_heat: "0", o_cool: "1800-2580", o_heat: "15-25", r_cool: "2260-3370", r_heat: "10-15" },
                { city: "Houston", s_cool: "670-1000", s_heat: "90-130", o_cool: "1240-1770", o_heat: "250-350", r_cool: "1600-2290", r_heat: "190-300" },
                { city: "Indianapolis", s_cool: "380-560", s_heat: "400-480", o_cool: "560-1000", o_heat: "840-920", r_cool: "730-1410", r_heat: "690-830" },
                { city: "Los Angeles", s_cool: "610-910", s_heat: "50-160", o_cool: "1140-1670", o_heat: "370-580", r_cool: "1650-2350", r_heat: "250-440" },
                { city: "Louisville", s_cool: "470-670", s_heat: "290-430", o_cool: "770-1250", o_heat: "710-830", r_cool: "1000-1720", r_heat: "570-720" },
                { city: "Madison", s_cool: "210-310", s_heat: "390-470", o_cool: "320-640", o_heat: "840-900", r_cool: "420-900", r_heat: "700-800" },
                { city: "Memphis", s_cool: "580-830", s_heat: "170-240", o_cool: "950-1350", o_heat: "420-600", r_cool: "1250-1780", r_heat: "330-510" },
                { city: "Miami", s_cool: "950-1300", s_heat: "10", o_cool: "1500-2150", o_heat: "35-45", r_cool: "1920-2740", r_heat: "25-40" },
                { city: "Minneapolis", s_cool: "200-300", s_heat: "420-500", o_cool: "320-610", o_heat: "860-950", r_cool: "430-870", r_heat: "720-860" },
                { city: "Montgomery", s_cool: "630-910", s_heat: "120-180", o_cool: "1060-1510", o_heat: "330-470", r_cool: "1390-1990", r_heat: "250-400" },
                { city: "Nashville", s_cool: "520-740", s_heat: "250-320", o_cool: "830-1280", o_heat: "590-680", r_cool: "1030-1710", r_heat: "470-590" },
                { city: "New Orleans", s_cool: "690-990", s_heat: "70-110", o_cool: "1200-1720", o_heat: "230-320", r_cool: "1570-2240", r_heat: "160-260" },
                { city: "New York", s_cool: "360-550", s_heat: "350-440", o_cool: "540-1040", o_heat: "790-870", r_cool: "720-1480", r_heat: "630-760" },
                { city: "Omaha", s_cool: "310-440", s_heat: "330-400", o_cool: "480-820", o_heat: "720-800", r_cool: "610-1130", r_heat: "600-720" },
                { city: "Phoenix", s_cool: "710-1020", s_heat: "70-110", o_cool: "1130-1810", o_heat: "210-290", r_cool: "1430-2050", r_heat: "170-250" },
                { city: "Pittsburgh", s_cool: "300-530", s_heat: "470-500", o_cool: "440-920", o_heat: "910-950", r_cool: "600-1310", r_heat: "750-840" },
                { city: "Portland, ME", s_cool: "190-300", s_heat: "400-480", o_cool: "310-630", o_heat: "880-980", r_cool: "410-900", r_heat: "710-870" },
                { city: "Richmond, VA", s_cool: "510-730", s_heat: "270-410", o_cool: "880-1310", o_heat: "660-820", r_cool: "1110-1770", r_heat: "520-710" },
                { city: "Sacramento", s_cool: "600-850", s_heat: "220-360", o_cool: "1000-1430", o_heat: "640-990", r_cool: "1390-2020", r_heat: "480-830" },
                { city: "Salt Lake City", s_cool: "410-710", s_heat: "520-540", o_cool: "510-1090", o_heat: "1040-1060", r_cool: "660-1520", r_heat: "830-930" },
                { city: "Seattle", s_cool: "260-460", s_heat: "460-650", o_cool: "440-1200", o_heat: "1270-1370", r_cool: "710-1860", r_heat: "960-1170" },
                { city: "St. Louis", s_cool: "390-550", s_heat: "280-400", o_cool: "680-1100", o_heat: "710-800", r_cool: "850-1500", r_heat: "570-700" },
                { city: "Tampa", s_cool: "780-1110", s_heat: "40-60", o_cool: "1440-2000", o_heat: "140-190", r_cool: "1780-2560", r_heat: "100-160" },
                { city: "Tulsa", s_cool: "540-770", s_heat: "240-300", o_cool: "830-1300", o_heat: "560-620", r_cool: "1030-1730", r_heat: "450-540" }
              ].map((city, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'}>
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 font-medium">{city.city}</td>
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center">{city.s_cool}</td>
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center">{city.s_heat}</td>
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center">{city.o_cool}</td>
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center">{city.o_heat}</td>
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center">{city.r_cool}</td>
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center">{city.r_heat}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="text-xs italic text-gray-600 dark:text-gray-400">
            Modified from: "Development of Equivalent Full Load Heating and Cooling Hours for GCHPs Applied to Various Building Types and Locations", ASHRAE 1120-TRP, Final Report, CDH Energy Corp., Cazenovia, NY, Sept. 2000.
          </div>
        </div>
      </section>

      {/* Additional O&M Section */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-6 text-emerald-700 dark:text-emerald-500">
          F. Additional O&M
        </h2>

        <div className="space-y-8 dark:text-gray-300">
          <div>
            <h3 className="text-xl font-semibold mb-4">Suggested Basic Inspections & Record Keeping</h3>
            <p className="mb-4">
              The basic inspections below are to make sure that the equipment and surrounding areas are clean, no unusual noises or visual damages detected that require immediate attention and that records are kept. The items listed do not required any technical skills and do not represent a maintenance program. The items address only the portion of the basic inspections related to the common area lightings, irrigation system, boiler, and HVAC units. It is not a comprehensive list of inspections, and it does not include the building safety equipment, building envelope, all building mechanical, electrical and plumbing equipment and should not duplicate or replace the operation and maintenance O&M of the building systems.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-4">Record Keeping</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <span className="font-semibold">Equipment Information:</span> Keep all manufacturer's instructions and manuals available in an accessible location.
              </li>
              <li>
                Maintain a log for all Equipment including all recommended preventive maintenance and servicing dates. A copy of the work order, which confirms the performance of scheduled maintenance, or the repair, or replacement of any parts, should be placed in file to establish a record of all work performed on the equipment or systems.
              </li>
              <li>
                Create and follow a schedule of O&M items to make sure operations checks and maintenance procedures are performed with the recommended frequency (O&M conducted by contactors).
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-4">Routine Inspections</h3>
            
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold mb-2">Office/Lobby HVAC Equipment</h4>
                <p>Implement a routine walkthrough to visually inspect for cleanliness and unusual noises.</p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Irrigation System</h4>
                <p>Implement a routine walkthrough to visually inspect for:</p>
                <ul className="list-disc pl-6">
                  <li>Burst sprinkle heads</li>
                  <li>Water runoffs</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Lighting Equipment</h4>
                <p>Implement a routine walkthrough to visually inspect lighting in garage, hallways, exterior and other common areas for:</p>
                <ul className="list-disc pl-6">
                  <li>Burned bulbs or nonfunctional fixtures</li>
                  <li>Exterior lights ON during daytime hours</li>
                  <li>Fixtures cleanness</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Quarterly HVAC Inspection</h4>
                <p>To be conducted by your maintenance personnel:</p>
                <ul className="list-disc pl-6">
                  <li>Filters are in place</li>
                  <li>Correct filter size is used</li>
                  <li>Filters are clean</li>
                  <li>Thermostat's battery operational</li>
                  <li>HVAC unit's cleanliness</li>
                  <li>HAVC units suction line damage</li>
                  <li>HVAC units' unusual noises</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Boiler Routine Inspection</h4>
                <p>To be conducted by your maintenance personnel:</p>
                <ul className="list-disc pl-6">
                  <li>Boiler and surrounding area are clean</li>
                  <li>No water leaks</li>
                  <li>Insulation in place and not damaged</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Supply and Exhaust Fans</h4>
                <p>To be conducted by your maintenance personnel:</p>
                <ul className="list-disc pl-6">
                  <li>Unusual noises</li>
                  <li>Excess variation</li>
                  <li>Cleanliness</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* LADWP Rebates Section */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-6 text-emerald-700 dark:text-emerald-500">
          G. LADWP Rebates
        </h2>

        <div className="space-y-6 dark:text-gray-300">
          <div>
            <h3 className="text-lg font-semibold mb-2">LADWP AC Optimization Program</h3>
            <a 
              href="https://ladwpactuneup.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              https://ladwpactuneup.com/
            </a>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Custom Performance Program</h3>
            <a 
              href="https://www.ladwp.com/ladwp/faces/ladwp/commercial/c-savemoney/c-sm-rebatesandprograms/c-sm-rp-cpp" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline break-all"
            >
              https://www.ladwp.com/ladwp/faces/ladwp/commercial/c-savemoney/c-sm-rebatesandprograms/c-sm-rp-cpp
            </a>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Water Conservation Measures</h3>
            <a 
              href="https://www.ladwp.com/ladwp/faces/wcnav_externalId/a-w-c-waterconsmeasures" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline break-all"
            >
              https://www.ladwp.com/ladwp/faces/wcnav_externalId/a-w-c-waterconsmeasures
            </a>
          </div>
        </div>
      </section>
    </div>
  );
} 