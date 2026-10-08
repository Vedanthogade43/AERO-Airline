import { Airport, Flight, Passenger, Booking, EnrichedFlight, EnrichedBooking } from '../types/database';
import { fareBaseByRoute } from './displayData';

type Bootstrap = { airports: Airport[]; flights: Flight[]; occupiedSeats: Record<string, string[]> };
type PassengerInput = Omit<Passenger, 'passenger_id'>;
type CreateBookingInput = { flight_id: number; seat_number: string; class: Booking['class'] };

let airports: Airport[] = [];
let flights: Flight[] = [];
let occupiedSeats: Record<string, string[]> = {};
export const DB_CHANGE_EVENT = 'aero_data_changed';
export const PASSENGER_SESSION_EVENT = 'aero_passenger_session_changed';
let passengerSession: Passenger | null = null;

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers }
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || 'The server could not complete that request.');
  return body as T;
}

function notify() { window.dispatchEvent(new CustomEvent(DB_CHANGE_EVENT)); }

function duration(departure: string, arrival: string) {
  const total = Math.max(0, Math.round((new Date(arrival).getTime() - new Date(departure).getTime()) / 60000));
  return { minutes: total, formatted: `${Math.floor(total / 60)}h ${total % 60}m` };
}

async function reload() {
  const data = await request<Bootstrap>('/public/bootstrap');
  airports = data.airports;
  flights = data.flights;
  occupiedSeats = data.occupiedSeats;
  passengerSession = await request<{ passenger: Passenger }>('/passenger/session').then(result => result.passenger).catch(() => null);
  notify();
}

export const dbService = {
  initialize: reload,
  getAirports: () => airports,
  getAirportById: (id: number) => airports.find(item => item.airport_id === id),
  getFlightById: (id: number) => flights.find(item => item.flight_id === id),
  getFlights: () => flights,
  getPassengers: (): Passenger[] => [],
  getPassengerSession: () => passengerSession,
  async registerPassenger(passenger: PassengerInput, password: string): Promise<Passenger> {
    const result = await request<{ passenger: Passenger }>('/passenger/register', { method: 'POST', body: JSON.stringify({ passenger, password }) });
    passengerSession = result.passenger;
    window.dispatchEvent(new CustomEvent(PASSENGER_SESSION_EVENT));
    return result.passenger;
  },
  async loginPassenger(email: string, password: string): Promise<Passenger> {
    const result = await request<{ passenger: Passenger }>('/passenger/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    passengerSession = result.passenger;
    window.dispatchEvent(new CustomEvent(PASSENGER_SESSION_EVENT));
    return result.passenger;
  },
  async logoutPassenger(): Promise<void> {
    await request('/passenger/logout', { method: 'POST' });
    passengerSession = null;
    window.dispatchEvent(new CustomEvent(PASSENGER_SESSION_EVENT));
  },
  getBookings: (): Booking[] => [],
  getEnrichedFlights(): EnrichedFlight[] {
    return flights.map(flight => {
      const { minutes, formatted } = duration(flight.departure_time, flight.arrival_time);
      const routeKey = `${flight.departure_airport_id}-${flight.arrival_airport_id}`;
      return {
        ...flight,
        departure_airport: airports.find(item => item.airport_id === flight.departure_airport_id),
        arrival_airport: airports.find(item => item.airport_id === flight.arrival_airport_id),
        booking_count: (occupiedSeats[String(flight.flight_id)] || []).length,
        duration_minutes: minutes,
        duration_formatted: formatted,
        demo_fare_estimate: fareBaseByRoute[routeKey] || fareBaseByRoute.default
      };
    });
  },
  getOccupiedSeatsForFlight: (flightId: number) => occupiedSeats[String(flightId)] || [],
  async createBooking(input: CreateBookingInput): Promise<{ booking: Booking; passenger: Passenger }> {
    const result = await request<{ booking: Booking; passenger: Passenger }>('/bookings', {
      method: 'POST', body: JSON.stringify(input)
    });
    await reload();
    return result;
  },
  async findBookingByVerification(bookingId: number): Promise<EnrichedBooking | null> {
    try {
      return await request<EnrichedBooking>(`/bookings/lookup?bookingId=${encodeURIComponent(bookingId)}`);
    } catch (error) {
      if (error instanceof Error && error.message === 'Booking not found.') return null;
      throw error;
    }
  },
  async cancelBooking(bookingId: number): Promise<void> {
    await request('/bookings/cancel', { method: 'POST', body: JSON.stringify({ booking_id: bookingId }) });
    await reload();
  }
};
