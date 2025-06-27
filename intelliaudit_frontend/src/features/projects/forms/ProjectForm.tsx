import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PROJECT_STATUS_VALUES, ProjectStatus, CreateProjectData } from '@/types/project';
import { Input } from '@/components/forms/inputs/Input';
import { Select } from '@/components/forms/selects/Select';
import { Textarea } from '@/components/forms/inputs/Textarea';
import { Button } from '@/components/shared/actions/Button';
import { z } from 'zod';

// Define schema to match CreateProjectData exactly
const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  building_address: z.string().min(1, 'Building address is required'),
  stage: z.string().optional(),
  status: z.custom<ProjectStatus>((val): val is ProjectStatus => 
    Object.values(PROJECT_STATUS_VALUES).includes(val as any),
    { message: "Invalid project status" }
  ),
  description: z.string().optional(),
});

type ProjectFormData = z.infer<typeof projectSchema>;

interface ProjectFormProps {
  onSubmit: (data: CreateProjectData) => void;
  initialData?: Partial<CreateProjectData>;
  isSubmitting?: boolean;
}

const FormField: React.FC<{
  label: string;
  error?: string | undefined;
  children: React.ReactNode;
}> = ({ label, error, children }) => (
  <div className="space-y-1">
    <div className="text-sm font-medium text-gray-700 dark:text-gray-200">{label}</div>
    {children}
    {error && <div className="text-sm text-red-500">{error}</div>}
  </div>
);

export const ProjectForm: React.FC<ProjectFormProps> = ({
  onSubmit,
  initialData,
  isSubmitting = false,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: initialData ? {
      ...initialData,
      description: initialData.description || '',
      status: initialData.status || PROJECT_STATUS_VALUES.ACTIVE
    } : {
      description: '',
      status: PROJECT_STATUS_VALUES.ACTIVE
    },
  });

  const statusOptions = Object.values(PROJECT_STATUS_VALUES).map((status) => ({
    value: status,
    label: status.charAt(0).toUpperCase() + status.slice(1),
  }));

  const handleFormSubmit = (data: ProjectFormData) => {
    // Ensure data matches CreateProjectData exactly
    const formData: CreateProjectData = {
      name: data.name,
      building_address: data.building_address,
      status: data.status,
    };
    
    // Only add description if it has a value
    if (data.description) {
      formData.description = data.description;
    }
    
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <FormField label="Project Name" error={errors.name?.message}>
        <Input
          {...register('name')}
          error={!!errors.name}
        />
      </FormField>

      <FormField label="Building Address" error={errors.building_address?.message}>
        <Input
          {...register('building_address')}
          error={!!errors.building_address}
        />
      </FormField>

      <FormField label="Status" error={errors.status?.message}>
        <Select
          {...register('status')}
          options={statusOptions}
          onChange={(value) => {
            const event = { target: { value } } as any;
            register('status').onChange(event);
          }}
        />
      </FormField>

      <FormField label="Description" error={errors.description?.message}>
        <Textarea
          {...register('description')}
          {...(errors.description?.message ? { error: errors.description.message } : {})}
        />
      </FormField>

      <Button
        type="submit"
        variant="primary"
        size="md"
        isLoading={isSubmitting}
        loadingText="Saving..."
      >
        Save Project
      </Button>
    </form>
  );
};
