import { Airport, Booking, Flight, Passenger } from '../types/database';

export type AdminTableName = 'BOOKING' | 'PASSENGER' | 'FLIGHT' | 'AIRPORT';
export type AdminTables = Record<AdminTableName, Array<Booking | Passenger | Flight | Airport>>;
export interface StaffAccount { staff_id: number; username: string; full_name: string; email: string; phone: string | null; created_at?: string; }

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api/admin${path}`, {
    ...options,
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', ...options.headers }
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || 'The admin request could not be completed.');
  return body as T;
}

export const adminService = {
  session: () => request<{ username: string }>('/session'),
  login: (username: string, password: string) => request<{ username: string }>('/login', {
    method: 'POST', body: JSON.stringify({ username, password })
  }),
  logout: () => request<{ ok: boolean }>('/logout', { method: 'POST' }),
  getTables: () => request<AdminTables>('/tables'),
  getStaff: () => request<StaffAccount[]>('/staff'),
  addStaff: (staff: { username: string; full_name: string; email: string; phone: string; password: string }) => request<{ staff_id: number }>('/staff', { method: 'POST', body: JSON.stringify(staff) }),
  removeStaff: (staffId: number) => request<{ ok: boolean }>(`/staff/${staffId}`, { method: 'DELETE' })
};
