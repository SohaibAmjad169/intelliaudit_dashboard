# Photo Analysis Queue API Documentation

This document outlines the API endpoints available for the photo analysis queue system, which uses BullMQ for asynchronous processing of equipment photos.

## Overview

The photo analysis system has been optimized using BullMQ to handle asynchronous processing of equipment photos. This provides several benefits:

- **Asynchronous processing**: API responses are immediate, with processing happening in the background
- **Controlled concurrency**: Worker processes 5 jobs at a time to avoid overwhelming external APIs
- **Resilience**: Automatic retries for failed jobs with exponential backoff
- **Monitoring**: Detailed status tracking for each photo analysis job
- **Improved error isolation**: Each file is processed independently

## Endpoints

All endpoints are prefixed with `/api/equipment/photo-analysis`.

### Get All Jobs

```
GET /api/equipment/photo-analysis/jobs
```

Returns information about all photo analysis jobs across all projects.

**Response:**

```json
{
  "counts": {
    "waiting": 0,
    "active": 2,
    "completed": 5,
    "failed": 1,
    "total": 8
  },
  "jobs": {
    "waiting": [
      {
        "id": "1",
        "projectId": "project-123",
        "filename": "example.jpg",
        "timestamp": 1714414414231
      }
    ],
    "active": [
      {
        "id": "2",
        "projectId": "project-123",
        "filename": "example2.jpg",
        "timestamp": 1714414414235
      }
    ],
    "completed": [
      {
        "id": "3",
        "projectId": "project-123",
        "filename": "example3.jpg",
        "timestamp": 1714414414240,
        "finishedOn": 1714414424240,
        "success": true
      }
    ],
    "failed": [
      {
        "id": "4",
        "projectId": "project-123",
        "filename": "example4.jpg",
        "timestamp": 1714414414250,
        "failedReason": "Error processing image: invalid format"
      }
    ]
  }
}
```

### Get Project-Specific Jobs

```
GET /api/equipment/photo-analysis/project/:projectId/jobs
```

Returns information about photo analysis jobs for a specific project.

**Parameters:**

- `projectId`: UUID of the project

**Response:**

Similar to the response for all jobs, but filtered to include only jobs for the specified project.

### Get Job Status

```
GET /api/equipment/photo-analysis/jobs/:jobId
```

Returns detailed information about a specific job.

**Parameters:**

- `jobId`: ID of the job to retrieve

**Response:**

```json
{
  "id": "3",
  "state": "completed",
  "progress": 100,
  "attempts": 1,
  "timestamp": 1714414414240,
  "processedOn": 1714414414245,
  "finishedOn": 1714414424240,
  "returnvalue": {
    "success": true,
    "analysis": {
      "id": "48c5d174-0f68-4988-bdda-a58586b990ee",
      "projectId": "0786c71c-56ac-42a4-8426-128b706f9c4b",
      "photoUrl": "https://example.com/storage/photo.jpg",
      "photoFilename": "example.jpg",
      "equipment_type": "HVAC Unit",
      "category": "HVAC",
      "specifications": {
        "capacity": "2 tons",
        "efficiency": "16 SEER"
      }
      // Additional analysis data
    }
  },
  "failedReason": null,
  "data": {
    "projectId": "0786c71c-56ac-42a4-8426-128b706f9c4b",
    "filename": "example.jpg",
    "model": "gpt-4o"
  }
}
```

## Integration with Equipment Processing

### Photo Upload Process

When uploading photos through the equipment controller's photo upload endpoint, the following happens:

1. Photos are received and processed (ZIP files are extracted if needed)
2. Each photo is added as a separate job to the BullMQ queue
3. The API immediately returns with job IDs for tracking
4. The BullMQ worker processes jobs in the background with controlled concurrency
5. Photos are analyzed using the OpenAI API
6. Results are stored in the database
7. Job status is updated in the queue

### Job States

Jobs can be in one of the following states:

- **waiting**: Job is waiting to be processed
- **active**: Job is currently being processed
- **completed**: Job has been successfully processed
- **failed**: Job has failed processing (may be retried automatically)

### Error Handling

The system includes robust error handling:

- Automatic retries for failed jobs (up to 3 attempts with exponential backoff)
- Failed jobs are preserved in the queue for later inspection
- Each job contains detailed error information if it fails

## Technical Implementation

The photo analysis queue system is implemented using:

- **BullMQ**: For queue management and job processing
- **Redis**: As the backend for BullMQ
- **NestJS**: For API endpoints and service management

Configuration options are available in environment variables:

- `REDIS_HOST`: Redis server host (default: localhost)
- `REDIS_PORT`: Redis server port (default: 6379)
- `REDIS_PASSWORD`: Redis server password (if required)

## Workers

The system uses a worker with a concurrency of 5, meaning it can process up to 5 photos simultaneously. This helps control the load on external APIs and system resources while still providing efficient throughput.
