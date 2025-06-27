import React from 'react';
import { getProject } from '@/services/projects';
import { format } from 'date-fns';
import { 
  EEMsCostSavingsTable, 
  ExistingConditionsAndObservations, 
  EnergyEfficiencyMeasures,
  EnergyStarBenchmarking,
  EnergyUseAnalysis
} from './index';

interface AuditIntroductionProps {
  projectId: string;
  project?: any;
}

export function AuditIntroduction({ projectId, project }: AuditIntroductionProps) {
  const [projectData, setProjectData] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchProjectData = async () => {
      try {
        setIsLoading(true);
        const data = await getProject(projectId);
        const project = Array.isArray(data) ? data[0] : data;
        setProjectData(project);
      } catch (err) {
        setError('Failed to load project data');
        console.error('Error fetching project data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (projectId) {
      fetchProjectData();
    }
  }, [projectId]);

  // Format address from project data
  const getFormattedAddress = () => {
    if (!projectData) return '';
    
    const address = projectData.property_address || projectData.address || '';
    const city = projectData.property_city || projectData.city || '';
    const state = projectData.property_state || projectData.state || '';
    const zip = projectData.property_zip || projectData.zip_code || '';
    
    return `${address}, ${city}, ${state} ${zip}`;
  };

  // Get audit date (could be from audit metadata or project creation date)
  const getAuditDate = () => {
    if (!projectData) return '';
    
    // Try to get the actual audit date if it exists
    const auditDate = projectData.audit_date || projectData.site_visit_date;
    
    if (auditDate) {
      return format(new Date(auditDate), 'MMMM d, yyyy');
    }
    
    // Fallback to project creation date
    const createdAt = projectData.created_at || projectData.createdAt;
    if (createdAt) {
      return format(new Date(createdAt), 'MMMM d, yyyy');
    }
    
    return 'Date not available';
  };

  if (isLoading) {
    return <div className="text-center py-6">Loading audit information...</div>;
  }

  if (error) {
    return <div className="text-center py-6 text-red-500">Error: {error}</div>;
  }

  return (
    <>
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-4 text-emerald-700 dark:text-emerald-500">
          ASHRAE Level II Energy Audit Report
        </h2>

        <h3 className="text-xl font-semibold mb-3 text-emerald-700 dark:text-emerald-500">
          Introduction
        </h3>

        <p className="mb-4">
          An ASHARE level II energy audit was performed at <span className="font-semibold">{getFormattedAddress()}</span> on <span className="font-semibold">{getAuditDate()}</span> in accordance with ASHRAE procedures & guidelines for building energy audits.
        </p>

        <p className="mb-6">
          The audit identifies no-cost, low-cost and potential capital-intensive energy savings opportunities. In addition, the report provides a list of EEM recommendations along with an analysis of the energy costs, energy usage and building characteristics.
        </p>

        <h3 className="text-xl font-semibold mb-3 text-emerald-700 dark:text-emerald-500">
          Energy Audit Procedures
        </h3>

        <p className="mb-4">
          The Energy audit procedure consists of the following tasks:
        </p>

        <div className="ml-4 mb-6">
          <h4 className="font-semibold mb-2">Conduct a Pre-Audit Call</h4>
          <ul className="list-disc ml-6 mb-4">
            <li>Discuss the upcoming audit with the site staff.</li>
            <li>Discuss the site visit procedures.</li>
            <li>Discuss the use of photography during the site visit.</li>
            <li>Request document needed for the energy audit.</li>
          </ul>

          <h4 className="font-semibold mb-2">Documents Review</h4>
          <ul className="list-disc ml-6 mb-4">
            <li>Metering/utility bills analysis.</li>
            <li>Review Portfolio Manager.</li>
            <li>Review as-built plans.</li>
            <li>Review previous energy assessments.</li>
            <li>Review a comprehensive maintenance report of fixtures kept by on-site staff to determine any potential maintenance needs.</li>
          </ul>

          <h4 className="font-semibold mb-2">Site Visit</h4>
          <ul className="list-disc ml-6 mb-4">
            <li>Collect information related to building's energy use, occupancy, operation, and occupant behavior.</li>
            <li>Review important energy-using systems, processes, and equipment.</li>
            <li>Gathering existing equipment name plate information.</li>
            <li>Gathering existing equipment controls strategies.</li>
            <li>Conduct Performance tests/Collect quantitative data such as:
              <ul className="list-disc ml-6 my-2">
                <li>surface temperatures with an infrared thermometer.</li>
                <li>IAQ: Space temperatures, relative humidity, Illumination and CO2 levels.</li>
                <li>Check setpoints and setbacks.</li>
                <li>Changing parameters, set points or conditions, and observing and documenting the actual system or equipment response through various modes and conditions (both simulated and real).</li>
              </ul>
            </li>
            <li>Assess and/or deploy or the use of the data loggers.</li>
            <li>Assess the equipment condition and general maintenance procedures.</li>
            <li>Inquire about persistent comfort issue.</li>
          </ul>

          <h4 className="font-semibold mb-2">Data Analysis</h4>
          <p className="mb-2">Energy savings are calculated utilizing industry standard procedures and accepted engineering assumptions.</p>
          <p className="mb-2">Typical analysis methodologies include one or more of the following:</p>
          <ul className="list-disc ml-6 mb-4">
            <li>spreadsheet analysis based on engineering formulas.</li>
            <li>Technical Reference Manuals (TRM)</li>
            <li>Software based simulation</li>
          </ul>

          <h4 className="font-semibold mb-2">Cost Analysis Calculation</h4>
          <p className="mb-2">The cost analysis considers current energy costs, measure implementation costs and potential savings over time help to determine practicality and priority of EEM recommendations.</p>
          <p className="mb-2">Cost Estimates noted within this report are based on one of the following industry accepted costing data such as:</p>
          <ul className="list-disc ml-6 mb-4">
            <li>RSMeans™ Cost Data</li>
            <li>Vendors pricing</li>
            <li>and engineering estimates</li>
          </ul>
          <p className="mb-2">EEMs recommended are EEMs with a positive Net Present Value (NPV)</p>
          <p className="mb-2">The report also displays other financial matrixes such as simple payback period, life cycle cost, internal rate of return and discounted payback.</p>
        </div>
      </section>

      {/* Add the EEMs Cost Savings Summary Table */}
      <EEMsCostSavingsTable projectId={projectId} />

      {/* Add the Existing Conditions and Observations section */}
      <ExistingConditionsAndObservations projectId={projectId} />

      {/* Add the Energy Efficiency Measures section */}
      <EnergyEfficiencyMeasures projectId={projectId} />

      {/* Add the Energy Star Benchmarking section */}
      <EnergyStarBenchmarking projectId={projectId} />
      
      {/* Add the Energy Use Analysis section */}
      <EnergyUseAnalysis projectId={projectId} project={project} />
    </>
  );
} 