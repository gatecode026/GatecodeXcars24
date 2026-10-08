/**
 * Customer / Lead Domain Types
 */

export interface Customer {
  _id: string;
  appointmentId: string;
  customerName: string;
  mobile: string;
  email?: string;
  carNumber?: string;
  odometerKm?: number;
  saleAmount?: number;
  verified?: boolean;
  verificationStatus?: 'Verified' | 'Pending' | 'Rejected' | 'In Progress';
  leadStatus?: string;
  leadDate?: string;
  appointmentDate?: string | null;
  leadBy?: string;
  followUpBy?: string;
  followUpDate?: string | null;
  remark?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CustomerFilters {
  search?: string;
  verificationStatus?: string;
  page?: number;
  limit?: number;
}

export interface CreateCustomerDto {
  customerName: string;
  mobile: string;
  appointmentId?: string;
  carNumber?: string;
  saleAmount?: number;
  appointmentDate?: string;
  remark?: string;
}

export interface UpdateCustomerDto {
  customerName?: string;
  mobile?: string;
  carNumber?: string;
  saleAmount?: number;
  verified?: boolean;
  verificationStatus?: string;
  appointmentDate?: string | null;
  followUpBy?: string;
  followUpDate?: string | null;
  remark?: string;
}
