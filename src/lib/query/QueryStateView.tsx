'use client';

import React from 'react';
import { UseQueryResult } from '@tanstack/react-query';
import { RefreshCw, AlertCircle, Inbox, Loader2 } from 'lucide-react';

export interface QueryStateViewProps<TData, TError = Error> {
  query: UseQueryResult<TData, TError>;
  /**
   * Predicate or condition to determine if data is considered "empty"
   * Default: Checks if array length is 0 or data is null/undefined.
   */
  isEmpty?: (data: TData) => boolean;
  /** Custom renderers for specific states */
  renderLoading?: () => React.ReactNode;
  renderError?: (error: TError, refetch: () => void) => React.ReactNode;
  renderEmpty?: () => React.ReactNode;
  /** Empty state messaging overrides */
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  /** Whether to show a non-intrusive background sync badge when isFetching && !isLoading */
  showBackgroundSync?: boolean;
  /** Main content renderer when data is available */
  children: (data: TData, meta: { isStale: boolean; isFetching: boolean }) => React.ReactNode;
}

/**
 * Enterprise Query State Wrapper
 * Handles all 5 fundamental server-state phases:
 * 1. Initial Loading (Skeleton/Spinner)
 * 2. Error (Failure + Retry button)
 * 3. Empty (No records found)
 * 4. Background Refetching (Stale-while-revalidate subtle pulse)
 * 5. Stale Data awareness
 */
export function QueryStateView<TData, TError = Error>({
  query,
  isEmpty,
  renderLoading,
  renderError,
  renderEmpty,
  emptyTitle = 'No records found',
  emptyDescription = 'There is currently no data matching your query criteria.',
  emptyAction,
  showBackgroundSync = true,
  children,
}: QueryStateViewProps<TData, TError>) {
  const { data, isLoading, isError, error, isFetching, isStale, refetch } = query;

  // 1. INITIAL LOADING (No cached data available yet)
  if (isLoading) {
    if (renderLoading) return <>{renderLoading()}</>;

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 24px',
          gap: '12px',
          color: 'var(--text-muted, #64748b)',
        }}
      >
        <Loader2 size={32} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
        <span style={{ fontSize: '14px', fontWeight: 500 }}>Loading server data...</span>
        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // 2. ERROR STATE
  if (isError) {
    if (renderError) return <>{renderError(error as TError, () => refetch())}</>;

    const message =
      (error as any)?.response?.data?.message ||
      (error as any)?.message ||
      'Failed to synchronize server data.';

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '36px 20px',
          margin: '16px 0',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          textAlign: 'center',
          gap: '10px',
        }}
      >
        <div style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={22} />
          <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#991b1b' }}>
            Data Loading Error
          </h4>
        </div>
        <p style={{ margin: 0, fontSize: '13px', color: '#b91c1c', maxWidth: '480px' }}>
          {message}
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          style={{
            marginTop: '6px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 14px',
            fontSize: '12.5px',
            fontWeight: 600,
            borderRadius: '6px',
            border: '1px solid #dc2626',
            backgroundColor: '#fff',
            color: '#b91c1c',
            cursor: 'pointer',
          }}
        >
          <RefreshCw size={13} /> Retry Request
        </button>
      </div>
    );
  }

  // Check empty state
  const checkEmpty = isEmpty
    ? isEmpty(data as TData)
    : Array.isArray(data)
    ? data.length === 0
    : !data;

  // 3. EMPTY STATE
  if (checkEmpty) {
    if (renderEmpty) return <>{renderEmpty()}</>;

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 24px',
          backgroundColor: '#f8fafc',
          border: '1px dashed #cbd5e1',
          borderRadius: '8px',
          textAlign: 'center',
          margin: '16px 0',
          gap: '8px',
        }}
      >
        <div
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            backgroundColor: '#e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#64748b',
            marginBottom: '4px',
          }}
        >
          <Inbox size={22} />
        </div>
        <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#1e293b' }}>
          {emptyTitle}
        </h4>
        <p style={{ margin: 0, fontSize: '13px', color: '#64748b', maxWidth: '400px' }}>
          {emptyDescription}
        </p>
        {emptyAction && <div style={{ marginTop: '8px' }}>{emptyAction}</div>}
      </div>
    );
  }

  // 4 & 5. SUCCESS WITH BACKGROUND REFETCH & STALE AWARENESS
  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {/* 4. Background Refetching Indicator (Subtle, non-blocking pulse) */}
      {showBackgroundSync && isFetching && !isLoading && (
        <div
          style={{
            position: 'absolute',
            top: '-12px',
            right: '0',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '11px',
            fontWeight: 500,
            color: '#2563eb',
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            padding: '2px 8px',
            borderRadius: '12px',
            zIndex: 10,
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
          }}
          title="Refreshing server state in background..."
        >
          <RefreshCw size={11} style={{ animation: 'spin 1s linear infinite' }} />
          <span>Syncing...</span>
        </div>
      )}

      {/* Render children with stale-while-revalidate meta */}
      {children(data as TData, { isStale, isFetching })}
    </div>
  );
}

export default QueryStateView;
