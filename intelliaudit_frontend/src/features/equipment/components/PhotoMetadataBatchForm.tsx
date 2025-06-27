import React, { useState } from 'react';
import { photoMetadataService, CreateBatchJobRequest } from '../../../services/equipment/photo-metadata';
import { Loader2 } from 'lucide-react';

// Import shadcn components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

interface PhotoMetadataBatchFormProps {
  projectId: string;
  onSuccess?: (batchJob: any) => void;
}

// Form schema
const formSchema = z.object({
  totalPhotos: z.coerce.number().min(1, { message: 'Must have at least 1 photo' }).max(1000, { message: 'Maximum 1000 photos per batch' }),
  equipmentType: z.string().optional(),
  priority: z.enum(['high', 'normal', 'low']).default('normal')
});

type FormValues = z.infer<typeof formSchema>;

/**
 * Form component for creating a new photo metadata batch processing job
 */
export const PhotoMetadataBatchForm: React.FC<PhotoMetadataBatchFormProps> = ({
  projectId,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  
  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      totalPhotos: 10,
      priority: 'normal'
    }
  });

  const handleSubmit = async (values: FormValues) => {
    try {
      setLoading(true);
      
      // Create the batch job request
      const request: CreateBatchJobRequest = {
        projectId,
        totalPhotos: values.totalPhotos,
        equipmentType: values.equipmentType,
        priority: values.priority
      };
      
      // Submit to API
      const result = await photoMetadataService.createBatchJob(request);
      
      // Show success notification
      toast({
        title: 'Batch Job Created',
        description: `Created job ${result.id} with ${values.totalPhotos} photos`
      });
      
      // Reset form
      form.reset();
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess(result);
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to Create Batch Job',
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <CardHeader className="p-0 mb-6">
        <CardTitle className="text-xl font-semibold">Create Photo Metadata Batch</CardTitle>
        <CardDescription>
          Create a new batch job to extract equipment metadata from photos.
        </CardDescription>
      </CardHeader>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="totalPhotos"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Total Photos</FormLabel>
                <FormControl>
                  <Input type="number" min={1} max={1000} {...field} className="bg-zinc-800/70 border-zinc-700" />
                </FormControl>
                <FormDescription className="text-zinc-400">
                  Enter the number of photos you plan to upload.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="equipmentType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Equipment Type</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="bg-zinc-800/70 border-zinc-700">
                      <SelectValue placeholder="Select equipment type (optional)" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    <SelectItem value="any">Any Type</SelectItem>
                    <SelectItem value="HVAC">HVAC</SelectItem>
                    <SelectItem value="Lighting">Lighting</SelectItem>
                    <SelectItem value="Plumbing">Plumbing</SelectItem>
                    <SelectItem value="Electrical">Electrical</SelectItem>
                    <SelectItem value="Building Envelope">Building Envelope</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription className="text-zinc-400">
                  Focus extraction on a specific equipment type (optional).
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Priority</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="bg-zinc-800/70 border-zinc-700">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription className="text-zinc-400">
                  Set the processing priority for this batch.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button 
            type="submit" 
            disabled={loading}
            className="w-full bg-zinc-800 text-zinc-100 border border-zinc-700 hover:bg-zinc-700"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Batch Job...
              </>
            ) : (
              'Create Batch Job'
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}; 