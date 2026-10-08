-- Run once against an existing project database before starting the updated API.
-- For a fresh database, use schema.sql instead.

CREATE TABLE IF NOT EXISTS PASSENGER_ACCOUNT (
  account_id INT PRIMARY KEY AUTO_INCREMENT,
  passenger_id INT NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_account_passenger FOREIGN KEY (passenger_id) REFERENCES PASSENGER(passenger_id) ON DELETE CASCADE
) ENGINE=InnoDB;

ALTER TABLE FLIGHT
  ADD COLUMN flight_status VARCHAR(12) NOT NULL DEFAULT 'Scheduled',
  ADD CONSTRAINT chk_flight_status CHECK (flight_status IN ('Scheduled', 'Delayed', 'Boarding', 'Departed', 'Arrived', 'Cancelled'));

-- Replace the previous international sample and add more Indian city records.
UPDATE AIRPORT SET airport_name='Rajiv Gandhi International Airport', city='Hyderabad', state='Telangana', country='India', IATA_code='HYD' WHERE airport_id=5;
INSERT INTO AIRPORT (airport_id, airport_name, city, state, country, IATA_code) VALUES
  (7, 'Netaji Subhas Chandra Bose International Airport', 'Kolkata', 'West Bengal', 'India', 'CCU'),
  (8, 'Sardar Vallabhbhai Patel International Airport', 'Ahmedabad', 'Gujarat', 'India', 'AMD'),
  (9, 'Cochin International Airport', 'Kochi', 'Kerala', 'India', 'COK'),
  (10, 'Jaipur International Airport', 'Jaipur', 'Rajasthan', 'India', 'JAI'),
  (11, 'Manohar International Airport', 'Goa', 'Goa', 'India', 'GOX')
ON DUPLICATE KEY UPDATE airport_name=VALUES(airport_name), city=VALUES(city), state=VALUES(state), country=VALUES(country), IATA_code=VALUES(IATA_code);

UPDATE FLIGHT SET flight_number='6E500', airline_name='IndiGo', departure_airport_id=5, arrival_airport_id=1, departure_time='2026-10-07 14:20:00', arrival_time='2026-10-07 16:05:00' WHERE flight_id=103;
INSERT INTO FLIGHT (flight_id, flight_number, airline_name, departure_airport_id, arrival_airport_id, departure_time, arrival_time) VALUES
  (110, 'AI611', 'Air India', 7, 2, '2026-10-14 07:00:00', '2026-10-14 09:15:00'),
  (111, '6E312', 'IndiGo', 8, 1, '2026-10-14 10:30:00', '2026-10-14 11:45:00'),
  (112, 'AI717', 'Air India', 9, 4, '2026-10-15 12:40:00', '2026-10-15 13:50:00'),
  (113, 'SG505', 'SpiceJet', 10, 2, '2026-10-16 14:20:00', '2026-10-16 15:20:00'),
  (114, '6E606', 'IndiGo', 11, 1, '2026-10-17 18:00:00', '2026-10-17 19:15:00'),
  (115, '6E707', 'IndiGo', 2, 5, '2026-10-18 20:00:00', '2026-10-18 22:20:00'),
  (116, 'AI818', 'Air India', 4, 9, '2026-10-19 09:10:00', '2026-10-19 10:25:00'),
  (117, '6E909', 'IndiGo', 1, 8, '2026-10-20 16:15:00', '2026-10-20 17:30:00')
ON DUPLICATE KEY UPDATE flight_number=VALUES(flight_number), airline_name=VALUES(airline_name), departure_airport_id=VALUES(departure_airport_id), arrival_airport_id=VALUES(arrival_airport_id), departure_time=VALUES(departure_time), arrival_time=VALUES(arrival_time);

ALTER TABLE BOOKING
  ADD COLUMN booking_status VARCHAR(12) NOT NULL DEFAULT 'Confirmed',
  ADD CONSTRAINT chk_booking_status CHECK (booking_status IN ('Confirmed', 'Cancelled'));

-- Seat reuse after cancellation is checked while holding a lock on the flight row.
-- Remove the old all-status unique key so a cancelled booking can retain its history.
ALTER TABLE BOOKING
  DROP INDEX uq_flight_seat,
  ADD INDEX idx_booking_flight_seat_status (flight_id, seat_number, booking_status);

CREATE TABLE IF NOT EXISTS FLIGHT_SEAT_ASSIGNMENT (
  assignment_id INT PRIMARY KEY AUTO_INCREMENT,
  flight_id INT NOT NULL,
  seat_number VARCHAR(5) NOT NULL,
  booking_id INT NOT NULL UNIQUE,
  CONSTRAINT uq_active_flight_seat UNIQUE (flight_id, seat_number),
  CONSTRAINT fk_assignment_flight FOREIGN KEY (flight_id) REFERENCES FLIGHT(flight_id),
  CONSTRAINT fk_assignment_booking FOREIGN KEY (booking_id) REFERENCES BOOKING(booking_id)
) ENGINE=InnoDB;

INSERT INTO FLIGHT_SEAT_ASSIGNMENT (flight_id, seat_number, booking_id)
SELECT flight_id, seat_number, booking_id FROM BOOKING WHERE booking_status='Confirmed';

-- Old "Paid" values came from a UI simulation and are not verified transactions.
UPDATE BOOKING SET payment_status='Pending' WHERE payment_status='Paid';
