# Energy Section Components

This directory contains all components related to energy reporting and analysis in the application.

## Organization

The energy section is organized into the following subdirectories:

- **equipment**: Components for managing building equipment and energy calculations
- **field-notes**: Components for processing field notes related to energy usage
- **portfolio-manager**: Components for integration with ENERGY STAR Portfolio Manager

## Main Components

- `EnergyOverview.tsx`: The main component displayed on the energy dashboard tab
- `EnergyView.tsx`: Container component that manages the energy reporting view
- `EndUseBreakdownChart.tsx`: Visualization of energy end use by category
- `MonthlyEnergyChartContainer.tsx`: Container for monthly energy usage charts

## Usage

Import components from the energy section using:

```tsx
import { EnergyOverview, EnergyView } from '@/components/features/energy';
```

Or import from specific subdirectories:

```tsx
import { EquipmentTable } from '@/components/features/energy/equipment';
``` 