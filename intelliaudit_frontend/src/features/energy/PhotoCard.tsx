import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Photo } from '@/types/eco';
// Import removed: ImageIcon is not used

interface PhotoCardProps {
  photo: Photo;
  onClick: () => void;
}

export const PhotoCard: React.FC<PhotoCardProps> = ({ photo, onClick }) => {
  return (
    <div 
      className="relative overflow-hidden rounded-md border border-slate-200 dark:border-slate-700 aspect-square group cursor-pointer"
      onClick={onClick}
    >
      <img 
        src={photo.url} 
        alt={photo.caption || "Site inspection photo"} 
        className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          console.error(`Failed to load image: ${target.src}`);
          target.src = 'https://via.placeholder.com/400x400?text=Image+Not+Available';
          target.onerror = null; // Prevent infinite fallback loop
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="absolute bottom-3 right-3 bg-white/90 dark:bg-gray-800/90 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md">
        <span className="sr-only">View full size</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>
      </div>
      {photo.category && (
        <Badge className="absolute top-3 right-3 bg-emerald-600/90 text-white px-2 py-0.5 text-xs font-medium shadow-sm">
          {photo.category}
        </Badge>
      )}
    </div>
  );
}; 