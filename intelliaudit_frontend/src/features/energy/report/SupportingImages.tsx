import React from 'react';
import { Image, Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface ImageItem {
  id: string;
  title: string;
  description: string;
  category: string;
  url: string;
  thumbnail?: string;
  date?: string;
  location?: string;
}

interface SupportingImagesProps {
  images: ImageItem[];
  // Property that is received but not currently used in the component
  // Using underscore prefix to indicate it is intentionally unused
  _projectId?: string;
}

export const SupportingImages: React.FC<SupportingImagesProps> = ({
  images,
  // This parameter is received for future implementation of image loading
  // @ts-ignore -- Intentionally unused property for future implementation
  _projectId,
}) => {
  // Group images by category
  const imagesByCategory: Record<string, ImageItem[]> = {};
  images.forEach(image => {
    if (!imagesByCategory[image.category]) {
      imagesByCategory[image.category] = [];
    }
    imagesByCategory[image.category].push(image);
  });
  
  const categories = Object.keys(imagesByCategory).sort();
  
  return (
    <div className="print:page-break-after">
      <h3 className="text-xl font-semibold mb-4 flex items-center">
        <Image className="h-6 w-6 mr-2" />
        Supporting Images
      </h3>
      
      <div className="mb-6">
        <p className="text-muted-foreground">
          The following images document the existing conditions and systems observed during the site assessment.
          These visual references support the findings and recommendations presented in the report.
        </p>
      </div>
      
      {/* Image Gallery */}
      {categories.map((category) => (
        <div key={category} className="mb-8">
          <h4 className="text-lg font-medium mb-4">{category}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {imagesByCategory[category].map((image) => (
              <Card key={image.id} className="overflow-hidden">
                <div className="relative aspect-video overflow-hidden">
                  <img 
                    src={image.url} 
                    alt={image.title} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardContent className="pt-4">
                  <h5 className="font-medium mb-1">{image.title}</h5>
                  <p className="text-sm text-muted-foreground mb-2">{image.description}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {image.date && <span>Date: {image.date}</span>}
                    {image.location && <span>Location: {image.location}</span>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
      
      {/* Image Placeholder (if no images provided) */}
      {images.length === 0 && (
        <div className="bg-muted/20 border-2 border-dashed border-muted p-8 rounded-md flex flex-col items-center justify-center text-center">
          <Image className="h-12 w-12 text-muted mb-4" />
          <h4 className="text-lg font-medium mb-2">No Images Available</h4>
          <p className="text-muted-foreground max-w-md">
            Supporting images will be displayed here once uploaded. 
            Please contact the audit team for access to the full photographic documentation.
          </p>
        </div>
      )}
      
      {/* Reference Maps and Diagrams */}
      <div className="mt-8 mb-6">
        <h4 className="text-lg font-medium mb-4 flex items-center">
          <Info className="h-5 w-5 mr-2" />
          Maps & Diagrams
        </h4>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div>
                <h5 className="font-medium mb-2">Building Floor Plan</h5>
                <div className="bg-muted/20 border-2 border-dashed border-muted p-8 rounded-md flex items-center justify-center h-64">
                  <p className="text-muted-foreground">Building floor plan diagram would be displayed here</p>
                </div>
              </div>
              
              <div>
                <h5 className="font-medium mb-2">Mechanical System Schematic</h5>
                <div className="bg-muted/20 border-2 border-dashed border-muted p-8 rounded-md flex items-center justify-center h-64">
                  <p className="text-muted-foreground">HVAC and mechanical system schematic would be displayed here</p>
                </div>
              </div>
              
              <div>
                <h5 className="font-medium mb-2">Electrical One-Line Diagram</h5>
                <div className="bg-muted/20 border-2 border-dashed border-muted p-8 rounded-md flex items-center justify-center h-64">
                  <p className="text-muted-foreground">Electrical distribution diagram would be displayed here</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="bg-muted/30 p-4 rounded-lg mb-4">
        <h5 className="font-medium mb-2">Notes on Supporting Images</h5>
        <ul className="space-y-1 text-sm">
          <li>All images were captured during the site assessment conducted on various dates.</li>
          <li>Images are intended to illustrate existing conditions and support audit findings.</li>
          <li>Additional high-resolution images are available upon request.</li>
          <li>Building plans and system diagrams are representative and may not show all details.</li>
        </ul>
      </div>
    </div>
  );
}; 