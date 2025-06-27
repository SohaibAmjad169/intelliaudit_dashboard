import React from 'react';
import { Project } from '../../../types/project';

interface ProjectOverviewProps {
  project: Project;
}

export const ProjectOverview: React.FC<ProjectOverviewProps> = ({ project }) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <div>
          <h3 className="text-lg font-semibold">Status</h3>
          <p className="capitalize">{project.status.replace('_', ' ')}</p>
        </div>
      </div>
    </div>
  );
};
