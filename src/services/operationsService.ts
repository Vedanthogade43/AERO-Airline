import { FlightStatus, StaffFlight } from './staffService';

export type OperationsRole = 'admin' | 'staff';
export type FlightDraft = {
  flight_number: string; airline_name: string; departure_airport_id: number;
  arrival_airport_id: number; departure_time: string; arrival_time: string;
};

async function request<T>(role: OperationsRole, path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api/${role}${path}`, {
    ...options, credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', ...options.headers }
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || 'The operations request could not be completed.');
  return body as T;
}

export const operationsService = {
  flights: (role: OperationsRole) => request<StaffFlight[]>(role, '/flights'),
  addFlight: (role: OperationsRole, flight: FlightDraft) => request<{ flight_id: number }>(role, '/flights', { method: 'POST', body: JSON.stringify(flight) }),
  removeFlight: (role: OperationsRole, flightId: number) => request<{ ok: boolean }>(role, `/flights/${flightId}`, { method: 'DELETE' }),
  updateStatus: (flightId: number, status: FlightStatus) => request<{ ok: boolean }>('staff', `/flights/${flightId}/status`, { method: 'PUT', body: JSON.stringify({ status }) })
};
