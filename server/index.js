import 'dotenv/config';
import express from 'express';
import mysql from 'mysql2/promise';
import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const required = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'ADMIN_USERNAME', 'ADMIN_PASSWORD'];
const missing = required.filter(key => !process.env[key]);
if (missing.length) {
  console.error(`Missing backend settings: ${missing.join(', ')}. Copy .env.example to .env and fill it in.`);
  process.exit(1);
}

const sslEnabled = process.env.DB_SSL === 'true';
const caPath = process.env.DB_SSL_CA ? path.resolve(process.cwd(), process.env.DB_SSL_CA) : '';
const caCertificate = process.env.DB_SSL_CA_BASE64
  ? Buffer.from(process.env.DB_SSL_CA_BASE64, 'base64')
  : caPath && existsSync(caPath) ? readFileSync(caPath) : null;
if (sslEnabled && !caCertificate) {
  console.error('Aiven CA certificate is required. Set DB_SSL_CA to a local certificate file or DB_SSL_CA_BASE64 to its base64 contents.');
  process.exit(1);
}

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
  dateStrings: true,
  ssl: sslEnabled ? { ca: caCertificate, rejectUnauthorized: true } : undefined
});

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '20kb' }));
const scrypt = promisify(scryptCallback);

const asyncRoute = handler => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
const publicPassengerFields = 'passenger_id, name, age, gender, contact_number, email, address';
const adminCookieName = 'aero_admin_session';
const adminSessionDurationMs = 8 * 60 * 60 * 1000;
const passengerCookieName = 'aero_passenger_session';
const passengerSessionDurationMs = 7 * 24 * 60 * 60 * 1000;
const staffCookieName = 'aero_staff_session';
const loginAttempts = new Map();
const joinedBooking = `SELECT b.booking_id, b.passenger_id, b.flight_id, DATE_FORMAT(b.booking_date, '%Y-%m-%d') AS booking_date,
  b.seat_number, b.\`class\`, b.payment_status, b.booking_status,
  p.name AS passenger_name, p.age AS passenger_age, p.gender AS passenger_gender,
  p.contact_number AS passenger_contact_number, p.email AS passenger_email, p.address AS passenger_address,
  f.flight_number, f.airline_name, f.departure_airport_id, f.arrival_airport_id, f.flight_status,
  f.departure_time, f.arrival_time,
  dep.airport_id AS dep_id, dep.airport_name AS dep_name, dep.city AS dep_city, dep.state AS dep_state, dep.country AS dep_country, dep.IATA_code AS dep_code,
  arr.airport_id AS arr_id, arr.airport_name AS arr_name, arr.city AS arr_city, arr.state AS arr_state, arr.country AS arr_country, arr.IATA_code AS arr_code
  FROM BOOKING b JOIN PASSENGER p ON p.passenger_id=b.passenger_id
  JOIN FLIGHT f ON f.flight_id=b.flight_id
  JOIN AIRPORT dep ON dep.airport_id=f.departure_airport_id
  JOIN AIRPORT arr ON arr.airport_id=f.arrival_airport_id`;

function asBooking(row) {
  if (!row) return null;
  return {
    booking_id: row.booking_id, passenger_id: row.passenger_id, flight_id: row.flight_id,
    booking_date: row.booking_date, seat_number: row.seat_number, class: row.class,
    payment_status: row.payment_status, booking_status: row.booking_status,
    passenger: {
      passenger_id: row.passenger_id, name: row.passenger_name, age: row.passenger_age,
      gender: row.passenger_gender, contact_number: row.passenger_contact_number,
      email: row.passenger_email, address: row.passenger_address
    },
    flight: {
      flight_id: row.flight_id, flight_number: row.flight_number, airline_name: row.airline_name,
      flight_status: row.flight_status,
      departure_airport_id: row.departure_airport_id, arrival_airport_id: row.arrival_airport_id,
      departure_time: row.departure_time, arrival_time: row.arrival_time,
      departure_airport: { airport_id: row.dep_id, airport_name: row.dep_name, city: row.dep_city, state: row.dep_state, country: row.dep_country, IATA_code: row.dep_code },
      arrival_airport: { airport_id: row.arr_id, airport_name: row.arr_name, city: row.arr_city, state: row.arr_state, country: row.arr_country, IATA_code: row.arr_code }
    }
  };
}

