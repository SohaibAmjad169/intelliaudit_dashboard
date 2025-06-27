# Authentication Module

This module provides authentication for IntelliaAudit using Supabase as the authentication provider.

## Overview

The authentication system integrates Supabase Auth with the NestJS application, providing:
- JWT-based authentication
- User identity verification
- Role-based access control
- Integration with Prisma for data access

## Components

### AuthGuard

The `AuthGuard` is a NestJS guard that:
- Intercepts all incoming requests
- Verifies JWT tokens from request headers
- Connects to Supabase for token validation
- Attaches user information to the request object
- Allows access to protected routes only for authenticated users

The guard allows unauthenticated access only to specific public endpoints:
- `/api/health`
- `/api/docs`

### AuthModule

The `AuthModule` wires everything together:
- Imports the SupabaseModule for access to authentication services
- Provides the AuthGuard for application-wide use
- Exports the AuthGuard so it can be used by other modules

## How It Works

1. Client obtains a JWT from Supabase Auth
2. Client includes the JWT in the Authorization header as a Bearer token
3. AuthGuard extracts and validates the token
4. If valid, the user's info is attached to the request and the request proceeds
5. If invalid, a 401 Unauthorized response is returned

## Usage in Controllers

Access the authenticated user in any controller with:

```typescript
@Controller('example')
export class ExampleController {
  @Get()
  someRoute(@Req() request) {
    const user = request.user;
    // user.id - The Supabase user ID
    // user.email - The user's email
    // user.role - The user's role (from user_metadata)
    
    // Use with Prisma
    return this.prismaService.someModel.findMany({
      where: {
        userId: user.id
      }
    });
  }
}
```

## Example: Protecting a Route

```typescript
@Controller('protected')
export class ProtectedController {
  constructor(private prismaService: PrismaService) {}
  
  @Get()
  @UseGuards(AuthGuard) // Can also be applied at controller level
  getProtectedData(@Req() request) {
    const userId = request.user.id;
    
    return this.prismaService.userRecords.findMany({
      where: {
        userId
      }
    });
  }
}
```

## Configuration

The authentication system relies on the Supabase configuration in the SupabaseService. Ensure your `.env` file contains:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-key
```
