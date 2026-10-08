import { QueryClient, defaultShouldDehydrateQuery, isServer } from '@tanstack/react-query';

/**
 * Creates a configured QueryClient with resilient enterprise defaults:
 * - 60s staleTime: Prevents excessive over-fetching while keeping data fresh.
 * - 10m gcTime: Retains unused cache data in memory for instant subsequent visits.
 * - Selective retry: Avoids hammering servers on 401, 403, and 404 client errors.
 * - Server-State Separation: Ensures server data stays in Query cache without leaking to global client stores.
 */
export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        gcTime: 10 * 60 * 1000, // 10 minutes
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        retry: (failureCount, error: any) => {
          // Never retry authorization or not-found client errors
          const status = error?.response?.status || error?.status;
          if (status === 401 || status === 403 || status === 404) {
            return false;
          }
          return failureCount < 2;
        },
      },
      mutations: {
        retry: 0,
        onError: (error: any) => {
          console.error('[Mutation Error]:', error?.response?.data?.message || error?.message || error);
        },
      },
      dehydrate: {
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) || query.state.status === 'pending',
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

/**
 * Singleton QueryClient accessor for client environments,
 * creates a new instance per server-side render request.
 */
export function getQueryClient(): QueryClient {
  if (isServer) {
    return makeQueryClient();
  }
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }
  return browserQueryClient;
}
