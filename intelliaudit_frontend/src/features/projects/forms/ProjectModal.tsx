import React from 'react';
import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { Loader2, CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Project } from '@/types/models/project.model';
import { CreateProjectDto, UpdateProjectDto } from '@/types/dto/project.dto';
import { createProject } from '@/services/projects';
import { apiClient, getEndpoint } from '@/services/common';
import { useNavigate } from 'react-router-dom';
import { Progress } from '@/components/ui/progress';
import { useProjectSetup } from '@/hooks/useProjectSetup';
import { toast } from '@/components/ui/use-toast';

// Extended form data that includes Portfolio Manager fields
interface PropertyData {
    id?: string;
    property_id?: string;
    name?: string;
    address?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    postal_code?: string; // Alternative property name
    country?: string;
    primaryFunction?: string;
    grossFloorArea?: number | string | { value: number | string };
    yearBuilt?: number | string;
    [key: string]: string | number | boolean | object | null | undefined; // Allow for other properties with specific types
}

interface ProjectData extends CreateProjectDto {
    customer_id?: string;
    pm_id?: string;
    property_state?: string;
    property_postal_code?: string;
    property_primary_function?: string;
    property_gross_floor_area?: number;
    property_year_built?: number;
    raw_notes?: string;
    [key: string]: string | number | boolean | object | null | undefined;
}

export interface ProjectFormData {
    name: string;
    portfolioManagerId?: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
    propertyType?: string;
    grossFloorArea?: string | number;
    yearBuilt?: string | number;
    pm_id?: string;
    startDate?: string;
    endDate?: string;
    description?: string;
    building_address?: string;
    status?: string;
}

