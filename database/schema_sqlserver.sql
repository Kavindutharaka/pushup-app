-- Weekend Fitness Challenge - ONLINE schema (Microsoft SQL Server / T-SQL)
--
-- The game now stores all data online. The AngularJS front-end (sup/db-service.js)
-- sends T-SQL statements to the shared endpoint:
--
--   POST https://mas.phvtech.com/api/Master/sp
--   { "SysID": "<T-SQL statement>" }   ->   [ {row}, ... ]  (JSON array of rows)
--
-- These tables are already created on the server. This file is kept only as a
-- reference / for re-creating them if needed. (The old MySQL schema.sql and the
-- PHP API under /server are no longer used.)

IF OBJECT_ID('moov_fit_sessions','U') IS NULL
CREATE TABLE moov_fit_sessions (
    session_id          INT IDENTITY(1,1) PRIMARY KEY,
    challenge_type      VARCHAR(30) NOT NULL,   -- pushup | plank | basketball | football | quickreaction
    session_start_time  DATETIME NOT NULL,
    session_end_time    DATETIME NULL,
    status              VARCHAR(20) NOT NULL DEFAULT 'active',  -- active | completed
    created_at          DATETIME DEFAULT GETDATE()
);

IF OBJECT_ID('moov_fit_scores','U') IS NULL
CREATE TABLE moov_fit_scores (
    score_id        INT IDENTITY(1,1) PRIMARY KEY,
    session_id      INT NOT NULL DEFAULT 0,
    challenge_type  VARCHAR(30) NOT NULL,
    player_name     VARCHAR(255) NOT NULL,
    player_contact  VARCHAR(50) NULL,
    score           INT NOT NULL,
    played_at       DATETIME NOT NULL,
    created_at      DATETIME DEFAULT GETDATE()
);

IF OBJECT_ID('moov_fit_winners','U') IS NULL
CREATE TABLE moov_fit_winners (
    winner_id       INT IDENTITY(1,1) PRIMARY KEY,
    session_id      INT NOT NULL,
    challenge_type  VARCHAR(30) NOT NULL,
    rank_position   INT NOT NULL,           -- 1, 2 or 3
    player_name     VARCHAR(255) NOT NULL,
    player_contact  VARCHAR(50) NULL,
    score           INT NOT NULL,
    won_at          DATETIME NOT NULL,
    created_at      DATETIME DEFAULT GETDATE()
);
