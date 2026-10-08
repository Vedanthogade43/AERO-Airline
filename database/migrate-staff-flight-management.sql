-- Run once against an existing Aero database to enable admin-managed staff and flight CRUD.
-- New databases get these objects from schema.sql.

CREATE TABLE IF NOT EXISTS STAFF (
  staff_id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(40) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(80) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  phone VARCHAR(20),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS AUTH_SESSION (
  token_hash CHAR(64) PRIMARY KEY,
  session_type VARCHAR(12) NOT NULL,
  subject VARCHAR(120) NOT NULL,
  expires_at BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_auth_session_expiry (expires_at),
  CONSTRAINT chk_auth_session_type CHECK (session_type IN ('admin', 'staff', 'passenger'))
) ENGINE=InnoDB;
