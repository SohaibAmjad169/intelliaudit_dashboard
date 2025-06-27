import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogPortal,
  DialogOverlay,
  DialogTitle,
  DialogDescription
} from "../../../components/ui/dialog";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  description?: string;
}

export function Modal({ isOpen, onClose, children, title, description }: ModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogPortal>
        <DialogOverlay className="bg-black/60 backdrop-blur-sm" />
        <DialogContent 
          className="w-full max-w-lg p-0 border-none"
          onEscapeKeyDown={onClose}
          onInteractOutside={onClose}
        >
          {title && (
            <DialogTitle className="px-6 py-4 border-b text-lg font-semibold">
              {title}
            </DialogTitle>
          )}
          {description && (
            <DialogDescription className="px-6 pt-4 text-sm text-muted-foreground">
              {description}
            </DialogDescription>
          )}
          {children}
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
