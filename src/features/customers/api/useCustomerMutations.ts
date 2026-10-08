import { useMutation, useQueryClient } from '@tanstack/react-query';
import { customerKeys } from './customerKeys';
import { createCustomer, updateCustomer, deleteCustomer } from './customerApi';
import { Customer, CreateCustomerDto, UpdateCustomerDto } from './customerTypes';

interface UpdateMutationVariables {
  id: string;
  data: UpdateCustomerDto;
}

interface MutationContext {
  previousCustomer?: Customer;
  previousLists?: Array<[readonly unknown[], Customer[] | undefined]>;
}

/**
 * Optimistic Mutation Hook for Updating Customer Leads
 * Features:
 * 1. Cancel in-flight queries to prevent overwriting optimistic cache
 * 2. Snapshot current cache (both detail and all lists)
 * 3. Immediate instant optimistic update in UI cache
 * 4. Automatic rollback on server/network failure
 * 5. Targeted invalidation onSettled to synchronize final authoritative server state
 */
export function useUpdateCustomerOptimistic() {
  const queryClient = useQueryClient();

  return useMutation<Customer, Error, UpdateMutationVariables, MutationContext>({
    mutationFn: ({ id, data }) => updateCustomer(id, data),

    onMutate: async ({ id, data }) => {
      // 1. Cancel any outgoing refetches for this customer and lists
      await queryClient.cancelQueries({ queryKey: customerKeys.detail(id) });
      await queryClient.cancelQueries({ queryKey: customerKeys.lists() });

      // 2. Snapshot current state for rollback
      const previousCustomer = queryClient.getQueryData<Customer>(customerKeys.detail(id));
      const previousLists = queryClient.getQueriesData<Customer[]>({ queryKey: customerKeys.lists() });

      // 3. Optimistically update Detail cache
      if (previousCustomer) {
        queryClient.setQueryData<Customer>(customerKeys.detail(id), (old) => {
          if (!old) return old;
          return {
            ...old,
            ...data,
            updatedAt: new Date().toISOString(),
          };
        });
      }

      // 4. Optimistically update all matching List caches
      queryClient.setQueriesData<Customer[]>({ queryKey: customerKeys.lists() }, (oldList) => {
        if (!oldList) return oldList;
        return oldList.map((item) =>
          item._id === id
            ? {
                ...item,
                ...data,
                updatedAt: new Date().toISOString(),
              }
            : item
        );
      });

      // 5. Return context with snapshots for potential rollback
      return { previousCustomer, previousLists };
    },

    onError: (_err, { id }, context) => {
      // Rollback to snapshots on error
      if (context?.previousCustomer) {
        queryClient.setQueryData(customerKeys.detail(id), context.previousCustomer);
      }
      if (context?.previousLists) {
        context.previousLists.forEach(([key, oldData]) => {
          queryClient.setQueryData(key, oldData);
        });
      }
    },

    onSettled: (_data, _error, { id }) => {
      // Targeted Invalidation: Only invalidate this specific customer and active lists
      queryClient.invalidateQueries({ queryKey: customerKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
    },
  });
}

/**
 * Hook to create a customer lead with targeted cache invalidation
 */
export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation<Customer, Error, CreateCustomerDto>({
    mutationFn: (newCustomer) => createCustomer(newCustomer),
    onSuccess: (savedCustomer) => {
      // Pre-seed detail cache so navigation to new customer is instant
      if (savedCustomer._id) {
        queryClient.setQueryData(customerKeys.detail(savedCustomer._id), savedCustomer);
      }
      // Targeted Invalidation: Invalidate all customer lists so new customer appears
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
    },
  });
}

/**
 * Hook to delete a customer lead with targeted invalidation
 */
export function useDeleteCustomer() {
  const queryClient = useQueryClient();

  return useMutation<{ success: boolean; id: string }, Error, string>({
    mutationFn: (id) => deleteCustomer(id),
    onSuccess: ({ id }) => {
      // Clean up detail query from cache
      queryClient.removeQueries({ queryKey: customerKeys.detail(id) });
      // Invalidate list queries
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
    },
  });
}
