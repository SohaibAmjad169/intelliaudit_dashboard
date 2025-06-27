# Energy Field Notes Processor

This directory contains components for processing field notes related to energy equipment and calculations.

## Components

- `FieldNotesProcessor`: Component for processing field notes to extract equipment information and perform energy analysis

## Usage

Import the field notes processor using:

```tsx
import { FieldNotesProcessor } from '@/components/features/energy/field-notes';
```

## Component Interface

The `FieldNotesProcessor` component accepts the following props:

```tsx
interface FieldNotesProcessorProps {
  projectId: string;
  onSuccess?: () => void;
}
```

- `projectId`: Required ID of the project to associate the field notes with
- `onSuccess`: Optional callback function to call when field notes are successfully processed

## Features

The field notes processor provides:

1. Text input for entering field notes
2. AI-powered extraction of equipment from field notes
3. Energy usage analysis based on extracted equipment
4. Visualization of energy end-use breakdown
5. Recommendations for energy efficiency improvements 