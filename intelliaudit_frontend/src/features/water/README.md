# Water Section Components

This directory contains all components related to water usage reporting and analysis in the application.

## Organization

The water section is organized into the following structure:

- `WaterOverview.tsx`: The main component displayed on the water dashboard tab
- `WaterView.tsx`: Container component that manages the water reporting view
- `MonthlyWaterChartContainer.tsx`: Container for monthly water usage charts

## Usage

Import components from the water section using:

```tsx
import { WaterOverview, WaterView } from '@/components/features/water';
```

## Future Expansion

As the water section grows, consider organizing components into subdirectories:

- **field-notes**: For processing field notes related to water usage
- **fixtures**: For managing water fixtures and usage calculations
- **costs**: For water costs analysis and reporting 