function cleanPassenger(value) {
  if (!value || typeof value !== 'object') throw Object.assign(new Error('Passenger details are required.'), { status: 400 });
  const name = String(value.name || '').trim();
  const age = Number(value.age);
  const gender = String(value.gender || 'Other');
  const contact = String(value.contact_number || '').trim();
  const email = String(value.email || '').trim().toLowerCase();
  const address = String(value.address || '').trim();
  if (name.length < 2 || name.length > 80 || !Number.isInteger(age) || age < 1 || age > 120 ||
      !['Male', 'Female', 'Other'].includes(gender) || contact.length < 8 || contact.length > 15 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 80 || address.length < 2 || address.length > 150) {
    throw Object.assign(new Error('Enter valid name, age, gender, phone, email, and address details.'), { status: 400 });
  }
  return { name, age, gender, contact_number: contact, email, address };
}

function constantTimeMatch(actual, expected) {
  const actualHash = createHash('sha256').update(actual).digest();
  const expectedHash = createHash('sha256').update(expected).digest();
  return timingSafeEqual(actualHash, expectedHash);
}

function getAdminSessionToken(req) {
  const cookieHeader = req.headers.cookie || '';
  const cookie = cookieHeader.split(';').map(part => part.trim()).find(part => part.startsWith(`${adminCookieName}=`));
  return cookie ? cookie.slice(adminCookieName.length + 1) : '';
}

function getCookie(req, name) {
  const cookieHeader = req.headers.cookie || '';
  const cookie = cookieHeader.split(';').map(part => part.trim()).find(part => part.startsWith(`${name}=`));
  return cookie ? cookie.slice(name.length + 1) : '';
}

const sessionTokenHash = token => createHash('sha256').update(token).digest('hex');
async function createSession(token, type, subject, lifetimeMs) {
  await pool.execute('INSERT INTO AUTH_SESSION (token_hash, session_type, subject, expires_at) VALUES (?, ?, ?, ?)', [sessionTokenHash(token), type, String(subject), Date.now() + lifetimeMs]);
}
async function getSessionSubject(token, type) {
  if (!token) return null;
  const tokenHash = sessionTokenHash(token);
  const [rows] = await pool.execute('SELECT subject, expires_at FROM AUTH_SESSION WHERE token_hash=? AND session_type=?', [tokenHash, type]);
  if (!rows.length) return null;
  if (Number(rows[0].expires_at) <= Date.now()) {
    await pool.execute('DELETE FROM AUTH_SESSION WHERE token_hash=?', [tokenHash]);
    return null;
  }
  return rows[0].subject;
}
async function deleteSession(token) {
  if (token) await pool.execute('DELETE FROM AUTH_SESSION WHERE token_hash=?', [sessionTokenHash(token)]);
}

function requireAdmin(req, res, next) {
  const token = getAdminSessionToken(req);
  getSessionSubject(token, 'admin').then(username => {
    if (!username || username !== process.env.ADMIN_USERNAME) return res.status(401).json({ error: 'Admin sign-in required.' });
    req.adminSession = { username };
    next();
  }).catch(next);
}
function requirePassenger(req, res, next) {
  const token = getCookie(req, passengerCookieName);
  getSessionSubject(token, 'passenger').then(passengerId => {
    if (!passengerId) return res.status(401).json({ error: 'Passenger sign-in required.' });
    req.passengerSession = { token, passengerId: Number(passengerId) };
    next();
  }).catch(next);
}
function requireStaff(req, res, next) {
  const token = getCookie(req, staffCookieName);
  getSessionSubject(token, 'staff').then(staffId => {
    if (!staffId) return res.status(401).json({ error: 'Staff sign-in required.' });
    req.staffSession = { staffId: Number(staffId) };
    next();
  }).catch(next);
}

