# Aero airline booking demo

A React/Vite frontend, Express API, and MySQL database for an Indian domestic airline DBMS project. The airport and flight rows are illustrative sample data, not live schedules or fares. The payment step is a classroom simulation and records every new booking as **Pending**.

## Requirements

- Node.js 22.12 or newer in the 22.x line
- A MySQL database (the original project was configured for Aiven MySQL)

## Database setup

For a **new database**, run `database/schema.sql` in the target database.

For an **existing database from the previous project version**, run `database/migrate-passenger-auth-booking-status.sql`, then `database/migrate-staff-flight-management.sql`, each exactly once before starting this version. They add passenger login and cancellation status, staff accounts, and persistent hashed login sessions.

The migration assumes the earlier schema’s `uq_flight_seat` index name. Take a database backup first and check the schema if you renamed that index. Do not run both the migration and a fresh schema setup against the same existing database.

## Environment setup

1. Copy `.env.example` to `.env`.
2. Fill in the MySQL host, port, user, password, and database name.
3. For TLS, set `DB_SSL=true`, `DB_SSL_CA=database/ca.pem`, and place your provider’s CA certificate at `database/ca.pem`.
4. Set a private `ADMIN_USERNAME` and a long, private `ADMIN_PASSWORD`.
5. For HTTPS production hosting, set `COOKIE_SECURE=true`. Keep it `false` only for local HTTP development.

Never commit or share `.env`, database passwords, or private certificates. The working project copy intentionally contains only `.env.example`; create your own `.env` and certificate locally.

## Run locally

```powershell
npm install
npm run dev:full
```

Open the Vite address shown in the terminal (normally `http://localhost:3000`). Vite forwards `/api` requests to the Express API on port 4000. The API checks database access through `/api/health` and serves public airport/flight sample data from MySQL.

## Passenger and booking flow

- Create a passenger account at **Passenger sign in**. Passwords are stored as salted scrypt hashes in `PASSENGER_ACCOUNT`.
- Sign in before booking. The API associates a booking with the signed-in passenger; it does not accept profile identity from the booking request.
- Search by Indian airport pair and travel date. The seed flight times are illustrative and stored as India Standard Time values.
- Select a seat and create a demo booking. The server assigns the booking date and sets payment status to `Pending`; it does not process card or UPI payments.
- Manage or cancel only bookings owned by the signed-in passenger. Cancellations are retained with `booking_status='Cancelled'`, and the seat becomes available again.

## Admin and project limitations

After creating a fresh database, run `database/schema.sql`. For an existing database, run both migrations listed above in order. Then sign in as admin and create staff accounts from the Admin dashboard. The former shared `STAFF_USERNAME` / `STAFF_PASSWORD` environment login is no longer used.

Admins can create and remove staff accounts and manage flights. Staff can add/remove flights and change statuses through the allowed progression (Scheduled → Delayed/Boarding → Departed → Arrived, with cancellation options), but cannot manage staff accounts. Staff passwords are stored as salted scrypt hashes. Session tokens are hashed in MySQL so staff, admin and passenger sessions continue across Vercel function instances. Login throttling remains process-local. A flight with booking history cannot be deleted; cancel it to preserve booking records. The admin dashboard can inspect up to 500 recent bookings plus passenger, airport, flight and staff records. Marking a flight cancelled does not automatically cancel bookings, notify passengers, or issue refunds.

## Vercel deployment

The repository includes an Express entry point and `vercel.json`; `npm run build` emits the Vite app into `public/` for static delivery. Set the Vercel Node.js version to 22, configure all database and admin environment variables in the Vercel project, and set `COOKIE_SECURE=true`. For MySQL TLS, set `DB_SSL=true` and store the provider CA certificate contents, base64-encoded, in the secret environment variable `DB_SSL_CA_BASE64`. Apply the SQL migration before deploying this version. Vercel supports Express apps and serves files from `public/`. Login throttling remains process-local; replace it with shared storage or platform-level rate limiting before relying on it for public production traffic.

The sample data covers Indian domestic cities and fixed dates only; refresh the seed schedules when they become past. Fare estimates and the 22-row seat map are illustrative UI data. Before a public launch, add real payment integration, email/password recovery, database backups, audit logging, and production HTTPS configuration.

## Logo

The existing `public-assets/logo.png` is copied into the Vercel static output and used for the navigation and browser tab icon.
