export type FlightStatus = 'Scheduled' | 'Delayed' | 'Boarding' | 'Departed' | 'Arrived' | 'Cancelled';
export interface StaffFlight {
  flight_id: number; flight_number: string; airline_name: string;
  departure_time: string; arrival_time: string; flight_status: FlightStatus;
  departure_city: string; departure_code: string; arrival_city: string; arrival_code: string;
  occupied_seats: number;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api/staff${path}`, { ...options, credentials: 'same-origin', headers: { 'Content-Type': 'application/json', ...options.headers } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || 'The staff request could not be completed.');
  return body as T;
}

export const staffService = {
  session: () => request<{ username: string }>('/session'),
  login: (username: string, password: string) => request<{ username: string }>('/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  logout: () => request<{ ok: boolean }>('/logout', { method: 'POST' }),
  flights: () => request<StaffFlight[]>('/flights'),
  updateStatus: (flightId: number, status: FlightStatus) => request<{ ok: boolean }>(`/flights/${flightId}/status`, { method: 'PUT', body: JSON.stringify({ status }) })
};