function cleanFlight(value) {
  if (!value || typeof value !== 'object') throw Object.assign(new Error('Flight details are required.'), { status: 400 });
  const flightNumber = String(value.flight_number || '').trim().toUpperCase();
  const airlineName = String(value.airline_name || '').trim();
  const departureAirportId = Number(value.departure_airport_id);
  const arrivalAirportId = Number(value.arrival_airport_id);
  const departureTime = String(value.departure_time || '').trim().replace('T', ' ');
  const arrivalTime = String(value.arrival_time || '').trim().replace('T', ' ');
  const datetime = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(?::\d{2})?$/;
  if (!/^[A-Z0-9-]{2,10}$/.test(flightNumber) || airlineName.length < 2 || airlineName.length > 50 ||
      !Number.isInteger(departureAirportId) || departureAirportId < 1 || !Number.isInteger(arrivalAirportId) || arrivalAirportId < 1 ||
      departureAirportId === arrivalAirportId || !datetime.test(departureTime) || !datetime.test(arrivalTime) || departureTime >= arrivalTime) {
    throw Object.assign(new Error('Enter a valid flight number, airline, different airports, and arrival time after departure.'), { status: 400 });
  }
  return { flightNumber, airlineName, departureAirportId, arrivalAirportId, departureTime: departureTime.length === 16 ? `${departureTime}:00` : departureTime, arrivalTime: arrivalTime.length === 16 ? `${arrivalTime}:00` : arrivalTime };
}

async function createFlight(req, res) {
  const flight = cleanFlight(req.body);
  const [airports] = await pool.execute('SELECT airport_id FROM AIRPORT WHERE airport_id IN (?, ?)', [flight.departureAirportId, flight.arrivalAirportId]);
  if (airports.length !== 2) throw Object.assign(new Error('Choose airports that exist in the airport list.'), { status: 400 });
  const [result] = await pool.execute('INSERT INTO FLIGHT (flight_number, airline_name, departure_airport_id, arrival_airport_id, departure_time, arrival_time, flight_status) VALUES (?, ?, ?, ?, ?, ?, \'Scheduled\')', [flight.flightNumber, flight.airlineName, flight.departureAirportId, flight.arrivalAirportId, flight.departureTime, flight.arrivalTime]);
  res.status(201).json({ flight_id: result.insertId });
}

async function removeFlight(req, res) {
  const flightId = Number(req.params.flightId);
  if (!Number.isInteger(flightId) || flightId < 1) throw Object.assign(new Error('Choose a valid flight.'), { status: 400 });
  const [bookings] = await pool.execute('SELECT COUNT(*) AS booking_count FROM BOOKING WHERE flight_id=?', [flightId]);
  if (!bookings[0] || Number(bookings[0].booking_count) > 0) throw Object.assign(new Error('This flight has booking history and cannot be deleted. Mark it Cancelled to keep its records.'), { status: 409 });
  const [result] = await pool.execute('DELETE FROM FLIGHT WHERE flight_id=?', [flightId]);
  if (!result.affectedRows) throw Object.assign(new Error('Flight not found.'), { status: 404 });
  res.json({ ok: true });
}

function publicPassenger(row) {
  if (!row) return null;
  return { passenger_id: row.passenger_id, name: row.name, age: row.age, gender: row.gender,
    contact_number: row.contact_number, email: row.email, address: row.address };
}

