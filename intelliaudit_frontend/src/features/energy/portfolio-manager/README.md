# Portfolio Manager Integration Components

This directory contains components for integrating with the ENERGY STAR Portfolio Manager API.

## Components

- `PortfolioManagerForm`: Component for connecting to and retrieving data from ENERGY STAR Portfolio Manager

## Usage

Import the Portfolio Manager form using:

```tsx
import { PortfolioManagerForm } from '@/components/features/energy/portfolio-manager';
```

## Component Interface

The `PortfolioManagerForm` component accepts the following props:

```tsx
interface PortfolioManagerFormProps {
  projectId: string;
  portfolioManagerId?: string;
  onDataLoaded?: (isComplete: boolean, metadata?: any) => void;
}
```

- `projectId`: Required ID of the project to associate the Portfolio Manager data with
- `portfolioManagerId`: Optional existing Portfolio Manager property ID
- `onDataLoaded`: Optional callback function called when data is successfully loaded

## Features

The Portfolio Manager integration provides:

1. Connection to ENERGY STAR Portfolio Manager
2. Import of property data including building characteristics
3. Import of meter data for various utility types
4. Import of utility bill data for electric, gas, and water
5. Rolling average calculations for utility usage
6. Visual display of property and utility information 