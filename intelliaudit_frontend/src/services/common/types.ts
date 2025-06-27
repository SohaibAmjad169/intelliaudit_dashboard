export class ApiError extends Error {
  constructor(
    message: string,
    public originalError?: unknown,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Base API response interface
 */
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

/**
 * Error response from API
 */
export interface ApiErrorResponse {
  error: string;
  message: string;
  statusCode: number;
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

/**
 * Common query parameters for API requests
 */
export interface ApiQueryParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  search?: string;
  [key: string]: any;
}

/**
 * Standard API response format
 */
export interface CommonResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}
