# Energy Analysis Charts

This directory contains components for visualizing energy usage data in different formats.

## Chart Components

### End-Use Breakdown Charts

We have three main chart components for visualizing energy usage by end-use category:

1. **KwhEndUseChart** - Shows electricity usage breakdown in kWh with a blue color palette
2. **ThermsEndUseChart** - Shows gas usage breakdown in therms with an orange color palette
3. **CombinedKbtuEndUseChart** - Shows combined energy usage (electricity + gas) in kBtu with a purple color palette

All charts follow a consistent design pattern:
- Donut chart visualization
- Legend placed to the right of the chart with percentages
- Custom tooltips with detailed information
- Consistent formatting and unit display

### Dashboard Component

The **EnergyPieChartDashboard** component arranges these charts in a vertical, scrollable layout for easy comparison.

## Component Structure

Each chart component:
- Accepts energy usage data in a standard format
- Processes the data to extract relevant values
- Calculates percentages and applies formatting
- Renders a responsive chart with appropriate styling

## Design Decisions

1. **Chart Height**: Charts are given significant height (400px) to ensure visibility of segments
2. **Legend Placement**: Legends are placed to the right of the chart instead of below to maximize visibility
3. **Inner Radius**: Donut charts are used instead of pie charts for better visual appeal
4. **Sorting**: Data is sorted by value (descending) to make the most significant segments more prominent
5. **Color Schemes**: Consistent color schemes are used across all three charts (blue for electricity, orange for gas, purple for combined)

## Future Improvements

- Add ability to click on segments to see more detailed breakdowns
- Add comparison views for historical data
- Implement toggles for different units (e.g., display kBtu in all charts)
- Add export functionality for chart data 