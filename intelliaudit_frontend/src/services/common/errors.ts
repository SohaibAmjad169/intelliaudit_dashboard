/**
 * Base API error class for extending in specific services
 */
export class ApiError extends Error {
  constructor(message: string, public originalError?: unknown) {
    super(message);
    this.name = 'ApiError';
    
    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
    
    // Custom debugging information
    this.date = new Date();
    this.originalError = originalError;
  }
  
  date: Date;
} 