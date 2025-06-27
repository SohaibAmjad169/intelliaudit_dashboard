import { ClipboardList } from 'lucide-react';
import { Box } from '@/components/ui/box';

export const Header: React.FC = () => {
  return (
    <Box className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <ClipboardList className="w-8 h-8 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">Equipment List</h2>
            <p className="text-muted-foreground">
              Comprehensive equipment inventory for your energy audit project.
            </p>
          </div>
        </div>
      </div>
    </Box>
  );
}; 