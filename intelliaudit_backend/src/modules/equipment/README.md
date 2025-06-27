# Equipment Module

This directory contains all equipment-related functionality organized into a modular structure to improve maintainability and clarity.

## Module Structure

The equipment module has been reorganized into the following sub-modules:

### 1. Core (`/core`)
- Basic equipment functionality
- `equipment-prisma.controller.ts`
- `equipment-prisma.service.ts`
- `equipment-prisma.module.ts`
- `equipment.interface.ts`

### 2. Measures (`/measures`)
- Energy conservation measures
- `measures-prisma.controller.ts`
- `measures-prisma.service.ts`
- `measures-prisma.module.ts`
- `measures.controller.ts`

### 3. Enrichment (`/enrichment`)
- Equipment data enrichment
- `enrichment-prisma.controller.ts`
- `enrichment-prisma.service.ts`
- `enrichment-prisma.module.ts`

### 4. Analysis (`/analysis`)
- Equipment analysis functionality
- `equipment-analysis.controller.ts`
- `equipment-analysis.service.ts`
- `field-notes-analysis-prisma.service.ts`
- `photo-analysis-prisma.service.ts`
- DTOs for analysis features

### 5. Utility (`/utility`)
- In-development utilities (not currently imported in main module)
- `equipment-completeness.service.ts`
- `equipment-consolidation.controller.ts`
- `equipment-deduplication.service.ts`
- `manufacturer-data.service.ts`

## Integration

The main `equipment.module.ts` file aggregates all active sub-modules and exposes them to the rest of the application. This provides a single entry point for equipment functionality.

## Usage

To use functionality from this module, import the `EquipmentModule` in your module:

```typescript
import { Module } from '@nestjs/common';
import { EquipmentModule } from './equipment/equipment.module';

@Module({
  imports: [EquipmentModule],
})
export class YourModule {}
```

Then you can inject any of the exported services into your components:

```typescript
import { Injectable } from '@nestjs/common';
import { EquipmentPrismaService } from './equipment/core/equipment-prisma.service';

@Injectable()
export class YourService {
  constructor(private equipmentService: EquipmentPrismaService) {}
  
  // Use equipment service methods
}
```

## Future Development

The `utility` folder contains services that are still in development. Once these are completed and ready for production, they should be:

1. Properly integrated with module exports
2. Moved to appropriate sub-modules or given their own sub-module
3. Added to the main `equipment.module.ts` exports
