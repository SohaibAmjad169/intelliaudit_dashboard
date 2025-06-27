# Storage Module

## Overview
The Storage Module provides a clean abstraction layer for file storage operations using Supabase as the underlying storage provider. It offers a standardized API for file uploads, downloads, listings, and deletions while handling all the Supabase-specific implementation details.

## Components

### `StorageModule`
A NestJS module that exports the Storage Service and imports the required Supabase module.

### `StorageService`
The core service providing file storage operations:

- **File Upload**: Upload files with configurable paths, buckets, and content types
- **File Download**: Retrieve files from storage with public URL generation
- **File Listing**: List files within a bucket and path with metadata
- **File Deletion**: Remove files from storage
- **Bucket Management**: Create, check, and manage storage buckets

### `StorageController`
Exposes RESTful endpoints for file operations:

- `POST /storage/upload` - Upload files
- `GET /storage/files` - List files in a bucket
- `GET /storage/files/:filename` - Get file metadata
- `GET /storage/download/:filename` - Download a file
- `DELETE /storage/files/:filename` - Delete a file

### `FileMetadata` and `FileUpload` Entities
Data transfer objects for file metadata and upload operations.

## Usage Examples

### Uploading a File
```typescript
// Inject the service
constructor(private readonly storageService: StorageService) {}

// Upload a file
const fileMetadata = await this.storageService.uploadFile(file, {
  bucket: 'equipment-photos',
  path: 'project-123/',
  contentType: 'image/jpeg'
});
```

### Downloading a File
```typescript
const fileData = await this.storageService.downloadFile(filename, bucket);
```

### Getting a Public URL
```typescript
const publicUrl = await this.storageService.getPublicUrl(filename, bucket);
```

### Listing Files
```typescript
const files = await this.storageService.listFiles(bucket, path);
```

### Deleting a File
```typescript
await this.storageService.deleteFile(filename, bucket);
```

## Configuration
The service uses the Supabase client from the SupabaseService for all storage operations. No additional configuration is required if the Supabase module is properly configured.

## Storage Buckets
The application uses the following Supabase storage buckets:

- `equipment-photos` - Default bucket, used for equipment and device photos
- `building-images` - Used for storing building and property images
- `profiles` - Used for user profile photos and related assets
- `assets` - Used for general application assets and resources

## Default Values
- Default bucket: `equipment-photos`
- Default cache control: `3600` (1 hour)
- Files are stored with a UUID-based naming scheme to prevent collisions

## Error Handling
The service provides comprehensive error handling and logging for all storage operations, with appropriate HTTP exceptions thrown for client-facing errors.

## Notes
- This module is used by the Equipment and Reports modules for storing and retrieving images and documents
- All endpoints require authentication via the standard authentication mechanisms
- Large file uploads are supported but may be subject to Supabase storage limits
