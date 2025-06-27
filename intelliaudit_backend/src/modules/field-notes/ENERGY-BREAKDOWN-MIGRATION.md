# Energy Breakdown Implementation Plan

## Overview

This document outlines the implementation plan for adding energy breakdown functionality to the field notes module. The energy breakdown feature allows for analyzing equipment energy usage by end-use category and storing this analysis for later retrieval.

## Database Changes

1. **New Table**: `energy_breakdown`
   - Stores energy breakdown data associated with a project
   - Contains serialized JSON of the breakdown components and totals
   - Includes metadata like the AI model used and timestamps
   - Tracks totals for different energy types (electric, gas, steam, other)

## API Changes

1. **New Endpoint**: `GET /field-notes/:projectId/energy-breakdown`
   - Returns energy breakdown for a project
   - Either retrieves saved breakdown or generates a new one

2. **Updated Endpoint**: `POST /field-notes`
   - Automatically generates and saves energy breakdown when processing field notes

## Data Model Changes

1. **New DTOs**:
   - `EndUseComponentDto`: Represents a single component in the energy breakdown
   - `EnergyBreakdownDto`: Represents the complete energy breakdown
   - `SaveEnergyBreakdownDto`: Used for saving energy breakdown to the database

## Implementation Components

1. **Repository Layer**:
   - `EnergyBreakdownRepository`: Handles database operations for energy breakdown data

2. **Service Layer**:
   - `EnergyBreakdownService`: Handles generating and retrieving energy breakdown data
   - Updated to save breakdown data automatically

3. **Controller Layer**:
   - Updated `FieldNotesController` to include energy breakdown endpoint
   - Modified to generate and save breakdown when processing field notes

## Migration Steps

1. **Database Migration**:
   - Run the migration script to create the `energy_breakdown` table
   ```
   npx prisma migrate dev --name add_energy_breakdown
   ```

2. **Deployment**:
   - Deploy updated backend services with new energy breakdown functionality
   - Update API documentation to include new endpoints

3. **Backfill Data**:
   - Run a script to generate energy breakdown data for existing projects
   ```typescript
   // Example backfill script
   async function backfillEnergyBreakdownData() {
     const projects = await prisma.projects.findMany();
     
     for (const project of projects) {
       const fieldNotes = await fieldNotesService.getFieldNotes(project.id);
       
       if (fieldNotes?.equipment?.length > 0) {
         await energyBreakdownService.generateAndSaveEnergyBreakdown(
           project.id,
           fieldNotes.equipment,
           130000, // Default electric
           550,    // Default gas
           'backfill',
           0, // Steam
           0, // Other
           project.building_type || 'unknown'
         );
         
         console.log(`Generated energy breakdown for project ${project.id}`);
       }
     }
   }
   ```

## Testing Plan

1. **Unit Tests**:
   - Test `EnergyBreakdownService` methods for generating breakdowns
   - Test `EnergyBreakdownRepository` for saving and retrieving data

2. **Integration Tests**:
   - Test the API endpoints for retrieving energy breakdown data
   - Test automatic generation of breakdown data when processing field notes

3. **Manual Testing**:
   - Verify breakdown data visualizations match expected values
   - Check accuracy of energy usage calculations for different building types

## Future Enhancements

1. **Real Utility Data Integration**:
   - Use actual utility data from the project instead of defaults
   - Implement calibration against historical billing data

2. **Enhanced Visualization**:
   - Add comparison views for before/after scenarios
   - Implement cost savings calculations based on efficiency improvements

3. **Machine Learning Improvements**:
   - Train models on actual energy usage data to improve breakdown accuracy
   - Implement anomaly detection for unusual energy usage patterns 