import { Toaster as SonnerToaster } from "../../../components/ui/sonner";
import { toast as sonnerToast } from "sonner";

export const ToastProvider = () => {
  return <SonnerToaster />;
};

type ToastOptions = {
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
};

export const toast = {
  success: (title: string, options?: ToastOptions) => {
    sonnerToast.success(title, {
      description: options?.description,
      duration: options?.duration || 5000,
      action: options?.action,
    });
  },
  error: (title: string, options?: ToastOptions) => {
    sonnerToast.error(title, {
      description: options?.description,
      duration: options?.duration || 5000,
      action: options?.action,
    });
  },
  warning: (title: string, options?: ToastOptions) => {
    sonnerToast.warning(title, {
      description: options?.description,
      duration: options?.duration || 5000,
      action: options?.action,
    });
  },
  info: (title: string, options?: ToastOptions) => {
    sonnerToast.info(title, {
      description: options?.description,
      duration: options?.duration || 5000,
      action: options?.action,
    });
  },
  promise: <T,>(
    promise: Promise<T>,
    {
      loading,
      success,
      error,
    }: {
      loading: string;
      success: (data: T) => string;
      error: (error: unknown) => string;
    }
  ) => {
    return sonnerToast.promise(promise, {
      loading,
      success,
      error,
    });
  },
}; 