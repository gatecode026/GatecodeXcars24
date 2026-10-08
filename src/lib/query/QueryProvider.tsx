'use client';

import React, { useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { getQueryClient } from './queryClient';

interface QueryProviderProps {
  children: React.ReactNode;
}

/**
 * Root TanStack Query Provider for client-side React trees
 */
export function QueryProvider({ children }: QueryProviderProps) {
  // NOTE: Avoid useState if you want suspense boundary hydration during SSR,
  // but using getQueryClient() maintains consistency across client-side navigation.
  const [queryClient] = useState(() => getQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

export default QueryProvider;
