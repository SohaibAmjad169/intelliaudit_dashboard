# Project Components

This directory contains components related to project management and display in the application.

## Components

- `ProjectView`: Main component for displaying project information and domain-specific views
- `CurrentPhaseActions`: Legacy component that now renders the EnergyView (to be renamed)
- Various form components for project creation and editing

## New Architecture

The project components have been restructured to focus on domains rather than phases:

1. **Domain-Focused**: Projects now directly display domain-specific components (Energy, Water) rather than phase-specific components
2. **Simplified Structure**: The phase-based architecture has been removed in favor of a simpler domain-based approach
3. **Energy-Centric**: Energy is now the primary focus of project views

## Usage

Import project components using:

```tsx
import { ProjectView } from '@/components/features/projects';
```

## Component Interface

The `ProjectView` component accepts the following props:

```tsx
interface ProjectViewProps {
  project: Project | ProjectWithDetails;
}
```

## Integration with Domains

The project components now directly integrate with domain-specific components:

1. `ProjectView` contains `EnergyView` which is the primary view for projects
2. Domain-specific views (Energy, Water) handle their own navigation and content
3. The application flow is now more intuitive, focusing on domains rather than arbitrary phases 