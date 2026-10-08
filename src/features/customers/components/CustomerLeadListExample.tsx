'use client';

import React, { useState } from 'react';
import { useCustomerList, useUpdateCustomerOptimistic, Customer } from '../api';
import { QueryStateView } from '../../../lib/query/QueryStateView';
import { Search, CheckCircle2, Clock, DollarSign, RefreshCw } from 'lucide-react';

/**
 * Example Component Demonstrating TanStack Query Server-State Architecture
 *
 * Key Architecture Highlights:
 * 1. Server-state is completely owned by TanStack Query (zero Redux/Zustand sync).
 * 2. Only ephemeral UI state (e.g. search filter input) is in local useState.
 * 3. Handles all 5 states: Loading, Error, Empty, Background-Refetch, Stale.
 * 4. Demonstrates instant optimistic verification toggle with automatic rollback.
 */
export function CustomerLeadListExample() {
  // Ephemeral Client UI State ONLY
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Server State Query Hook (Domain-shaped query key: ['customers', 'list', { search }])
  const customerQuery = useCustomerList(
    { search: searchTerm },
    {
      // Optional query overrides
      staleTime: 30 * 1000,
    }
  );

  // 2. Optimistic Mutation Hook
  const updateMutation = useUpdateCustomerOptimistic();

  const handleToggleVerification = (customer: Customer) => {
    const nextVerified = !customer.verified;
    // Optimistic mutation triggers immediately in cache
    updateMutation.mutate({
      id: customer._id,
      data: {
        verified: nextVerified,
        verificationStatus: nextVerified ? 'Verified' : 'Pending',
      },
    });
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header & Local UI Filter */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>
            Active Customer Leads (TanStack Query Layer)
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
            Domain-shaped keys • Optimistic updates • Server-state isolation
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '7px 12px 7px 32px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                outline: 'none',
              }}
            />
          </div>

          <button
            type="button"
            onClick={() => customerQuery.refetch()}
            disabled={customerQuery.isFetching}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 12px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#fff',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={13} style={{ animation: customerQuery.isFetching ? 'spin 1s linear infinite' : 'none' }} />
            Refetch
          </button>
        </div>
      </div>

      {/* 3. Unified Server State Handler (Handles Loading, Error, Empty, Sync, Stale) */}
      <QueryStateView
        query={customerQuery}
        emptyTitle="No Customer Leads Found"
        emptyDescription="No leads matched your search query. Try searching with a different name or number."
      >
        {(customers, { isStale, isFetching }) => (
          <div>
            {/* Stale Warning Bar (Optional indicator when data exceeded freshness) */}
            {isStale && !isFetching && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 12px',
                  marginBottom: '12px',
                  backgroundColor: '#fffbeb',
                  border: '1px solid #fef3c7',
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: '#b45309',
                }}
              >
                <Clock size={13} />
                <span>Cached data is stale. It will auto-refresh on next window focus or manual trigger.</span>
              </div>
            )}

            {/* Render List from Cache */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {customers.map((c) => (
                <div
                  key={c._id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 18px',
                    borderRadius: '8px',
                    backgroundColor: '#fff',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: 700,
                          backgroundColor: '#eff6ff',
                          color: '#1d4ed8',
                          padding: '2px 8px',
                          borderRadius: '4px',
                        }}
                      >
                        AP-{c.appointmentId}
                      </span>
                      <strong style={{ fontSize: '15px' }}>{c.customerName}</strong>
                      <span style={{ fontSize: '13px', color: '#64748b' }}>• {c.mobile}</span>
                    </div>

                    <div style={{ display: 'flex', gap: '14px', marginTop: '6px', fontSize: '12.5px', color: '#64748b' }}>
                      {c.carNumber && <span>Car: <strong>{c.carNumber}</strong></span>}
                      <span>
                        Sale Value:{' '}
                        <strong style={{ color: c.saleAmount ? '#16a34a' : 'inherit' }}>
                          ₹{Number(c.saleAmount || 0).toLocaleString('en-IN')}
                        </strong>
                      </span>
                    </div>
                  </div>

                  {/* Optimistic Verification Action */}
                  <button
                    type="button"
                    onClick={() => handleToggleVerification(c)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 600,
                      border: '1px solid',
                      cursor: 'pointer',
                      backgroundColor: c.verified ? '#dcfce7' : '#f1f5f9',
                      borderColor: c.verified ? '#86efac' : '#cbd5e1',
                      color: c.verified ? '#15803d' : '#475569',
                    }}
                  >
                    <CheckCircle2 size={13} />
                    {c.verified ? 'Verified (Click to Unverify)' : 'Mark Verified'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </QueryStateView>
    </div>
  );
}

export default CustomerLeadListExample;
