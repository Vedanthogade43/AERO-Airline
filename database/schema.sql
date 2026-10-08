-- Run this in the Aiven MySQL query editor while connected to defaultdb.
-- It creates the project tables and illustrative Indian domestic sample rows.
-- It does not drop or erase existing tables or passenger/booking records.

CREATE TABLE IF NOT EXISTS AIRPORT (
  airport_id INT PRIMARY KEY,
  airport_name VARCHAR(100) NOT NULL,
  city VARCHAR(50) NOT NULL,
  state VARCHAR(50),
  country VARCHAR(50) NOT NULL,
  IATA_code CHAR(3) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS PASSENGER (
  passenger_id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(80) NOT NULL,
  age INT NOT NULL,
  gender VARCHAR(10) NOT NULL,
  contact_number VARCHAR(15) NOT NULL,
  email VARCHAR(80) NOT NULL UNIQUE,
  address VARCHAR(150) NOT NULL,
  CONSTRAINT chk_passenger_age CHECK (age BETWEEN 1 AND 120),
  CONSTRAINT chk_passenger_gender CHECK (gender IN ('Male', 'Female', 'Other'))
) ENGINE=InnoDB AUTO_INCREMENT=201;

-- Credentials are kept separate from passenger profile details.
CREATE TABLE IF NOT EXISTS PASSENGER_ACCOUNT (
  account_id INT PRIMARY KEY AUTO_INCREMENT,
  passenger_id INT NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_account_passenger FOREIGN KEY (passenger_id) REFERENCES PASSENGER(passenger_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Admin-created staff users. Staff passwords are stored only as salted scrypt hashes.
CREATE TABLE IF NOT EXISTS STAFF (
  staff_id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(40) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(80) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  phone VARCHAR(20),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Hashed, durable sessions survive serverless function instance changes.
CREATE TABLE IF NOT EXISTS AUTH_SESSION (
  token_hash CHAR(64) PRIMARY KEY,
  session_type VARCHAR(12) NOT NULL,
  subject VARCHAR(120) NOT NULL,
  expires_at BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_auth_session_expiry (expires_at),
  CONSTRAINT chk_auth_session_type CHECK (session_type IN ('admin', 'staff', 'passenger'))
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS FLIGHT (
  flight_id INT PRIMARY KEY AUTO_INCREMENT,
  flight_number VARCHAR(10) NOT NULL UNIQUE,
  airline_name VARCHAR(50) NOT NULL,
  departure_airport_id INT NOT NULL,
  arrival_airport_id INT NOT NULL,
  departure_time DATETIME NOT NULL,
  arrival_time DATETIME NOT NULL,
  flight_status VARCHAR(12) NOT NULL DEFAULT 'Scheduled',
  CONSTRAINT fk_flight_departure_airport FOREIGN KEY (departure_airport_id) REFERENCES AIRPORT(airport_id),
  CONSTRAINT fk_flight_arrival_airport FOREIGN KEY (arrival_airport_id) REFERENCES AIRPORT(airport_id),
  CONSTRAINT chk_flight_route CHECK (departure_airport_id <> arrival_airport_id),
  CONSTRAINT chk_flight_times CHECK (arrival_time > departure_time),
  CONSTRAINT chk_flight_status CHECK (flight_status IN ('Scheduled', 'Delayed', 'Boarding', 'Departed', 'Arrived', 'Cancelled'))
) ENGINE=InnoDB AUTO_INCREMENT=101;

CREATE TABLE IF NOT EXISTS BOOKING (
  booking_id INT PRIMARY KEY AUTO_INCREMENT,
  passenger_id INT NOT NULL,
  flight_id INT NOT NULL,
  booking_date DATE NOT NULL,
  seat_number VARCHAR(5) NOT NULL,
  `class` VARCHAR(15) NOT NULL,
  payment_status VARCHAR(10) NOT NULL DEFAULT 'Pending',
  booking_status VARCHAR(12) NOT NULL DEFAULT 'Confirmed',
  CONSTRAINT fk_booking_passenger FOREIGN KEY (passenger_id) REFERENCES PASSENGER(passenger_id),
  CONSTRAINT fk_booking_flight FOREIGN KEY (flight_id) REFERENCES FLIGHT(flight_id),
  INDEX idx_booking_flight_seat_status (flight_id, seat_number, booking_status),
  CONSTRAINT chk_booking_class CHECK (`class` IN ('Economy', 'Business')),
  CONSTRAINT chk_booking_payment CHECK (payment_status IN ('Paid', 'Pending')),
  CONSTRAINT chk_booking_status CHECK (booking_status IN ('Confirmed', 'Cancelled'))
) ENGINE=InnoDB AUTO_INCREMENT=301;

-- Only active seat assignments are unique; cancelled bookings remain in history.
CREATE TABLE IF NOT EXISTS FLIGHT_SEAT_ASSIGNMENT (
  assignment_id INT PRIMARY KEY AUTO_INCREMENT,
  flight_id INT NOT NULL,
  seat_number VARCHAR(5) NOT NULL,
  booking_id INT NOT NULL UNIQUE,
  CONSTRAINT uq_active_flight_seat UNIQUE (flight_id, seat_number),
  CONSTRAINT fk_assignment_flight FOREIGN KEY (flight_id) REFERENCES FLIGHT(flight_id),
  CONSTRAINT fk_assignment_booking FOREIGN KEY (booking_id) REFERENCES BOOKING(booking_id)
) ENGINE=InnoDB;

INSERT INTO AIRPORT (airport_id, airport_name, city, state, country, IATA_code) VALUES
(1, 'Chhatrapati Shivaji Maharaj International Airport', 'Mumbai', 'Maharashtra', 'India', 'BOM'),
(2, 'Indira Gandhi International Airport', 'Delhi', 'Delhi', 'India', 'DEL'),
(3, 'Pune Airport', 'Pune', 'Maharashtra', 'India', 'PNQ'),
(4, 'Kempegowda International Airport', 'Bengaluru', 'Karnataka', 'India', 'BLR'),
(5, 'Rajiv Gandhi International Airport', 'Hyderabad', 'Telangana', 'India', 'HYD'),
(6, 'Chennai International Airport', 'Chennai', 'Tamil Nadu', 'India', 'MAA'),
(7, 'Netaji Subhas Chandra Bose International Airport', 'Kolkata', 'West Bengal', 'India', 'CCU'),
(8, 'Sardar Vallabhbhai Patel International Airport', 'Ahmedabad', 'Gujarat', 'India', 'AMD'),
(9, 'Cochin International Airport', 'Kochi', 'Kerala', 'India', 'COK'),
(10, 'Jaipur International Airport', 'Jaipur', 'Rajasthan', 'India', 'JAI'),
(11, 'Manohar International Airport', 'Goa', 'Goa', 'India', 'GOX')
ON DUPLICATE KEY UPDATE airport_name=VALUES(airport_name), city=VALUES(city), state=VALUES(state), country=VALUES(country), IATA_code=VALUES(IATA_code);

INSERT INTO FLIGHT (flight_id, flight_number, airline_name, departure_airport_id, arrival_airport_id, departure_time, arrival_time) VALUES
(101, 'AI101', 'Air India', 1, 2, '2026-10-05 06:00:00', '2026-10-05 08:10:00'),
(102, '6E202', 'IndiGo', 3, 4, '2026-10-06 09:15:00', '2026-10-06 10:35:00'),
(103, '6E500', 'IndiGo', 5, 1, '2026-10-07 14:20:00', '2026-10-07 16:05:00'),
(104, 'AI303', 'Air India', 2, 6, '2026-10-08 07:30:00', '2026-10-08 10:20:00'),
(105, 'SG707', 'SpiceJet', 6, 1, '2026-10-11 16:10:00', '2026-10-11 18:05:00'),
(106, '6E410', 'IndiGo', 1, 4, '2026-10-09 11:00:00', '2026-10-09 12:50:00'),
(107, 'AI808', 'Air India', 4, 2, '2026-10-10 18:25:00', '2026-10-10 21:05:00'),
(108, 'SG212', 'SpiceJet', 3, 2, '2026-10-12 08:40:00', '2026-10-12 10:55:00'),
(109, 'AI909', 'Air India', 1, 6, '2026-10-13 13:00:00', '2026-10-13 15:00:00'),
(110, 'AI611', 'Air India', 7, 2, '2026-10-14 07:00:00', '2026-10-14 09:15:00'),
(111, '6E312', 'IndiGo', 8, 1, '2026-10-14 10:30:00', '2026-10-14 11:45:00'),
(112, 'AI717', 'Air India', 9, 4, '2026-10-15 12:40:00', '2026-10-15 13:50:00'),
(113, 'SG505', 'SpiceJet', 10, 2, '2026-10-16 14:20:00', '2026-10-16 15:20:00'),
(114, '6E606', 'IndiGo', 11, 1, '2026-10-17 18:00:00', '2026-10-17 19:15:00'),
(115, '6E707', 'IndiGo', 2, 5, '2026-10-18 20:00:00', '2026-10-18 22:20:00'),
(116, 'AI818', 'Air India', 4, 9, '2026-10-19 09:10:00', '2026-10-19 10:25:00'),
(117, '6E909', 'IndiGo', 1, 8, '2026-10-20 16:15:00', '2026-10-20 17:30:00')
ON DUPLICATE KEY UPDATE flight_number=VALUES(flight_number), airline_name=VALUES(airline_name), departure_airport_id=VALUES(departure_airport_id), arrival_airport_id=VALUES(arrival_airport_id), departure_time=VALUES(departure_time), arrival_time=VALUES(arrival_time);
