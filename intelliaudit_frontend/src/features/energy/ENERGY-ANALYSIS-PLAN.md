# Energy Analysis Page Implementation Plan

## Overview
Create a dedicated Energy Analysis page that presents field notes processing results with the same level of detail and insights as Ryan's manual analysis. The page will display energy breakdowns, equipment details, building information, and allow for manual adjustments.

## Design Principles
- Follow existing theme guidelines with clean, modern UI
- Create modular components for easy integration into project details page
- Provide both visualization and tabular data views
- Support manual adjustments and calibration against utility bills
- Present detailed assumptions and methodology

## Component Structure

### 1. EnergyAnalysisPage
- Top-level container component
- Handles data fetching and state management
- Route: `/projects/:projectId/energy-analysis`

### 2. BuildingInformationCard
- Displays building metadata from field notes
- Shows unit type breakdown (2BR, 1BR, studios)
- Displays occupancy assumptions

### 3. EnergyBreakdownSection
- Enhanced version of existing breakdown dialog
- Multi-view tabs (chart, table, comparison)
- Categories aligned with Ryan's analysis
- Manual adjustment controls
- Calibration against utility bills

### 4. EquipmentCategoriesTable
- Detailed breakdown of equipment by category
- Shows counts, wattages, and annual energy usage
- Supports filtering and grouping
- Multiplier visualization

### 5. AssumptionsPanel
- Displays calculation assumptions
- Shows operation hours by equipment type
- Indicates data sources (measured, estimated)
- Notes any special adjustments

### 6. UtilityComparisonCard
- Compares estimated vs. actual consumption
- Shows variance and adjustment factor
- Historical trends visualization

## Implementation Phases

### Phase 1: Basic Structure and Mock Data
- Create page layout and routing
- Implement core UI components with mock data
- Set up state management structure

### Phase 2: Enhanced Visualization
- Implement detailed energy breakdown charts
- Create equipment tables with filtering
- Add comparison views

### Phase 3: Adjustment Controls
- Add manual adjustment interface
- Implement calibration against utility bills
- Create assumptions panel

### Phase 4: Backend Integration
- Connect to field notes API
- Implement data transformations
- Handle loading and error states

### Phase 5: Modularity & Integration
- Refactor for reusability
- Prepare for project details page integration
- Add export and reporting options

## Data Model

```typescript
interface EnergyAnalysisData {
  buildingInfo: {
    totalUnits: number;
    unitTypes: {
      twoBedroom: number;
      oneBedroom: number;
      studio: number;
    };
    occupancyRate: number;
  };
  equipment: EquipmentItem[];
  energyBreakdown: {
    categories: {
      [category: string]: {
        kWh: number;
        percentage: number;
        adjustmentFactor: number;
      }
    };
    total: {
      estimated: number;
      actual: number;
      difference: number;
      differencePercentage: number;
    }
  };
  assumptions: {
    [key: string]: {
      value: string | number;
      source: 'measured' | 'estimated' | 'calculated';
    }
  };
}
```

## Technical Considerations
- Use React hooks for state management
- Recharts for data visualization
- Shadcn UI components for consistency
- Responsive design for all screen sizes
- Performance optimization for large datasets 