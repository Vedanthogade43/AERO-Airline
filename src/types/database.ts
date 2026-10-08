/** Types for the passenger, airport, flight and booking domain records. */

export interface Passenger {
  passenger_id: number;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  contact_number: string;
  email: string;
  address: string;
}

export interface Airport {
  airport_id: number;
  airport_name: string;
  city: string;
  state: string;
  country: string;
  IATA_code: string;
}

export interface Flight {
  flight_id: number;
  flight_number: string;
  airline_name: string;
  departure_airport_id: number;
  arrival_airport_id: number;
  departure_time: string; // MySQL DATETIME represented in India Standard Time
  arrival_time: string;   // MySQL DATETIME represented in India Standard Time
  flight_status: 'Scheduled' | 'Delayed' | 'Boarding' | 'Departed' | 'Arrived' | 'Cancelled';
}

export interface Booking {
  booking_id: number;
  passenger_id: number;
  flight_id: number;
  booking_date: string; // YYYY-MM-DD
  seat_number: string;
  class: 'Economy' | 'Business';
  payment_status: 'Paid' | 'Pending';
  booking_status: 'Confirmed' | 'Cancelled';
}

/**
 * Joined / Enriched view types for display only.
 * Built by joining the core domain tables in the API.
 */
export interface EnrichedFlight extends Flight {
  departure_airport?: Airport;
  arrival_airport?: Airport;
  booking_count?: number;
  // UI-calculated duration (computed from arrival_time - departure_time)
  duration_minutes: number;
  duration_formatted: string;
  // UI-only demo estimated fare
  demo_fare_estimate: {
    economy: number;
    business: number;
  };
}

export interface EnrichedBooking extends Booking {
  passenger?: Passenger;
  flight?: EnrichedFlight;
}
