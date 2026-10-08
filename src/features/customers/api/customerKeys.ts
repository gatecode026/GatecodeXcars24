import { CustomerFilters } from './customerTypes';

/**
 * Domain-shaped Query Key Factory for Customers
 * Hierarchical key structure:
 * - customerKeys.all: ['customers']
 * - customerKeys.lists(): ['customers', 'list']
 * - customerKeys.list(filters): ['customers', 'list', { ...filters }]
 * - customerKeys.details(): ['customers', 'detail']
 * - customerKeys.detail(id): ['customers', 'detail', id]
 *
 * Benefits:
 * - Predictable cache invalidation scopes (e.g. invalidate all lists vs single detail)
 * - Strict type-safety across all hooks and cache manipulations
 */
export const customerKeys = {
  all: ['customers'] as const,
  lists: () => [...customerKeys.all, 'list'] as const,
  list: (filters?: CustomerFilters) => [...customerKeys.lists(), filters ?? {}] as const,
  details: () => [...customerKeys.all, 'detail'] as const,
  detail: (id: string) => [...customerKeys.details(), id] as const,
  summary: () => [...customerKeys.all, 'summary'] as const,
};
