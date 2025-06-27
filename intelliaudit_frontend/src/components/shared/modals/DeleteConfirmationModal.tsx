import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from '../actions/Button';
import { cn } from '@/utils';

export interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  isDeleting?: boolean;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message = 'Are you sure you want to delete this item? This action cannot be undone.',
  confirmText = 'Delete',
  cancelText = 'Cancel',
  isDeleting = false
}) => {
  const handleClose = () => {
    onClose();
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose}
      title={title}
      description={message}
    >
      <div className="p-6">
        <div className="sm:flex sm:items-start">
          <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
        </div>
        <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
          <Button
            variant="destructive"
            onClick={onConfirm}
            isLoading={isDeleting}
            className={cn(
              "sm:ml-3 sm:w-auto"
            )}
          >
            {isDeleting ? 'Deleting...' : confirmText}
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
            className="mt-3 sm:mt-0 sm:w-auto"
          >
            {cancelText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};