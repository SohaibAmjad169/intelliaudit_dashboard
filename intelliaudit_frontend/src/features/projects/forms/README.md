# Project Forms

This directory contains form components used for creating and editing projects in the IntelliAudit application.

## Components

### ProjectModal.tsx

The `ProjectModal` component is a comprehensive form modal for creating and editing projects. It includes:

- Integration with Portfolio Manager API for property verification
- Form fields for project details (name, address, type, etc.)
- Validation for required fields
- Support for both creation and editing modes

#### API Integration

The component makes direct API calls using the `apiClient` utility rather than using custom hooks. It interacts with the following backend endpoints:

- `portfolio-manager-prisma/properties/{id}` - Verifies and fetches property details from Portfolio Manager
- `projects` - Creates or updates project information

Example of direct API call in the `verifyPortfolioManagerId` function:

```typescript
const endpoint = getEndpoint(`portfolio-manager-prisma/properties/${portfolioManagerId}`);
const response = await apiClient.get<PortfolioManagerResponse>(endpoint);
```

#### Key Features

- Portfolio Manager ID verification
- Dynamic form field updates based on API responses
- Error handling for API failures
- Responsive design for various screen sizes

### ProjectForm.tsx

The `ProjectForm` component is a simpler form implementation used for basic project information editing. It:

- Provides form fields for project details
- Handles validation
- Can be embedded in other components

#### Usage

This component is typically used within other components or pages that need to edit project information without the full modal experience.

## Integration with Backend

These form components are designed to work with the Prisma-based backend services. The migration from Supabase to Prisma has been completed, and all API calls now use the Prisma endpoints.

### Response Format Handling

The components are designed to handle both new and legacy response formats:

```typescript
// New format
{
  success: true,
  data: {
    id: "123",
    name: "Building Name",
    // other properties...
  }
}

// Legacy format
{
  success: true,
  property: {
    id: "123",
    name: "Building Name",
    // other properties...
  }
}
```

## Development Notes

When making changes to these components:

1. Ensure backward compatibility with existing API response formats
2. Test both creation and editing workflows
3. Verify Portfolio Manager integration is working correctly
4. Check for proper error handling and user feedback

## Related Files

- `index.ts` - Exports the form components for use in other parts of the application
