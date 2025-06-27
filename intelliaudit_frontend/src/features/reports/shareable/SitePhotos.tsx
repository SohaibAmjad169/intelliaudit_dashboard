import React from 'react';
import { Camera, FileSearch, Building } from 'lucide-react';

interface Photo {
  photo_url?: string;
  thumbnail_url?: string;
  equipment_type?: string;
  category?: string;
  notes?: string;
  taken_at?: string;
  taken_by?: string;
}

interface SitePhotosProps {
  photos: Photo[];
  isLoading: boolean;
}

export const SitePhotos: React.FC<SitePhotosProps> = ({ photos, isLoading }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-8">
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
        <Camera className="h-5 w-5 mr-2 text-emerald-500" />
        Site Photos
        <span className="ml-2 px-2 py-1 text-xs font-medium rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-800/20 dark:text-emerald-400">
          {photos.length} photos
        </span>
      </h2>
      
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
        </div>
      ) : photos.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No site photos available for this project.
        </div>
      ) : (
        <div className="space-y-8">
          {/* Equipment Photos */}
          <div>
            <h3 className="text-lg font-medium mb-4 flex items-center">
              <FileSearch className="h-4 w-4 mr-1 text-emerald-500" />
              Equipment Photos
              <span className="ml-2 px-2 py-1 text-xs font-medium rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-800/20 dark:text-emerald-400">
                {photos.filter((photo) => 
                  photo.category === 'hvac' || 
                  photo.category === 'lighting' ||
                  photo.category === 'equipment' ||
                  (photo.equipment_type || '').toLowerCase().includes('hvac') ||
                  (photo.equipment_type || '').toLowerCase().includes('light') ||
                  (photo.equipment_type || '').toLowerCase().includes('equipment') ||
                  (photo.notes || '').toLowerCase().includes('hvac') ||
                  (photo.notes || '').toLowerCase().includes('light') ||
                  (photo.notes || '').toLowerCase().includes('equipment')
                ).length} photos
              </span>
            </h3>
            <div className="space-y-4">
              {photos.filter((photo) => 
                photo.category === 'hvac' || 
                photo.category === 'lighting' ||
                photo.category === 'equipment' ||
                (photo.equipment_type || '').toLowerCase().includes('hvac') ||
                (photo.equipment_type || '').toLowerCase().includes('light') ||
                (photo.equipment_type || '').toLowerCase().includes('equipment') ||
                (photo.notes || '').toLowerCase().includes('hvac') ||
                (photo.notes || '').toLowerCase().includes('light') ||
                (photo.notes || '').toLowerCase().includes('equipment')
              ).map((photo, index) => (
                <div key={index} className="flex gap-4 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="w-32 h-32 flex-shrink-0">
                    <img 
                      src={photo.photo_url || photo.thumbnail_url} 
                      alt={photo.equipment_type || 'Equipment'} 
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                  <div className="flex-grow">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {photo.equipment_type || 'Unspecified Equipment'}
                      </span>
                      {photo.category && (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-800/20 dark:text-emerald-400">
                          {photo.category}
                        </span>
                      )}
                    </div>
                    {photo.notes && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {photo.notes}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                      {photo.taken_at && (
                        <span>Taken: {new Date(photo.taken_at).toLocaleDateString()}</span>
                      )}
                      {photo.taken_by && (
                        <span>By: {photo.taken_by}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Non-Equipment Photos */}
          <div>
            <h3 className="text-lg font-medium mb-4 flex items-center">
              <Building className="h-4 w-4 mr-1 text-emerald-500" />
              Building & Site Photos
              <span className="ml-2 px-2 py-1 text-xs font-medium rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-800/20 dark:text-emerald-400">
                {photos.filter((photo) => 
                  photo.category === 'building' ||
                  photo.category === 'site' ||
                  photo.category === 'envelope' ||
                  !photo.equipment_type ||
                  (photo.notes || '').toLowerCase().includes('building') ||
                  (photo.notes || '').toLowerCase().includes('site') ||
                  (photo.notes || '').toLowerCase().includes('envelope')
                ).length} photos
              </span>
            </h3>
            <div className="space-y-4">
              {photos.filter((photo) => 
                photo.category === 'building' ||
                photo.category === 'site' ||
                photo.category === 'envelope' ||
                !photo.equipment_type ||
                (photo.notes || '').toLowerCase().includes('building') ||
                (photo.notes || '').toLowerCase().includes('site') ||
                (photo.notes || '').toLowerCase().includes('envelope')
              ).map((photo, index) => (
                <div key={index} className="flex gap-4 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="w-32 h-32 flex-shrink-0">
                    <img 
                      src={photo.photo_url || photo.thumbnail_url} 
                      alt={photo.notes || 'Building/Site Photo'} 
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                  <div className="flex-grow">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {photo.notes || 'Building/Site Photo'}
                      </span>
                      {photo.category && (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-800/20 dark:text-emerald-400">
                          {photo.category}
                        </span>
                      )}
                    </div>
                    {photo.notes && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {photo.notes}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                      {photo.taken_at && (
                        <span>Taken: {new Date(photo.taken_at).toLocaleDateString()}</span>
                      )}
                      {photo.taken_by && (
                        <span>By: {photo.taken_by}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 