-- Run this once to set up the database schema

CREATE TABLE IF NOT EXISTS users (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(255)        NOT NULL,
  email       VARCHAR(255) UNIQUE NOT NULL,
  password    VARCHAR(255)        NOT NULL,
  role        VARCHAR(50)         NOT NULL DEFAULT 'trainee',
  required_hours  NUMERIC(8,2)    NOT NULL DEFAULT 486,
  starting_hours  NUMERIC(8,2)    NOT NULL DEFAULT 0,
  company     VARCHAR(255),
  created_at  TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS time_logs (
  id              SERIAL PRIMARY KEY,
  user_id         INTEGER         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date            DATE            NOT NULL,
  time_in         TIMESTAMPTZ     NOT NULL,
  time_out        TIMESTAMPTZ,
  hours_rendered  NUMERIC(8,2)    NOT NULL DEFAULT 0,
  notes           TEXT,
  created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, date)
);

CREATE TABLE IF NOT EXISTS absents (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date        DATE        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, date)
);