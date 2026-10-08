import { api } from '../../../api/client';
import { Customer, CustomerFilters, CreateCustomerDto, UpdateCustomerDto } from './customerTypes';

/**
 * Colocated Query & Mutation Fetcher Functions
 * Directly mapped to backend REST endpoints with strict typing
 */

export async function fetchCustomers(filters?: CustomerFilters): Promise<Customer[]> {
  const params: Record<string, any> = {};
  if (filters?.search) params.search = filters.search;
  if (filters?.verificationStatus) params.status = filters.verificationStatus;
  if (filters?.page) params.page = filters.page;
  if (filters?.limit) params.limit = filters.limit;

  const res = await api.get('/customers', { params });
  return (res.data?.data || []) as Customer[];
}

export async function fetchCustomerById(id: string): Promise<Customer> {
  const res = await api.get(`/customers/${id}`);
  return (res.data?.data || res.data) as Customer;
}

export async function createCustomer(data: CreateCustomerDto): Promise<Customer> {
  const res = await api.post('/customers', data);
  return (res.data?.data || res.data) as Customer;
}

export async function updateCustomer(id: string, data: UpdateCustomerDto): Promise<Customer> {
  const res = await api.put(`/customers/${id}`, data);
  return (res.data?.data || res.data) as Customer;
}

export async function deleteCustomer(id: string): Promise<{ success: boolean; id: string }> {
  await api.delete(`/customers/${id}`);
  return { success: true, id };
}
