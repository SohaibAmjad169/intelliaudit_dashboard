import React, { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { EnergyOverview } from './EnergyOverview';
import { Equipment } from './Equipment';
import { MonthlyEnergyChartContainer } from './MonthlyEnergyChartContainer';
import { BarChart3, Settings, List } from 'lucide-react';
import { apiClient } from '@/services/common/api-client';

interface Project {
  id: string;
  raw_notes?: string;
  [key: string]: any;
}

interface EnergyViewProps {
  projectId: string;
  equipment?: any[];
}

export const EnergyView: React.FC<EnergyViewProps> = ({
  projectId,
  equipment = []
}) => {
  const [project, setProject] = useState<Project | null>(null);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await apiClient.get<{ data: Project }>(`projects/${projectId}`);
        setProject(response.data);
      } catch (error) {
        console.error('Error fetching project:', error);
      }
    };

    fetchProject();
  }, [projectId]);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview" className="w-full">
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="overview" className="flex items-center">
              <BarChart3 className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="equipment" className="flex items-center">
              <Settings className="w-4 h-4 mr-2" />
              Equipment
            </TabsTrigger>
            <TabsTrigger value="monthly" className="flex items-center">
              <List className="w-4 h-4 mr-2" />
              Monthly Data
            </TabsTrigger>
          </TabsList>
        </div>

        <Card>
          <CardContent className="p-6">
            <TabsContent value="overview" className="mt-0">
              <EnergyOverview projectId={projectId} />
            </TabsContent>
            
            <TabsContent value="equipment" className="mt-0">
              <Equipment 
                projectId={projectId} 
                equipment={equipment}
                project={project}
              />
            </TabsContent>
            
            <TabsContent value="monthly" className="mt-0">
              <MonthlyEnergyChartContainer projectId={projectId} />
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
}; 