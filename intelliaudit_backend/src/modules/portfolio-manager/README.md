# Portfolio Manager Prisma API Documentation

This document provides a comprehensive overview of the Portfolio Manager Prisma API endpoints and methods.

## API Endpoints

### GET `/portfolio-manager-prisma/properties/:id`

**Purpose**: Verify if a Portfolio Manager property ID exists

**Parameters**:
- `id`: Portfolio Manager property ID (path parameter)

**Response**: 
- Success: Property details if found
- Error: 404 Not Found if property doesn't exist

### POST `/portfolio-manager-prisma/properties/:id/setup-project`

**Purpose**: Create or update a project with Portfolio Manager data

**Parameters**:
- `id`: Portfolio Manager property ID (path parameter)
- `projectId`: Project ID (optional, query parameter)

**Request Body**:
```json
{
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD"
}
```

**Response**:
- Success: Project with Portfolio Manager data
- Error: 400 Bad Request if parameters are invalid

## Service Methods

### `getProperty(propertyId: string, projectId?: string)`

**Description**: Get property details from Portfolio Manager or database

**Parameters**:
- `propertyId`: Portfolio Manager property ID
- `projectId`: Project ID (optional)

**Returns**: Property details

### `importAllData(projectId: string, portfolioManagerId: string, startDate: string, endDate: string)`

**Description**: Import property data from Portfolio Manager

**Parameters**:
- `projectId`: Project ID
- `portfolioManagerId`: Portfolio Manager property ID
- `startDate`: Start date for utility data
- `endDate`: End date for utility data

**Returns**: Import result with property data

### `storePropertyData(propertyId: string, propertyData: any, projectId: string)`

**Description**: Store property data in database (private method)

**Parameters**:
- `propertyId`: Portfolio Manager property ID
- `propertyData`: Property data to store
- `projectId`: Project ID

**Returns**: Success or failure

### `fetchPropertyFromApi(propertyId: string)`

**Description**: Fetch property data from Portfolio Manager API (private method)

**Parameters**:
- `propertyId`: Portfolio Manager property ID

**Returns**: Property data

### `makePortfolioManagerApiRequest(endpoint: string, method: string = 'GET', data?: any)`

**Description**: Make an authenticated request to the Portfolio Manager API (private method)

**Parameters**:
- `endpoint`: API endpoint
- `method`: HTTP method
- `data`: Request data (optional)

**Returns**: API response

### `getPortfolioManagerCredentials()`

**Description**: Get Portfolio Manager API credentials (private method)

**Returns**: Username and password

## Authentication

Both implementations use basic authentication to access the Portfolio Manager API:

- **Username**: Stored in the environment variable `PORTFOLIO_MANAGER_USERNAME`
- **Password**: Stored in the environment variable `PORTFOLIO_MANAGER_PASSWORD`

## Database Integration

### Database Access
- Uses Prisma ORM for all database operations
- Provides type-safe queries and transactions

### Data Storage
Property data is stored in the `projects` table with these fields:

```typescript
// Relevant fields from the projects model
projects {
  // Portfolio Manager fields
  pm_id: String?                    // Portfolio Manager property ID
  name: String                      // Property name
  building_address: String          // Property address
  property_city: String?            // Property city
  property_state: String?           // Property state
  property_postal_code: String?     // Property postal code
  property_primary_function: String? // Property primary function
  property_gross_floor_area: Int?   // Property gross floor area
  property_year_built: Int?         // Property year built
  
  // Other project fields not shown
}
```

## Implementation Strategy

The Prisma implementation focuses on essential functionality:

1. Implement only the most critical endpoints needed for the application
2. Use Prisma ORM for all database operations
3. Maintain the same API contract for frontend compatibility

## Known Issues

- Authentication issues with the Portfolio Manager API (401 Unauthorized)