async function issuePassengerSession(req, res, passengerId) {
  const token = randomBytes(32).toString('hex');
  await createSession(token, 'passenger', passengerId, passengerSessionDurationMs);
  const secure = process.env.COOKIE_SECURE === 'true' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${passengerCookieName}=${token}; Path=/api; HttpOnly; SameSite=Lax; Max-Age=${Math.floor(passengerSessionDurationMs / 1000)}${secure}`);
  const [rows] = await pool.execute(`SELECT ${publicPassengerFields} FROM PASSENGER WHERE passenger_id=?`, [passengerId]);
  return publicPassenger(rows[0]);
}

function checkLoginLimit(req, key) {
  const ip = req.socket.remoteAddress || 'unknown';
  const id = `${ip}:${key === 'admin' ? 'admin' : key === 'staff' ? 'staff' : 'passenger'}`;
  const attempt = loginAttempts.get(id) || { count: 0, startedAt: Date.now() };
  if (Date.now() - attempt.startedAt > 15 * 60 * 1000) { attempt.count = 0; attempt.startedAt = Date.now(); }
  if (attempt.count >= 10) return false;
  attempt.count += 1;
  loginAttempts.set(id, attempt);
  return true;
}

app.post('/api/admin/login', asyncRoute(async (req, res) => {
  const username = String(req.body.username || '');
  const password = String(req.body.password || '');
  if (!checkLoginLimit(req, 'admin')) return res.status(429).json({ error: 'Too many sign-in attempts. Try again in 15 minutes.' });
  if (!constantTimeMatch(username, process.env.ADMIN_USERNAME) || !constantTimeMatch(password, process.env.ADMIN_PASSWORD)) {
    return res.status(401).json({ error: 'Username or password is incorrect.' });
  }

  const token = randomBytes(32).toString('hex');
  await createSession(token, 'admin', username, adminSessionDurationMs);
  const secure = process.env.COOKIE_SECURE === 'true' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${adminCookieName}=${token}; Path=/api/admin; HttpOnly; SameSite=Strict; Max-Age=${Math.floor(adminSessionDurationMs / 1000)}${secure}`);
  res.json({ username });
}));

app.get('/api/admin/session', requireAdmin, (_req, res) => {
  res.json({ username: process.env.ADMIN_USERNAME });
});

app.post('/api/admin/logout', asyncRoute(async (req, res) => {
  const token = getAdminSessionToken(req);
  await deleteSession(token);
  res.setHeader('Set-Cookie', `${adminCookieName}=; Path=/api/admin; HttpOnly; SameSite=Strict; Max-Age=0`);
  res.json({ ok: true });
}));

app.post('/api/staff/login', asyncRoute(async (req, res) => {
  const username = String(req.body.username || '');
  const password = String(req.body.password || '');
  if (!checkLoginLimit(req, 'staff')) return res.status(429).json({ error: 'Too many sign-in attempts. Try again in 15 minutes.' });
  const [rows] = await pool.execute('SELECT staff_id, username, password_hash FROM STAFF WHERE username=?', [username]);
  let verified = false;
  if (rows.length && password.length <= 128) {
    const [scheme, salt, expectedHex] = rows[0].password_hash.split('$');
    if (scheme === 'scrypt' && salt && expectedHex) {
      const actual = Buffer.from(await scrypt(password, salt, 64));
      const expected = Buffer.from(expectedHex, 'hex');
      verified = actual.length === expected.length && timingSafeEqual(actual, expected);
    }
  }
  if (!verified) {
    return res.status(401).json({ error: 'Username or password is incorrect.' });
  }
  const token = randomBytes(32).toString('hex');
  await createSession(token, 'staff', rows[0].staff_id, adminSessionDurationMs);
  const secure = process.env.COOKIE_SECURE === 'true' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${staffCookieName}=${token}; Path=/api/staff; HttpOnly; SameSite=Strict; Max-Age=${Math.floor(adminSessionDurationMs / 1000)}${secure}`);
  res.json({ username: rows[0].username });
}));

app.get('/api/staff/session', requireStaff, asyncRoute(async (req, res) => {
  const [rows] = await pool.execute('SELECT staff_id, username, full_name, email, phone FROM STAFF WHERE staff_id=?', [req.staffSession.staffId]);
  if (!rows.length) return res.status(401).json({ error: 'Staff account is no longer active.' });
  res.json(rows[0]);
}));

app.post('/api/staff/logout', asyncRoute(async (req, res) => {
  const token = getCookie(req, staffCookieName);
  await deleteSession(token);
  const secure = process.env.COOKIE_SECURE === 'true' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${staffCookieName}=; Path=/api/staff; HttpOnly; SameSite=Strict; Max-Age=0${secure}`);
  res.json({ ok: true });
}));

