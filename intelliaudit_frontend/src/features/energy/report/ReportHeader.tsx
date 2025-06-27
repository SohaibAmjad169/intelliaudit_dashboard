import React from 'react';
import { FileText, Download, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

interface ReportHeaderProps {
  title: string;
  onPrint: () => void;
  onDownloadPdf: () => void;
  generatingPdf: boolean;
}

export const ReportHeader: React.FC<ReportHeaderProps> = ({
  title,
  onPrint,
  onDownloadPdf,
  generatingPdf
}) => {
  return (
    <div className="flex items-center justify-between mb-6 print:mb-8">
      <h1 className="text-2xl font-bold flex items-center">
        <FileText className="mr-2 h-6 w-6" />
        {title}
      </h1>
      
      <div className="flex space-x-2 print:hidden">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onPrint}
          className="flex items-center"
        >
          <Printer className="h-4 w-4 mr-1" />
          Print
        </Button>
        
        <Button 
          size="sm" 
          onClick={onDownloadPdf}
          disabled={generatingPdf}
          className="flex items-center"
        >
          {generatingPdf ? (
            <>
              <Spinner className="h-4 w-4 mr-1" />
              Generating...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-1" />
              Download PDF
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
