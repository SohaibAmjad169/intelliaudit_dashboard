import { Button } from '@/components/ui/button';
import { FileText, Upload } from 'lucide-react';

interface ActionButtonsProps {
  onShowFieldNotes: () => void;
  onShowPhotoUpload: () => void;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  onShowFieldNotes,
  onShowPhotoUpload
}) => {
  return (
    <div className="flex space-x-4">
      <Button 
        variant="outline"
        size="sm"
        onClick={onShowFieldNotes}
        className="h-8 bg-blue-600/20 text-blue-400 border-blue-500/30 hover:bg-blue-600/30"
      >
        <FileText className="h-4 w-4 mr-1" />
        Upload Field Notes
      </Button>
      
      <Button 
        variant="outline"
        size="sm"
        onClick={onShowPhotoUpload}
        className="h-8"
      >
        <Upload className="h-4 w-4 mr-1" />
        Upload Photos
      </Button>
    </div>
  );
}; 