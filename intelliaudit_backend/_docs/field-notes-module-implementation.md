# Field Notes Module Implementation

## Overview
This document outlines the implementation of a dedicated Field Notes module in the IntelliAudit backend. The module provides API endpoints for creating, retrieving, and managing field notes data for building audits, using a repository pattern for clean separation of concerns.

## Implementation Status
✅ Complete implementation with:
- Module structure using repository pattern
- DTOs for create requests and responses
- Domain model with business logic
- Repository for database operations with transaction support
- Service with AI processing using OpenAI
- REST API controller with POST and GET endpoints
- Test cases for AI prompt and service functionality
- Added to app.module.ts

## Database Schema
Field notes are stored in two tables:
1. **projects** table:
   - `raw_notes` column (string) - Stores the original field notes text
   - Accessed via `prisma.projects.update()` and `prisma.projects.findUnique()`

2. **equipment_analysis** table:
   - Equipment extracted from field notes is stored with `source_type: 'field_notes'`
   - Key columns:
     - `id` (UUID) - Primary key
     - `project_id` (UUID) - Foreign key to projects table
     - `equipment_type` (string) - Type of equipment
     - `manufacturer` (string) - Equipment manufacturer
     - `model` (string) - Model number
     - `category` (string) - Equipment category
     - `quantity` (number) - Number of units
     - `source_type` (string) - Set to 'field_notes'
     - And other equipment-specific properties
   - Accessed via `prisma.equipment_analysis.create()`, `prisma.equipment_analysis.createMany()` and `prisma.equipment_analysis.findMany()`

## Module Structure
```
backend/src/modules/field-notes/
├── controllers/
│   └── field-notes.controller.ts        // API endpoints
├── dto/
│   ├── create-field-notes.dto.ts        // POST request data
│   └── field-notes-response.dto.ts      // API response format
├── models/
│   └── field-notes.model.ts             // Business entity & logic
├── repositories/
│   └── field-notes.repository.ts        // All database operations
├── services/
│   └── field-notes.service.ts           // Orchestration & AI processing
├── tests/
│   ├── field-notes.controller.spec.ts
│   ├── field-notes.repository.spec.ts
│   └── field-notes.service.spec.ts
└── field-notes.module.ts                // Module definition
```

## API Endpoints

### POST /field-notes
Creates and processes new field notes for a project.

**Request:**
```typescript
{
  notes: string;           // The raw field notes text
  projectId: string;       // The UUID of the project
  model?: string;          // Optional: The AI model to use for processing (default: 'gpt-4o-mini')
}
```

**Response:**
```typescript
{
  equipment: Array<{
    id: string;
    equipment_type: string;
    manufacturer?: string;
    model?: string;
    category?: string;
    quantity?: number;
    // Other equipment properties from equipment_analysis table
    source_type: 'field_notes';
  }>;
  flags: Array<{
    type: string;
    message: string;
    severity: 'info' | 'warning' | 'error';
  }>;
  metadata: {
    processedAt: string;
    processingTimeMs: number;
    confidence: number;
  };
}
```

### GET /field-notes/:projectId
Retrieves processed field notes data for a specific project.

**Response:**
```typescript
{
  raw_notes?: string;      // The original field notes text
  equipment: Array<{       // Array of equipment extracted from field notes
    id: string;
    equipment_type: string;
    manufacturer?: string;
    model?: string;
    // Other equipment properties
  }>;
  building_info?: {        // Optional building information extracted from notes
    type?: string;
    total_units?: number;
    floors?: number;
    // Other building info
  };
}
```

## Implementation Details

### Repository Pattern
The module follows the repository pattern to separate concerns:

1. **Repository**: Encapsulates all database operations
   - Saving raw field notes to the projects table
   - Retrieving field notes by project ID
   - Creating and updating equipment records
   - Querying equipment by project ID and source type

2. **Model**: Contains business logic and data transformation
   - Represents the field notes domain entity
   - Handles validation rules
   - Contains methods for data transformation

3. **Service**: Orchestrates the workflow and handles AI processing
   - Coordinates between repository and AI processing
   - Manages OpenAI API interactions
   - Handles preprocessing, batching, and error handling
   - Maps between DTOs, models, and repository entities

### Transaction Support
The repository supports transactions to ensure data consistency:
```typescript
// Example of transaction use in repository
async processFieldNotesTransaction(projectId, notes, equipment, aiModel) {
  return await this.prisma.$transaction(async (tx) => {
    // Save raw notes to projects table
    await tx.projects.update({...});
    
    // Save equipment to equipment_analysis table
    await tx.equipment_analysis.createMany({...});
  });
}
```

### AI Processing Logic
The service handles AI processing with a comprehensive system prompt:
- Identifies all equipment mentioned in field notes
- Extracts technical specifications, operational details, and metadata
- Formats results as structured JSON
- Includes building information when available

## Testing
The implementation includes comprehensive tests:
- Unit tests for the service with mock OpenAI responses
- Tests specifically for the AI prompt structure and content
- Error handling tests

## Database Tables Inspection
To inspect the database tables used by this module:

1. **Using Prisma Studio**:
   ```bash
   npx prisma studio
   ```
   Then browse the `projects` and `equipment_analysis` tables

2. **In the code**:
   - Examine `field-notes.repository.ts` to see all database operations
   - Look for `prisma.projects` and `prisma.equipment_analysis` calls
   - The transaction methods show all tables being modified

3. **Schema definition**:
   - See `backend/prisma/schema.prisma` for table definitions
   - The `projects` model contains the `raw_notes` field
   - The `equipment_analysis` model contains equipment data with `source_type`

## Performance Considerations
- Implementation includes batch processing for large field notes to avoid token limits
- Response caching for frequently accessed projects
- Proper error handling for AI service interruptions
- Transaction support for data integrity 