import React from 'react';
import { Project, ProjectWithDetails } from '@/types/project';
import { EnergyView } from '@/features/energy';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ProjectViewProps {
  project: Project | ProjectWithDetails;
}

export const ProjectView: React.FC<ProjectViewProps> = ({
  project
}) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{project.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-6">{project.building_address}</p>
          <EnergyView projectId={project.id} />
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectView; 