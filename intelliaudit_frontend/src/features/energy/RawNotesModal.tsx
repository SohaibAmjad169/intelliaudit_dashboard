import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RawNotesModalProps {
  rawNotes: string;
}

export function RawNotesModal({ rawNotes }: RawNotesModalProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          View Raw Notes
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Raw Field Notes</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[60vh] w-full rounded-md border p-4">
          <pre className="whitespace-pre-wrap font-mono text-sm">
            {rawNotes || 'No raw notes available'}
          </pre>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
} 