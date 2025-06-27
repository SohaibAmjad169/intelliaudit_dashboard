import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getProjects, deleteProject } from '@/services/projects';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

import { FileText, Plus, Trash2, ExternalLink, Building2, Settings, Loader2 } from 'lucide-react';
import { useSidebar } from '@/contexts/SidebarContext';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from '@/components/ui/use-toast';
import { ProjectModal } from '@/features/projects/forms/ProjectModal';
import { DeleteConfirmationModal } from '@/components/shared/modals/DeleteConfirmationModal';
import { EmptyState } from '@/components/shared/data-display/EmptyState';
import { Project } from '@/types/models/project.model';
import { ProjectListItemDto } from '@/types/dto/project.dto';
import { apiClient } from '@/services/common/api-client';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectListItemDto[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<ProjectListItemDto[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<ProjectListItemDto | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { setSidebarContent } = useSidebar();
  const [generatingContext, setGeneratingContext] = useState<Record<string, boolean>>({});
  
  // Clear sidebar content when viewing projects list
  useEffect(() => {
    setSidebarContent(null);
    
    // Cleanup function to prevent memory leaks
    return () => {
      // No cleanup needed for setting null
    };
  }, [setSidebarContent]);

  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      const data = await getProjects();
      const projectsData = Array.isArray(data) ? data : [];
      setProjects(projectsData);
      setFilteredProjects(projectsData);
    } catch (error) {
      console.error('Error fetching projects:', error);
      setProjects([]);
      setFilteredProjects([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // Filter projects based on search query using a token-based approach
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredProjects(projects);
      return;
    }
    
    // Split the query into tokens and clean them
    const queryTokens = searchQuery.toLowerCase()
      .split(/\s+/) // Split by whitespace
      .map(token => token.trim())
      .filter(token => token.length > 0); // Remove empty tokens
    
    console.log('Search query tokens:', queryTokens);
    
    const filtered = projects.filter(project => {
      // Use nullish coalescing to handle null/undefined values
      const name = (project.name ?? '').toLowerCase();
      const address = (project.building_address ?? '').toLowerCase();
      
      // Combine name and address for searching
      const searchableText = `${name} ${address}`;
      
      // Check if all tokens are found in the searchable text
      const matchesAllTokens = queryTokens.every(token => {
        return searchableText.includes(token);
      });
      
      // For debugging
      if (matchesAllTokens) {
        console.log(`Match found for project ${project.id}:`, { 
          name, 
          address, 
          searchableText,
          queryTokens
        });
      }
      
      return matchesAllTokens;
    });
    
    console.log(`Found ${filtered.length} matches for query: ${searchQuery}`);
    setFilteredProjects(filtered);
  }, [searchQuery, projects]);

  // Open delete confirmation modal
  const handleDeleteClick = (project: ProjectListItemDto) => {
    setProjectToDelete(project);
    setShowDeleteModal(true);
  };

  // Handle project deletion when confirmed
  const handleDeleteConfirm = async (): Promise<void> => {
    if (!projectToDelete) return;
    
    setIsDeleting(true);
    try {
      await deleteProject(projectToDelete.id);
      const success = true; // The deleteProject function will throw an error if it fails
      if (success) {
        toast({
          title: "Project deleted",
          description: `${projectToDelete.name || 'Untitled Project'} has been deleted successfully.`,
        });
        fetchProjects(); // Refresh the list
      } else {
        toast({
          title: "Error",
          description: "Failed to delete project. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      toast({
        title: "Error",
        description: "Failed to delete project. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      setProjectToDelete(null);
    }
  };

  const handleGenerateContext = async (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setGeneratingContext(prev => ({ ...prev, [projectId]: true }));
    
    try {
      await apiClient.post(`/ai-command/project/${projectId}/generate-context`);
      toast({
        title: "Context Generated",
        description: `AI context generated successfully for project ${projectId}.`,
      });
      fetchProjects(); // Refresh the list to update context status
    } catch (error: any) {
      console.error("Error generating context:", error);
      toast({
        title: "Error Generating Context",
        description: error.response?.data?.message || error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setGeneratingContext(prev => ({ ...prev, [projectId]: false }));
    }
  };

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold">Projects</h1>
        </div>
        <Button onClick={() => setShowProjectModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Project
        </Button>
      </div>
      
      {/* Search Bar */}
      <div className="mb-6 relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search projects by name or address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
        </div>
      ) : filteredProjects.length === 0 && searchQuery ? (
        <EmptyState
          icon={Search}
          title="No matching projects"
          description={`No projects found matching '${searchQuery}'. Try a different search term.`}
          className="bg-muted/10 border border-dashed rounded-lg py-16"
        />
      ) : projects.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No projects found"
          description="Use the 'New Project' button above to get started"
          className="bg-muted/10 border border-dashed rounded-lg py-16"
        />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project Name</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>AI Context</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProjects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 mr-2 text-emerald-500" />
                      {project.name || 'Untitled Project'}
                    </div>
                  </TableCell>
                  <TableCell>{project.building_address || 'No address'}</TableCell>
                  <TableCell>
                    {project.created_at ? new Date(project.created_at).toLocaleDateString() : 'Unknown'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => handleGenerateContext(project.id, e)}
                        disabled={Boolean(generatingContext[project.id])}
                        title={project.ai_context ? "Regenerate AI Context" : "Generate AI Context"}
                      >
                        {generatingContext[project.id] ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Settings className="h-4 w-4" />
                        )}
                        <span className="ml-2 hidden sm:inline">{project.ai_context ? "Regen" : "Generate"}</span>
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Link to={`/projects/${project.id}`}>
                        <Button variant="outline" size="sm">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View
                        </Button>
                      </Link>
                      <Link to={`/share/projects/${project.id}`} target="_blank">
                        <Button variant="outline" size="sm">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Shareable Link
                        </Button>
                      </Link>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleDeleteClick(project)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      
      {/* Project Modal */}
      <ProjectModal
        open={showProjectModal}
        onOpenChange={setShowProjectModal}
        onSubmit={(formData) => {
          // The form data should already be set to false by the component when complete
          fetchProjects();
          toast({
            title: "Project created",
            description: `${formData.name || 'New project'} has been created successfully.`,
          });
        }}
        defaultValues={{ name: '' }}
      />
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && projectToDelete && (
        <DeleteConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteConfirm}
          title="Delete Project"
          message={`Are you sure you want to delete ${projectToDelete?.name || 'this project'}? This action cannot be undone.`}
          isDeleting={isDeleting}
        />
      )}
    </div>
  );
} 