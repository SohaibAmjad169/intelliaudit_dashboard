# Features Organization

This directory contains all feature components of the application, organized by functional area.

## Organization

The features are organized into the following main sections:

- **energy**: Components related to energy reporting, analysis, and equipment
- **water**: Components related to water usage reporting and analysis
- **projects**: Components related to project management
- **dashboard**: Components for the main dashboard views
- **reports**: Components for generating and displaying reports

## Domain-based Organization

The codebase has been reorganized to use a domain-based organization (energy, water, waste, etc.) rather than a phase-based approach. This brings several benefits:

1. **Better Discoverability**: Components are grouped by domain, making it easier to find related functionality
2. **Reduced Duplication**: Domain-specific code is consolidated in one location
3. **Clearer Dependencies**: The dependency relationships between components are more explicit
4. **Easier Maintenance**: Changes to domain-specific logic are localized to a specific directory

## Energy as the Core Domain

The application has been restructured to focus on energy as the core domain. Key components include:

1. **EnergyView**: The main component for displaying energy-related information
2. **EnergyOverview**: Provides an overview of energy usage and costs
3. **Equipment**: Manages building equipment and energy calculations
4. **MonthlyEnergyChartContainer**: Displays monthly energy usage data

## Water Domain

The water domain provides similar functionality for water-related data:

1. **WaterView**: The main component for displaying water-related information
2. **WaterOverview**: Provides an overview of water usage
3. **MonthlyWaterChartContainer**: Displays monthly water usage data

## Domain Structure

Each domain directory includes:
- The component implementation files
- An `index.ts` file that exports the components
- A `README.md` file documenting the components' usage and features 