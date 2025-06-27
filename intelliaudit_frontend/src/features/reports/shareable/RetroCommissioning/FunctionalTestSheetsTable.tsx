import React from 'react';

export function FunctionalTestSheetsTable(): JSX.Element {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse text-sm">
        <thead>
          <tr className="bg-green-100 dark:bg-green-800">
            <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">System and Controls</th>
            <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">Test</th>
            <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">Procedure and Criteria</th>
            <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center w-20">Pass</th>
            <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center w-20">Fail</th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800">
          {/* HVAC Systems and Controls */}
          <tr>
            <td rowSpan={8} className="border border-gray-300 dark:border-gray-600 px-4 py-2 bg-gray-50 dark:bg-gray-700 align-top font-medium">
              HVAC Systems and Controls:
            </td>
            <td rowSpan={2} className="border border-gray-300 dark:border-gray-600 px-4 py-2">Temperature Control Test</td>
            <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">Verify ability to maintain set temperatures in different zones.</td>
            <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center">X</td>
            <td className="border border-gray-300 dark:border-gray-600 px-4 py-2"></td>
          </tr>
          <tr>
            <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">Test under various temperature settings.</td>
            <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center">X</td>
            <td className="border border-gray-300 dark:border-gray-600 px-4 py-2"></td>
          </tr>
          <tr>
            <td rowSpan={2} className="border border-gray-300 dark:border-gray-600 px-4 py-2">Airflow Testing</td>
            <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">Confirm proper airflow rates and distribution.</td>
            <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center">X</td>
            <td className="border border-gray-300 dark:border-gray-600 px-4 py-2"></td>
          </tr>
          <tr>
            <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">Conduct tests in different zones for consistency.</td>
            <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center">X</td>
            <td className="border border-gray-300 dark:border-gray-600 px-4 py-2"></td>
          </tr>
          <tr>
            <td rowSpan={2} className="border border-gray-300 dark:border-gray-600 px-4 py-2">Humidity Control Test</td>
            <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">Ensure maintenance of appropriate humidity levels.</td>
            <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center">X</td>
            <td className="border border-gray-300 dark:border-gray-600 px-4 py-2"></td>
          </tr>
          <tr>
            <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">Test system response to changes in humidity requirements.</td>
            <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center">X</td>
            <td className="border border-gray-300 dark:border-gray-600 px-4 py-2"></td>
          </tr>
          <tr>
            <td rowSpan={2} className="border border-gray-300 dark:border-gray-600 px-4 py-2">Fault Detection and Diagnostics</td>
            <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">Test ability to detect and diagnose faults/malfunctions.</td>
            <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center">X</td>
            <td className="border border-gray-300 dark:border-gray-600 px-4 py-2"></td>
          </tr>
          <tr>
            <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">Introduce simulated faults; assess system response and diagnostics.</td>
            <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center">X</td>
            <td className="border border-gray-300 dark:border-gray-600 px-4 py-2"></td>
          </tr>

          {/* Indoor Lighting Systems and Controls */}
          <tr>
            <td rowSpan={8} className="border border-gray-300 dark:border-gray-600 px-4 py-2 bg-gray-50 dark:bg-gray-700 align-top font-medium">
              Indoor Lighting Systems and Controls:
            </td>
            <td rowSpan={2} className="border border-gray-300 dark:border-gray-600 px-4 py-2">Illuminance Measurement</td>
            <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">Verify required illuminance levels in different areas.</td>
            <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center">X</td>
            <td className="border border-gray-300 dark:border-gray-600 px-4 py-2"></td>
          </tr>
          <tr>
            <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">Use light meters to measure illuminance.</td>
            <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center">X</td>
            <td className="border border-gray-300 dark:border-gray-600 px-4 py-2"></td>
          </tr>
          <tr>
            <td rowSpan={2} className="border border-gray-300 dark:border-gray-600 px-4 py-2">Dimming Control Test</td>
            <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">Test functionality of dimming controls.</td>
            <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center">X</td>
            <td className="border border-gray-300 dark:border-gray-600 px-4 py-2"></td>
          </tr>
          <tr>
            <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">Ensure smooth and accurate dimming.</td>
            <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center">X</td>
            <td className="border border-gray-300 dark:border-gray-600 px-4 py-2"></td>
          </tr>
          <tr>
            <td rowSpan={2} className="border border-gray-300 dark:border-gray-600 px-4 py-2">Occupancy Sensor Test</td>
            <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">Verify correct operation of occupancy sensors.</td>
            <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center">X</td>
            <td className="border border-gray-300 dark:border-gray-600 px-4 py-2"></td>
          </tr>
          <tr>
            <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">Test sensor response and reliability in detecting occupancy.</td>
            <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center">X</td>
            <td className="border border-gray-300 dark:border-gray-600 px-4 py-2"></td>
          </tr>
          <tr>
            <td rowSpan={2} className="border border-gray-300 dark:border-gray-600 px-4 py-2">Daylight Harvesting Test</td>
            <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">Ensure adjustment based on natural daylight levels.</td>
            <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center">X</td>
            <td className="border border-gray-300 dark:border-gray-600 px-4 py-2"></td>
          </tr>
          <tr>
            <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">Conduct tests to assess system's ability to balance artificial and natural lighting.</td>
            <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center">X</td>
            <td className="border border-gray-300 dark:border-gray-600 px-4 py-2"></td>
          </tr>

          {/* Water Heating Systems */}
          <tr>
            <td rowSpan={6} className="border border-gray-300 dark:border-gray-600 px-4 py-2 bg-gray-50 dark:bg-gray-700 align-top font-medium">
              Water Heating Systems:
            </td>
            <td rowSpan={2} className="border border-gray-300 dark:border-gray-600 px-4 py-2">Temperature Control Test</td>
            <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">Confirm maintenance of desired water temperature.</td>
            <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center">X</td>
            <td className="border border-gray-300 dark:border-gray-600 px-4 py-2"></td>
          </tr>
          <tr>
            <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">Test under various load conditions.</td>
            <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center">X</td>
            <td className="border border-gray-300 dark:border-gray-600 px-4 py-2"></td>
          </tr>
          <tr>
            <td rowSpan={2} className="border border-gray-300 dark:border-gray-600 px-4 py-2">Efficiency Testing</td>
            <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">Measure efficiency in converting energy to heat.</td>
            <td className="border border-gray-300 dark:border-gray-600 px-4 py-2"></td>
            <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center">X</td>
          </tr>
          <tr>
            <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">Conduct tests to assess energy consumption and heat output.</td>
            <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center">X</td>
            <td className="border border-gray-300 dark:border-gray-600 px-4 py-2"></td>
          </tr>
          <tr>
            <td rowSpan={2} className="border border-gray-300 dark:border-gray-600 px-4 py-2">Recovery Rate Test</td>
            <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">Assess ability to recover and heat water at expected rate.</td>
            <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center">X</td>
            <td className="border border-gray-300 dark:border-gray-600 px-4 py-2"></td>
          </tr>
          <tr>
            <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">Test time taken to reach desired temperatures after water usage.</td>
            <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center">X</td>
            <td className="border border-gray-300 dark:border-gray-600 px-4 py-2"></td>
          </tr>

          {/* Potable Water Distribution Systems */}
          <tr>
            <td rowSpan={6} className="border border-gray-300 dark:border-gray-600 px-4 py-2 bg-gray-50 dark:bg-gray-700 align-top font-medium">
              Potable Water Distribution Systems:
            </td>
            <td rowSpan={2} className="border border-gray-300 dark:border-gray-600 px-4 py-2">Water Pressure Testing</td>
            <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">Verify water pressure meets design specifications.</td>
            <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center">X</td>
            <td className="border border-gray-300 dark:border-gray-600 px-4 py-2"></td>
          </tr>
          <tr>
            <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">Measure pressure at different locations.</td>
            <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center">X</td>
            <td className="border border-gray-300 dark:border-gray-600 px-4 py-2"></td>
          </tr>
          <tr>
            <td rowSpan={2} className="border border-gray-300 dark:border-gray-600 px-4 py-2">Flow Rate Measurement</td>
            <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">Confirm water flow rates are within acceptable ranges.</td>
            <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center">X</td>
            <td className="border border-gray-300 dark:border-gray-600 px-4 py-2"></td>
          </tr>
          <tr>
            <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">Test flow rates at different points in the distribution system.</td>
            <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center">X</td>
            <td className="border border-gray-300 dark:border-gray-600 px-4 py-2"></td>
          </tr>
          <tr>
            <td rowSpan={2} className="border border-gray-300 dark:border-gray-600 px-4 py-2">Leak Detection</td>
            <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">Test for leaks in the distribution system.</td>
            <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center">X</td>
            <td className="border border-gray-300 dark:border-gray-600 px-4 py-2"></td>
          </tr>
          <tr>
            <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">Employ leak detection methods; assess system's ability to identify and respond.</td>
            <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center">X</td>
            <td className="border border-gray-300 dark:border-gray-600 px-4 py-2"></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
} 