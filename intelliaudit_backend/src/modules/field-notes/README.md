# Field Notes Module - Energy Breakdown

## Overview

The Field Notes module processes field notes from site visits to extract equipment information and generate energy usage analysis. The Energy Breakdown feature analyzes equipment energy usage by end-use category and provides a comprehensive breakdown of a building's energy consumption.

## Features

- **Field Notes Processing**: Extract structured equipment data from unstructured field notes
- **Energy Breakdown**: Generate energy usage breakdowns by end-use category
- **Automatic Storage**: Save energy breakdown data for later retrieval
- **API Endpoints**: Access field notes and energy breakdown data through REST API

## API Endpoints

- `POST /field-notes`: Process field notes to extract equipment information
  - Automatically generates and saves energy breakdown data
  
- `GET /field-notes/:projectId`: Get field notes data for a project
  - Returns structured equipment data and building information
  
- `GET /field-notes/:projectId/energy-breakdown`: Get energy breakdown for a project
  - Returns energy usage breakdown by end-use category
  - Retrieves saved breakdown or generates a new one on-the-fly

## Data Flow

1. **Field Notes Submission**:
   - User submits field notes via the API
   - Notes are processed to extract equipment data
   - Energy breakdown is automatically generated and saved

2. **Energy Breakdown Retrieval**:
   - Frontend requests energy breakdown data via API
   - Backend retrieves saved breakdown or generates a new one
   - Data is returned in a standardized format for visualization

## Implementation Details

### Database Schema

The energy breakdown data is stored in the `energy_breakdown` table:

```sql
CREATE TABLE "energy_breakdown" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "project_id" UUID NOT NULL,
  "breakdown_data" JSONB NOT NULL,
  "model_used" VARCHAR(50),
  "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
  "total_electric_kwh" DECIMAL(15,2),
  "total_gas_therms" DECIMAL(15,2),
  "total_steam_mmbtu" DECIMAL(15,2),
  "total_other_mmbtu" DECIMAL(15,2),
  ...
);
```

### Key Components

- **EnergyBreakdownService**: Handles generating and retrieving energy breakdown data
- **EnergyBreakdownRepository**: Manages database operations for energy breakdown data
- **DTOs**: Provide standardized data structures for API responses

## Installation and Setup

1. **Database Migration**:
   ```bash
   npx prisma migrate dev --name add_energy_breakdown
   ```

2. **Update Dependencies**:
   ```bash
   npm install
   ```

3. **Build and Start**:
   ```bash
   npm run build
   npm run start
   ```

## Usage Examples

### Generate Energy Breakdown

```typescript
// Generate and save energy breakdown for a project
const breakdown = await energyBreakdownService.generateAndSaveEnergyBreakdown(
  projectId,
  equipmentData,
  totalElectricKwh,
  totalGasTherms,
  'claude-3-opus',
  0, // Steam
  0, // Other
  buildingType
);
```

### Retrieve Energy Breakdown

```typescript
// Get energy breakdown for a project
const breakdown = await energyBreakdownService.getEnergyBreakdown(projectId);

// Example response structure
{
  "endUseComponents": [
    {
      "name": "Lighting",
      "electricPercent": 24,
      "gasPercent": 0,
      "electricKwh": 31084,
      "gasTherms": 0,
      // ...
    },
    // ... more components
  ],
  "totalActualElectric": 129517,
  "totalActualGas": 552,
  "totalActualSteam": 0,
  "totalActualOther": 0
}
```

## Next Steps

See the `ENERGY-BREAKDOWN-MIGRATION.md` file for details on the migration plan and future enhancements. 