const listOperationalFlights = async (_req, res) => {
  const [rows] = await pool.query(`SELECT f.flight_id, f.flight_number, f.airline_name, f.departure_time, f.arrival_time, f.flight_status,
    dep.city AS departure_city, dep.IATA_code AS departure_code, arr.city AS arrival_city, arr.IATA_code AS arrival_code,
    COUNT(a.assignment_id) AS occupied_seats
    FROM FLIGHT f JOIN AIRPORT dep ON dep.airport_id=f.departure_airport_id
    JOIN AIRPORT arr ON arr.airport_id=f.arrival_airport_id
    LEFT JOIN FLIGHT_SEAT_ASSIGNMENT a ON a.flight_id=f.flight_id
    GROUP BY f.flight_id, f.flight_number, f.airline_name, f.departure_time, f.arrival_time, f.flight_status,
      dep.city, dep.IATA_code, arr.city, arr.IATA_code
    ORDER BY f.departure_time LIMIT 500`);
  res.json(rows);
};

app.get('/api/staff/flights', requireStaff, asyncRoute(listOperationalFlights));
app.get('/api/admin/flights', requireAdmin, asyncRoute(listOperationalFlights));

app.post('/api/staff/flights', requireStaff, asyncRoute(createFlight));
app.delete('/api/staff/flights/:flightId', requireStaff, asyncRoute(removeFlight));

app.get('/api/admin/staff', requireAdmin, asyncRoute(async (_req, res) => {
  const [rows] = await pool.query('SELECT staff_id, username, full_name, email, phone, created_at FROM STAFF ORDER BY full_name');
  res.json(rows);
}));

