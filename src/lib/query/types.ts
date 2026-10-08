/**
 * Generic API & Query state response abstractions
 */

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Metadata for tracking cache background activity
 */
export interface CacheStateMeta {
  isStale: boolean;
  isBackgroundRefetching: boolean;
  lastUpdatedAt?: Date;
}
