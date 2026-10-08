import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { customerKeys } from './customerKeys';
import { fetchCustomers, fetchCustomerById } from './customerApi';
import { Customer, CustomerFilters } from './customerTypes';

/**
 * Hook to fetch paginated/filtered customer leads
 * Keeps server data in TanStack Query cache — no copying into Redux/Zustand!
 */
export function useCustomerList(
  filters?: CustomerFilters,
  options?: Omit<UseQueryOptions<Customer[], Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: customerKeys.list(filters),
    queryFn: () => fetchCustomers(filters),
    staleTime: 30 * 1000, // 30 seconds fresh
    ...options,
  });
}

/**
 * Hook to fetch a single customer lead by ID
 */
export function useCustomerDetail(
  id: string,
  options?: Omit<UseQueryOptions<Customer, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: customerKeys.detail(id),
    queryFn: () => fetchCustomerById(id),
    enabled: Boolean(id),
    staleTime: 60 * 1000,
    ...options,
  });
}