interface ProjectModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: ProjectFormData) => void;
    defaultValues?: ProjectFormData;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({
    open,
    onOpenChange,
    onSubmit,
    defaultValues = {}
}) => {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isFetchingPMData, setIsFetchingPMData] = useState(false);
    const [projectName, setProjectName] = useState('');
    const [buildingAddress, setBuildingAddress] = useState('');
    const [portfolioManagerId, setPortfolioManagerId] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [pmFetchSuccess, setPmFetchSuccess] = useState(false);
    
    // New simplified approach - track the project setup state
    const [setupState, setSetupState] = useState<'form' | 'creating' | 'loading' | 'complete' | 'error'>('form');
    const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);
    
    // Add new state for date range
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Set default date range to 12/01/2023 - 12/31/2024
    useEffect(() => {
        setStartDate('2023-12-01');
        setEndDate('2024-12-31');
    }, []);

    useEffect(() => {
        if (defaultValues) {
            setProjectName(defaultValues.name || '');
            setBuildingAddress(defaultValues.building_address || '');
            setPortfolioManagerId(defaultValues.portfolioManagerId || '');
            if (defaultValues.portfolioManagerId) {
                setPmFetchSuccess(true);
            }
        } else {
            setProjectName('');
            setBuildingAddress('');
            setPortfolioManagerId('');
            setPmFetchSuccess(false);
            setError(null);
        }
    }, [defaultValues, open]);

    // Function to fetch property data from Portfolio Manager
    const fetchPortfolioManagerData = async () => {
        if (!portfolioManagerId) {
            setError('Please enter a Portfolio Manager ID');
            return;
        }

        setIsFetchingPMData(true);
        setError(null);
        setPmFetchSuccess(false);

        try {
            // Define the type for the API response
            type PortfolioManagerResponse = {
                success?: boolean;
                message?: string;
                data?: PropertyData;
                property?: PropertyData;
            };
            
            // Use the consolidated endpoint selection
            const endpoint = getEndpoint(`portfolio-manager-prisma/properties/${portfolioManagerId}`);
            
            // Fetch property data from Portfolio Manager
            const response = await apiClient.get<PortfolioManagerResponse>(endpoint);
            
            console.log('Portfolio Manager API response:', response);
            
            // Check if the response was successful
            if (!response || (response.success === false)) {
                const errorMessage = response?.message || 'Property not found';
                throw new Error(errorMessage);
            }
            
            // Handle response with data property (new API format)
            if (response?.data) {
                const property = response.data;
                
                // Update form UI elements
                setProjectName(property.name || '');
                setBuildingAddress(`${property.address || ''}, ${property.city || ''}, ${property.state || ''}, ${property.postalCode || ''}`);
                setPmFetchSuccess(true);
            }
            // Handle legacy response format
            else if (response?.property || response) {
                // Extract property details
                const property = (response?.property || response) as PropertyData;
                
                // Update form UI elements
                setProjectName(property.name || '');
                setBuildingAddress(`${property.address || ''}, ${property.city || ''}, ${property.state || ''}, ${property.postal_code || ''}`);
                setPmFetchSuccess(true);
            } else {
                console.error('No property data found in response');
                setError('Portfolio Manager ID not found');
            }
        } catch (err: unknown) {
            // Type guard for error with response property
            const apiError = err as { response?: { status?: number; data?: { message?: string } }; message?: string };
            console.error('Error fetching Portfolio Manager data:', err);
            
            // Handle different error types
            if (apiError.response?.status === 404) {
                setError(`Property ID ${portfolioManagerId} not found in Portfolio Manager`);
            } else if (apiError.response?.data?.message) {
                setError(`Error: ${apiError.response.data.message}`);
            } else if (apiError.message) {
                setError(`Error: ${apiError.message}`);
            } else {
                setError('Failed to fetch property data. Please check the ID and try again.');
            }
            
            // For testing purposes, populate with dummy data if API fails
            if (process.env.NODE_ENV === 'development') {
                setProjectName(`Test Building ${portfolioManagerId}`);
                setBuildingAddress('123 Test Street, Test City, TS 12345');
                setPmFetchSuccess(true);
            }
        } finally {
            setIsFetchingPMData(false);
        }
    };

    // Debug logging function
    const logDebug = (message: string) => {
        console.log(`[ProjectModal] ${message}`);
    };

    // Use project setup hook
    const { setupProject } = useProjectSetup();

    // Progress animation effect
    useEffect(() => {
        if (setupState === 'loading') {
            const interval = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 100) {
                        clearInterval(interval);
                        return 100;
                    }
                    return prev + 1;
                });
            }, 50);
            
            return () => clearInterval(interval);
        }
        // Return a no-op function for other cases
        return () => {};
    }, [setupState]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!portfolioManagerId || !pmFetchSuccess) {
            setError('Please verify the Portfolio Manager ID first');
            return;
        }

        if (!startDate || !endDate) {
            setError('Please select a date range');
            return;
        }

        setIsSubmitting(true);
        setError(null);
        setSetupState('creating');

        try {
            // Prepare project data with exactly the fields expected by the backend
            const projectData: ProjectData = {
                name: projectName,
                building_address: buildingAddress,
                status: 'active', // Must be lowercase to match backend enum
            };

            // Add Portfolio Manager property data if available
            if (portfolioManagerId) {
                try {
                    // Define the type for the Portfolio Manager property response
                    interface PortfolioManagerPropertyResponse {
                        success?: boolean;
                        data?: PropertyData;
                    }
                    
                    // Get property data
                    const response = await apiClient.get<PortfolioManagerPropertyResponse>(`portfolio-manager-prisma/properties/${portfolioManagerId}`);
                    
                    if (response && response.success && response.data) {
                        const pmData = response.data;
                        Object.assign(projectData, {
                            pm_id: portfolioManagerId,
                            property_name: pmData.name, 
                            property_address: pmData.address,
                            property_city: pmData.city,
                            property_state: pmData.state,
                            property_postal_code: pmData.postalCode,
                            property_primary_function: pmData.primaryFunction,
                            property_gross_floor_area: pmData.grossFloorArea,
                            property_year_built: pmData.yearBuilt
                        });
                    }
                } catch (error) {
                    console.error('Error fetching Portfolio Manager data for project creation:', error);
                    // Continue with project creation even if PM data fetch fails
                }
            }

            console.log('Creating project with data:', projectData);

            // Create the project using the centralized projects API
            const response = await createProject(projectData);
            
            // Check if response is null
            if (!response) {
                throw new Error('Failed to create project - null response from server');
            }
            
            console.log('Project created:', response);
            
            // Store the project ID
            setCreatedProjectId(response.id);
            
            // Update state to loading
            setSetupState('loading');
            setProgress(10);
            
            // Ensure we have a valid project ID before proceeding
            const projectId = response.id;
            if (!projectId) {
                console.error('No project ID returned from createProject');
                setSetupState('error');
                return;
            }

            logDebug(`Setting up project with Portfolio Manager data: PM ID=${portfolioManagerId}, Project ID=${projectId}`);
            
            // Start project setup
            setupProject({
                portfolioManagerId,
                projectId,
                startDate,
                endDate
            }).then(setupResult => {
                logDebug(`Project setup completed: ${setupResult.success}`);
                setProgress(100);
                setSetupState('complete');
            }).catch(error => {
                logDebug(`Error during project setup: ${error.message}`);
                setSetupState('error');
            });
            
        } catch (error: unknown) {
            const apiError = error as { message?: string };
            console.error('Error creating project:', error);
            setIsSubmitting(false);
            setError(apiError.message || 'Failed to create project');
            setSetupState('error');
        }
    };

    // Navigate to the project page
    const goToProject = () => {
        if (!createdProjectId) return;
        
        // Close the modal first
        onOpenChange(false);
        
        // Navigate directly to project without customer path
        navigate(`/projects/${createdProjectId}`, {
            state: { projectId: createdProjectId }
        });
        
        // Call success callback
        if (onSubmit) {
            const createdProject: ProjectFormData = {
                name: projectName,
                building_address: buildingAddress, 
                status: 'active',
                portfolioManagerId,
                startDate,
                endDate
            };
            onSubmit(createdProject);
            toast({ description: 'Project created successfully!' });
        }
    };

    // Determine what content to show based on the current state
    const renderContent = () => {
        switch (setupState) {
            case 'form':
                return (
                    <form onSubmit={handleSubmit}>
                        <div className="p-6 space-y-6">
                            {/* Portfolio Manager ID field */}
                            <div className="p-4 bg-card/50 border rounded-lg">
                                <div className="space-y-3">
                                    <Input
                                        type="text"
                                        id="portfolio_manager_id"
                                        value={portfolioManagerId}
                                        onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                            setPortfolioManagerId(e.target.value);
                                            if (pmFetchSuccess) {
                                                setPmFetchSuccess(false);
                                            }
                                        }}
                                        placeholder="Portfolio Manager ID"
                                        className="text-lg"
                                    />
                                    
                                    <div className="flex justify-end">
                                        <Button
                                            type="button"
                                            variant="default"
                                            onClick={fetchPortfolioManagerData}
                                            disabled={isFetchingPMData || !portfolioManagerId}
                                            className="bg-emerald-600 hover:bg-emerald-700"
                                        >
                                            {isFetchingPMData ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                    Verifying...
                                                </>
                                            ) : (
                                                'Verify'
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Date Range Selection */}
                            {pmFetchSuccess && !error && (
                                <div className="space-y-4 border p-4 rounded-lg">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="start_date" className="block text-sm font-medium text-muted-foreground mb-1">
                                                Start Date
                                            </label>
                                            <Input
                                                type="date"
                                                id="start_date"
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                                max={endDate}
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="end_date" className="block text-sm font-medium text-muted-foreground mb-1">
                                                End Date
                                            </label>
                                            <Input
                                                type="date"
                                                id="end_date"
                                                value={endDate}
                                                onChange={(e) => setEndDate(e.target.value)}
                                                min={startDate}
                                            />
                                        </div>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Select a 13-month date range for accurate energy calculations
                                    </p>
                                </div>
                            )}

                            {error && (
                                <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md">
                                    <span className="block sm:inline">{error}</span>
                                </div>
                            )}

                            {pmFetchSuccess && !error && (
                                <div className="bg-green-50/50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-4 py-3 rounded-md">
                                    <div className="space-y-2">
                                        <div className="font-medium">{projectName}</div>
                                        <div className="text-sm text-muted-foreground">{buildingAddress}</div>
                                    </div>
                                </div>
                            )}

                            <input type="hidden" id="project_name" value={projectName} />
                            <input type="hidden" id="building_address" value={buildingAddress} />
                        </div>

                        <div className="flex items-center justify-end gap-3 p-4 border-t">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="default"
                                disabled={isSubmitting || !portfolioManagerId || !pmFetchSuccess}
                                className="bg-emerald-600 hover:bg-emerald-700"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    'Create Project'
                                )}
                            </Button>
                        </div>
                    </form>
                );
                
            case 'creating':
            case 'loading':
                return (
                    <div className="p-8 flex flex-col items-center">
                        <h2 className="text-2xl font-semibold mb-6 text-center">
                            Setting Up Your Project
                        </h2>
                        
                        <Progress value={progress} className="w-full mb-8" />
                        
                        <div className="flex items-center gap-3 mb-4">
                            {progress < 100 ? (
                                <Loader2 className="h-5 w-5 animate-spin text-emerald-500" />
                            ) : (
                                <CheckCircle className="h-5 w-5 text-emerald-500" />
                            )}
                            <span className="font-medium">
                                {progress < 50 ? "Creating project..." : 
                                 progress < 100 ? "Importing Portfolio Manager data..." : 
                                 "Setup complete!"}
                            </span>
                        </div>
                        
                        <div className="mt-6">
                            <Button
                                type="button"
                                variant="default"
                                className="bg-emerald-600 hover:bg-emerald-700"
                                disabled={progress < 100}
                                onClick={goToProject}
                            >
                                Go to Project <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                );
                
            case 'complete':
                return (
                    <div className="p-8 flex flex-col items-center">
                        <h2 className="text-2xl font-semibold mb-6 text-center">
                            Project Setup Complete
                        </h2>
                        
                        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/20 mb-6">
                            <CheckCircle className="h-8 w-8 text-emerald-500" />
                        </div>
                        
                        <p className="text-center mb-8">
                            Your project "{projectName}" has been created and set up with Portfolio Manager data.
                        </p>
                        
                        <Button
                            type="button"
                            variant="default"
                            className="bg-emerald-600 hover:bg-emerald-700"
                            onClick={goToProject}
                        >
                            Go to Project <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                );
                
            case 'error':
                return (
                    <div className="p-8 flex flex-col items-center">
                        <h2 className="text-2xl font-semibold mb-6 text-center text-destructive">
                            Error Creating Project
                        </h2>
                        
                        <p className="text-center mb-6">
                            {error || "There was an error setting up your project. Please try again."}
                        </p>
                        
                        <div className="flex gap-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                            >
                                Close
                            </Button>
                            
                            {createdProjectId && (
                                <Button
                                    type="button"
                                    variant="default"
                                    className="bg-emerald-600 hover:bg-emerald-700"
                                    onClick={goToProject}
                                >
                                    Go to Project <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </div>
                );
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>
                        {setupState === 'form' ? "Create Project" : 
                         setupState === 'complete' ? "Project Created" : "Setting Up Project"}
                    </DialogTitle>
                    <DialogDescription>
                        {setupState === 'form' ? "Enter Portfolio Manager ID to create a project" : ""}
                    </DialogDescription>
                </DialogHeader>
                
                {renderContent()}
            </DialogContent>
        </Dialog>
    );
}; 