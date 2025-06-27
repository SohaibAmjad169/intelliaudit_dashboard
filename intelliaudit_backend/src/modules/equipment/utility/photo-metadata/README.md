# Photo Metadata Extraction Module

This module provides functionality for extracting metadata from equipment photos to enhance equipment data quality.

## Overview

The Photo Metadata Extraction module processes equipment photos to extract key information such as:
- Manufacturer names
- Model numbers
- Serial numbers
- Capacity ratings
- Efficiency metrics
- Year of manufacture
- Equipment condition
- Other technical specifications

This data is used to fill gaps in equipment information gathered during field audits.

## Components

### Services

- **PhotoMetadataExtractionService**: Main service for processing photos and extracting metadata
- **PhotoBatchProcessingService**: Handles batch processing of photos for efficient API usage
- **MetadataMatchingService**: Matches extracted metadata to equipment with data gaps

### Models

- **PhotoBatchJob**: Represents a batch job for processing photos
- **PhotoMetadataResult**: Stores metadata extracted from a photo
- **MetadataMatchResult**: Represents a match between extracted metadata and equipment

### Controllers

- **PhotoMetadataController**: Provides API endpoints for photo metadata extraction
- **PhotoBatchController**: Manages batch processing operations

## Integration

This module integrates with the following components:
- Equipment data repository
- Photo storage service
- AI vision model API
- Data quality assessment

## Workflow

1. Photos are submitted for processing in batches
2. AI vision analysis extracts metadata from photos
3. Extracted metadata is matched with equipment needing data
4. Equipment records are updated with the matched data
5. Data quality is reassessed after enrichment

## Usage

```typescript
// Example: Start a batch photo processing job
const batchJob = await photoMetadataService.processBatch(projectId, photoIds);

// Example: Get batch status
const status = await photoMetadataService.getBatchStatus(batchId);

// Example: Apply metadata to equipment
const result = await photoMetadataService.applyMetadata(batchId, matchConfig);
``` 