import React from 'react';
import { PlaceholderHighlight } from '@/components/ui/PlaceholderHighlight';

interface ProjectTeamTableProps {
  projectId: string;
}

export function ProjectTeamTable({ projectId }: ProjectTeamTableProps) {
  const teamMembers = [
    { role: 'Chief Engineer', name: 'Dr. William Shoard, P.E.', company: 'Vert Energy Group' },
    { role: 'Chief Engineer', name: 'David Ellner, P.E.', company: 'Vert Energy Group' },
    { role: 'Project Manager', name: 'Jill Jones', company: 'Vert Energy Group' },
    { role: 'Project Coordinator', name: 'Cassandra Hall', company: 'Vert Energy Group' },
    { role: 'Energy Efficiency Engineer II', name: 'Ryan Hillis', company: 'Vert Energy Group' },
    { role: 'Energy Efficiency Engineer II', name: 'Maya Witenberg', company: 'Vert Energy Group' },
    { role: 'Field Auditor II', name: 'Sovit Bhetwal', company: 'Vert Energy Group' },
    { role: 'Field Auditor II', name: 'Sujata Bhetwal', company: 'Vert Energy Group' },
    { role: 'Auditor/RCx Agent', name: 'Matthew Broyles', company: 'Vert Energy Group' },
    { role: 'Auditor/RCx Agent', name: 'Damone Jones', company: 'Vert Energy Group' },
    { role: 'Management', name: 'Gabby Robles', company: '[Property Management Company]' }
  ];

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
            <th className="py-2 px-3 border border-gray-300 dark:border-gray-600">Role</th>
            <th className="py-2 px-3 border border-gray-300 dark:border-gray-600">Name</th>
            <th className="py-2 px-3 border border-gray-300 dark:border-gray-600">Company</th>
          </tr>
        </thead>
        <tbody>
          {teamMembers.map((member, index) => (
            <tr key={index} className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
              <td className="py-2 px-3 border border-gray-300 dark:border-gray-600">{member.role}</td>
              <td className="py-2 px-3 border border-gray-300 dark:border-gray-600">{member.name}</td>
              <td className="py-2 px-3 border border-gray-300 dark:border-gray-600">
                {member.company === '[Property Management Company]' ? (
                  <PlaceholderHighlight 
                    defaultValue="[Property Management Company]" 
                    actualValue={undefined}
                  >
                    [Property Management Company]
                  </PlaceholderHighlight>
                ) : (
                  member.company
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 