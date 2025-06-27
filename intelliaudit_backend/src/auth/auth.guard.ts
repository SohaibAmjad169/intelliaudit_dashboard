import { Injectable, CanActivate, ExecutionContext, Logger, UnauthorizedException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(
    private readonly supabaseService: SupabaseService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const path = request.path;
    
    // Skip auth for specific public endpoints if needed
    if (
      path === '/api/health' || 
      path === '/api/docs' || 
      path.startsWith('/api/docs/')
    ) {
      return true;
    }
    
    // Extract the token from the Authorization header
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      this.logger.warn(`Authentication failed: No token provided for ${path}`);
      throw new UnauthorizedException('No authentication token provided');
    }

    try {
      // Verify the token with Supabase
      const { data, error } = await this.supabaseService.getClient().auth.getUser(token);
      
      if (error || !data.user) {
        this.logger.warn(`Authentication failed: Invalid token for ${path}`);
        throw new UnauthorizedException('Invalid token');
      }
      
      // Add the user to the request object for controllers to access
      request['user'] = {
        id: data.user.id,
        email: data.user.email,
        role: data.user.user_metadata?.role || 'user',
        // Add any other user properties you need
      };
      

      return true;
    } catch (error) {

      throw new UnauthorizedException('Authentication failed');
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