app.post('/api/admin/staff', requireAdmin, asyncRoute(async (req, res) => {
  const username = String(req.body.username || '').trim();
  const fullName = String(req.body.full_name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const phone = String(req.body.phone || '').trim();
  const password = String(req.body.password || '');
  if (!/^[a-zA-Z0-9._-]{3,40}$/.test(username) || fullName.length < 2 || fullName.length > 80 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 120 || phone.length > 20 || password.length < 10 || password.length > 128) {
    throw Object.assign(new Error('Enter a valid username, full name, email, phone, and password of at least 10 characters.'), { status: 400 });
  }
  const salt = randomBytes(16).toString('hex');
  const derived = await scrypt(password, salt, 64);
  const passwordHash = `scrypt$${salt}$${Buffer.from(derived).toString('hex')}`;
  const [result] = await pool.execute('INSERT INTO STAFF (username, password_hash, full_name, email, phone) VALUES (?, ?, ?, ?, ?)', [username, passwordHash, fullName, email, phone || null]);
  res.status(201).json({ staff_id: result.insertId });
}));

app.delete('/api/admin/staff/:staffId', requireAdmin, asyncRoute(async (req, res) => {
  const staffId = Number(req.params.staffId);
  if (!Number.isInteger(staffId) || staffId < 1) throw Object.assign(new Error('Choose a valid staff account.'), { status: 400 });
  const [result] = await pool.execute('DELETE FROM STAFF WHERE staff_id=?', [staffId]);
  if (!result.affectedRows) throw Object.assign(new Error('Staff account not found.'), { status: 404 });
  await pool.execute("DELETE FROM AUTH_SESSION WHERE session_type='staff' AND subject=?", [String(staffId)]);
  res.json({ ok: true });
}));

app.post('/api/admin/flights', requireAdmin, asyncRoute(createFlight));
app.delete('/api/admin/flights/:flightId', requireAdmin, asyncRoute(removeFlight));

app.put('/api/staff/flights/:flightId/status', requireStaff, asyncRoute(async (req, res) => {
  const flightId = Number(req.params.flightId);
  const status = String(req.body.status || '');
  const statuses = ['Scheduled', 'Delayed', 'Boarding', 'Departed', 'Arrived', 'Cancelled'];
  if (!Number.isInteger(flightId) || flightId < 1 || !statuses.includes(status)) throw Object.assign(new Error('Choose a valid flight status.'), { status: 400 });
  const [rows] = await pool.execute('SELECT flight_id, flight_status FROM FLIGHT WHERE flight_id=?', [flightId]);
  if (!rows.length) throw Object.assign(new Error('Flight not found.'), { status: 404 });
  const allowed = {
    Scheduled: ['Scheduled', 'Delayed', 'Boarding', 'Cancelled'], Delayed: ['Delayed', 'Boarding', 'Cancelled'],
    Boarding: ['Boarding', 'Departed', 'Cancelled'], Departed: ['Departed', 'Arrived'], Arrived: ['Arrived'], Cancelled: ['Cancelled']
  };
  if (!allowed[rows[0].flight_status]?.includes(status)) throw Object.assign(new Error('That flight status change is not allowed.'), { status: 409 });
  await pool.execute('UPDATE FLIGHT SET flight_status=? WHERE flight_id=?', [status, flightId]);
  res.json({ ok: true });
}));

app.post('/api/passenger/register', asyncRoute(async (req, res) => {
  if (!checkLoginLimit(req, 'passenger-register')) return res.status(429).json({ error: 'Too many account attempts. Try again in 15 minutes.' });
  const passenger = cleanPassenger(req.body.passenger);
  const password = String(req.body.password || '');
  if (password.length < 10 || password.length > 128) throw Object.assign(new Error('Use a password between 10 and 128 characters.'), { status: 400 });
  const salt = randomBytes(16).toString('hex');
  const derived = await scrypt(password, salt, 64);
  const passwordHash = `scrypt$${salt}$${Buffer.from(derived).toString('hex')}`;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [insert] = await connection.execute('INSERT INTO PASSENGER (name, age, gender, contact_number, email, address) VALUES (?, ?, ?, ?, ?, ?)', [passenger.name, passenger.age, passenger.gender, passenger.contact_number, passenger.email, passenger.address]);
    await connection.execute('INSERT INTO PASSENGER_ACCOUNT (passenger_id, password_hash) VALUES (?, ?)', [insert.insertId, passwordHash]);
    await connection.commit();
    const profile = await issuePassengerSession(req, res, insert.insertId);
    res.status(201).json({ passenger: profile });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally { connection.release(); }
}));

app.post('/api/passenger/login', asyncRoute(async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  if (!checkLoginLimit(req, email)) return res.status(429).json({ error: 'Too many sign-in attempts. Try again in 15 minutes.' });
  const [rows] = await pool.execute(`SELECT a.password_hash, p.passenger_id FROM PASSENGER_ACCOUNT a JOIN PASSENGER p ON p.passenger_id=a.passenger_id WHERE p.email=?`, [email]);
  let verified = false;
  if (rows.length && password.length <= 128) {
    const [scheme, salt, expectedHex] = rows[0].password_hash.split('$');
    if (scheme === 'scrypt' && salt && expectedHex) {
      const actual = Buffer.from(await scrypt(password, salt, 64));
      const expected = Buffer.from(expectedHex, 'hex');
      verified = actual.length === expected.length && timingSafeEqual(actual, expected);
    }
  }
  if (!verified) return res.status(401).json({ error: 'Email or password is incorrect.' });
  const passenger = await issuePassengerSession(req, res, rows[0].passenger_id);
  res.json({ passenger });
}));

app.get('/api/passenger/session', requirePassenger, asyncRoute(async (req, res) => {
  const [rows] = await pool.execute(`SELECT ${publicPassengerFields} FROM PASSENGER WHERE passenger_id=?`, [req.passengerSession.passengerId]);
  if (!rows.length) return res.status(401).json({ error: 'Passenger account not found.' });
  res.json({ passenger: publicPassenger(rows[0]) });
}));

