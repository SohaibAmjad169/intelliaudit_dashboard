import React, { useState } from 'react';
import { X } from 'lucide-react';
import {
  Dialog,
  DialogContent
} from '@/components/ui/dialog';

interface Image {
  src: string;
  alt: string;
  metadata?: Record<string, string | number>;
}

interface ImageGalleryProps {
  images: Image[];
  className?: string;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({ images, className }) => {
  const [selectedImage, setSelectedImage] = useState<Image | null>(null);
  const [open, setOpen] = useState(false);

  const handleOpenImage = (image: Image) => {
    setSelectedImage(image);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    // Reset selected image after dialog animation completes
    setTimeout(() => setSelectedImage(null), 300);
  };

  if (!images || images.length === 0) {
    return null;
  }

  return (
    <>
      <div className={className} onClick={() => handleOpenImage(images[0])}>
        <img
          src={images[0].src}
          alt={images[0].alt}
          className="cursor-pointer hover:opacity-90 transition-opacity"
        />
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden" onInteractOutside={handleClose}>
          {selectedImage && (
            <div className="relative">
              <button
                onClick={handleClose}
                className="absolute top-2 right-2 p-1 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>

              <img
                src={selectedImage.src}
                alt={selectedImage.alt}
                className="w-full h-auto"
              />

              {selectedImage.metadata && (
                <div className="mt-4 p-4 bg-accent rounded-lg">
                  <h3 className="text-lg font-semibold mb-2">Image Details</h3>
                  <dl className="grid grid-cols-2 gap-2">
                    {Object.entries(selectedImage.metadata).map(([key, value]) => (
                      <React.Fragment key={key}>
                        <dt className="font-medium text-muted-foreground">{key}</dt>
                        <dd>{value}</dd>
                      </React.Fragment>
                    ))}
                  </dl>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
