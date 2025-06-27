import { useState } from 'react';
import { Copy, Check, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';

interface ShareReportButtonProps {
  projectId: string;
}

export function ShareReportButton({ projectId }: ShareReportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Generate the shareable URL
  const shareableUrl = `${window.location.origin}/reports/share/${projectId}`;
  
  // Handle copy to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareableUrl);
      setCopied(true);
      toast({
        title: "Link copied",
        description: "The shareable report link has been copied to your clipboard.",
      });
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy the link to your clipboard. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Open the report in a new tab
  const openReport = () => {
    window.open(shareableUrl, '_blank');
  };

  return (
    <>
      <Button 
        variant="outline" 
        size="sm" 
        className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 hover:border-emerald-300 dark:hover:border-emerald-700 text-emerald-700 dark:text-emerald-300 transition-all duration-200 shadow-sm hover:shadow"
        onClick={() => setIsOpen(true)}
      >
        <img 
          src="https://testwebsite.bravuratechnologies.com/wp-content/uploads/2023/07/ASHRAE-Logo.webp" 
          alt="ASHRAE Logo" 
          className="h-4 w-auto"
        />
        <span>ASHRAE Report</span>
      </Button>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share ASHRAE Level II Energy Audit Report</DialogTitle>
          </DialogHeader>
          
          <div className="flex items-center space-x-2 mt-4">
            <div className="grid flex-1 gap-2">
              <Input
                readOnly
                value={shareableUrl}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                This link provides access to a read-only version of the ASHRAE Level II energy audit report.
              </p>
            </div>
            <Button 
              size="sm" 
              variant="outline" 
              className="px-3"
              onClick={copyToClipboard}
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              <span className="sr-only">Copy</span>
            </Button>
          </div>
          
          <DialogFooter className="sm:justify-start mt-4">
            <Button
              variant="default"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={openReport}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Report
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