app.post('/api/passenger/logout', asyncRoute(async (req, res) => {
  const token = getCookie(req, passengerCookieName);
  await deleteSession(token);
  const secure = process.env.COOKIE_SECURE === 'true' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${passengerCookieName}=; Path=/api; HttpOnly; SameSite=Lax; Max-Age=0${secure}`);
  res.json({ ok: true });
}));

app.get('/api/admin/tables', requireAdmin, asyncRoute(async (_req, res) => {
  const [passengers, airports, flights, bookings] = await Promise.all([
    pool.query(`SELECT ${publicPassengerFields} FROM PASSENGER ORDER BY passenger_id DESC`),
    pool.query('SELECT airport_id, airport_name, city, state, country, IATA_code FROM AIRPORT ORDER BY airport_id'),
    pool.query('SELECT flight_id, flight_number, airline_name, departure_airport_id, arrival_airport_id, departure_time, arrival_time, flight_status FROM FLIGHT ORDER BY departure_time'),
    pool.query('SELECT booking_id, passenger_id, flight_id, DATE_FORMAT(booking_date, \'%Y-%m-%d\') AS booking_date, seat_number, `class`, payment_status, booking_status FROM BOOKING ORDER BY booking_id DESC LIMIT 500')
  ]);
  res.json({ PASSENGER: passengers[0], AIRPORT: airports[0], FLIGHT: flights[0], BOOKING: bookings[0] });
}));

app.get('/api/health', asyncRoute(async (_req, res) => {
  await pool.query('SELECT 1');
  res.json({ ok: true });
}));

app.get('/api/public/bootstrap', asyncRoute(async (_req, res) => {
  const [[airportRows], [flightRows], [seatRows]] = await Promise.all([
    pool.query('SELECT airport_id, airport_name, city, state, country, IATA_code FROM AIRPORT ORDER BY city'),
    pool.query('SELECT flight_id, flight_number, airline_name, departure_airport_id, arrival_airport_id, departure_time, arrival_time, flight_status FROM FLIGHT ORDER BY departure_time'),
    pool.query('SELECT flight_id, seat_number FROM FLIGHT_SEAT_ASSIGNMENT')
  ]);
  const occupiedSeats = {};
  for (const row of seatRows) (occupiedSeats[String(row.flight_id)] ||= []).push(row.seat_number);
  res.json({ airports: airportRows, flights: flightRows, occupiedSeats });
}));

app.post('/api/bookings', requirePassenger, asyncRoute(async (req, res) => {
  const flightId = Number(req.body.flight_id);
  const seat = String(req.body.seat_number || '').trim().toUpperCase();
  const cabin = String(req.body.class || '');
  const paymentStatus = 'Pending';
  if (!Number.isInteger(flightId)) throw Object.assign(new Error('The selected flight is invalid.'), { status: 400 });
  const seatMatch = seat.match(/^(0[1-9]|1\d|2[0-2])([A-F])$/);
  if (!seatMatch) throw Object.assign(new Error('Choose a valid seat from the seat map.'), { status: 400 });
  if (!['Economy', 'Business'].includes(cabin)) throw Object.assign(new Error('Choose a valid cabin class.'), { status: 400 });
  const seatRow = Number(seatMatch[1]);
  if ((cabin === 'Business' && seatRow > 5) || (cabin === 'Economy' && seatRow < 6)) {
    throw Object.assign(new Error(`Seat ${seat} is not in the ${cabin} cabin.`), { status: 400 });
  }
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [flightRows] = await connection.execute("SELECT flight_id FROM FLIGHT WHERE flight_id = ? AND flight_status <> 'Cancelled' AND departure_time > CONVERT_TZ(UTC_TIMESTAMP(), '+00:00', '+05:30') FOR UPDATE", [flightId]);
    if (!flightRows.length) throw Object.assign(new Error('That flight is no longer available.'), { status: 404 });
    const [occupied] = await connection.execute('SELECT booking_id FROM FLIGHT_SEAT_ASSIGNMENT WHERE flight_id = ? AND seat_number = ? FOR UPDATE', [flightId, seat]);
    if (occupied.length) throw Object.assign(new Error('That seat was just booked. Please choose another seat.'), { status: 409 });

    const passengerId = req.passengerSession.passengerId;
    const [passengerRows] = await connection.execute(`SELECT ${publicPassengerFields} FROM PASSENGER WHERE passenger_id = ? FOR UPDATE`, [passengerId]);
    if (!passengerRows.length) throw Object.assign(new Error('Passenger account not found.'), { status: 401 });
    const savedPassenger = passengerRows[0];
    const [insertBooking] = await connection.execute("INSERT INTO BOOKING (passenger_id, flight_id, booking_date, seat_number, `class`, payment_status, booking_status) VALUES (?, ?, DATE(CONVERT_TZ(UTC_TIMESTAMP(), '+00:00', '+05:30')), ?, ?, ?, 'Confirmed')", [passengerId, flightId, seat, cabin, paymentStatus]);
    await connection.execute('INSERT INTO FLIGHT_SEAT_ASSIGNMENT (flight_id, seat_number, booking_id) VALUES (?, ?, ?)', [flightId, seat, insertBooking.insertId]);
    await connection.commit();
    const [rows] = await pool.query(`${joinedBooking} WHERE b.booking_id = ?`, [insertBooking.insertId]);
    res.status(201).json({ booking: asBooking(rows[0]), passenger: savedPassenger });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally { connection.release(); }
}));

app.get('/api/bookings/lookup', requirePassenger, asyncRoute(async (req, res) => {
  const bookingId = Number(req.query.bookingId);
  if (!Number.isInteger(bookingId) || bookingId < 1) throw Object.assign(new Error('Enter a valid booking number.'), { status: 400 });
  const [rows] = await pool.query(`${joinedBooking} WHERE b.booking_id = ? AND b.passenger_id=? AND b.booking_status='Confirmed' LIMIT 1`, [bookingId, req.passengerSession.passengerId]);
  if (!rows.length) throw Object.assign(new Error('Booking not found.'), { status: 404 });
  res.json(asBooking(rows[0]));
}));

app.post('/api/bookings/cancel', requirePassenger, asyncRoute(async (req, res) => {
  const bookingId = Number(req.body.booking_id);
  if (!Number.isInteger(bookingId) || bookingId < 1) throw Object.assign(new Error('A valid booking number is required.'), { status: 400 });
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [owned] = await connection.execute("SELECT booking_id FROM BOOKING WHERE booking_id=? AND passenger_id=? AND booking_status='Confirmed' FOR UPDATE", [bookingId, req.passengerSession.passengerId]);
    if (!owned.length) throw Object.assign(new Error('Booking not found.'), { status: 404 });
    await connection.execute("UPDATE BOOKING SET booking_status='Cancelled' WHERE booking_id=?", [bookingId]);
    await connection.execute('DELETE FROM FLIGHT_SEAT_ASSIGNMENT WHERE booking_id=?', [bookingId]);
    await connection.commit();
    res.json({ ok: true });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally { connection.release(); }
}));

app.use((error, _req, res, _next) => {
  console.error('API request failed', { code: error.code || 'APP_ERROR', status: error.status || 500 });
  if (error.code === 'ER_DUP_ENTRY' && String(error.message).includes('uq_active_flight_seat')) return res.status(409).json({ error: 'That seat was just booked. Please choose another seat.' });
  if (error.code === 'ER_DUP_ENTRY' && String(error.message).includes('flight_number')) return res.status(409).json({ error: 'A flight with that flight number already exists.' });
  if (error.code === 'ER_DUP_ENTRY' && (String(error.message).includes('username') || String(error.message).includes('email'))) return res.status(409).json({ error: 'A staff account already uses that username or email.' });
  if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'An account already exists for that email address.' });
  if (error.code === 'ER_ROW_IS_REFERENCED_2') return res.status(409).json({ error: 'This flight has booking history and cannot be deleted. Mark it Cancelled to keep its records.' });
  if (error.code === 'ER_NO_REFERENCED_ROW_2') return res.status(400).json({ error: 'That flight or passenger record is not available.' });
  res.status(error.status || 500).json({ error: error.status ? error.message : 'The database request failed. Check the backend connection and schema.' });
});

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'API route not found.' });
  const frontend = path.resolve(process.cwd(), 'public/index.html');
  if (!existsSync(frontend)) return next();
  res.sendFile(frontend);
});

export default app;

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const port = Number(process.env.API_PORT || 4000);
  app.listen(port, '127.0.0.1', () => console.log(`Aero API listening at http://localhost:${port}`));
}
