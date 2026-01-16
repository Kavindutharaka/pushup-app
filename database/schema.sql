-- Weekend Fitness Challenge Database Schema
-- This schema tracks all game sessions, player scores, and session winners

-- Create database
CREATE DATABASE IF NOT EXISTS fitness_challenge;
USE fitness_challenge;

-- Sessions table - tracks each leaderboard reset as a new session
CREATE TABLE IF NOT EXISTS sessions (
    session_id INT AUTO_INCREMENT PRIMARY KEY,
    challenge_type ENUM('pushup', 'plank', 'basketball', 'football', 'quickreaction') NOT NULL,
    session_start_time DATETIME NOT NULL,
    session_end_time DATETIME NULL,
    status ENUM('active', 'completed') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_challenge_status (challenge_type, status),
    INDEX idx_challenge_type (challenge_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Player scores table - all individual game attempts
CREATE TABLE IF NOT EXISTS player_scores (
    score_id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    challenge_type ENUM('pushup', 'plank', 'basketball', 'football', 'quickreaction') NOT NULL,
    player_name VARCHAR(255) NOT NULL,
    player_contact VARCHAR(50),
    score INT NOT NULL,
    played_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES sessions(session_id) ON DELETE CASCADE,
    INDEX idx_session (session_id),
    INDEX idx_challenge (challenge_type),
    INDEX idx_played_at (played_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Session winners table - top 3 winners when leaderboard is reset
CREATE TABLE IF NOT EXISTS session_winners (
    winner_id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    challenge_type ENUM('pushup', 'plank', 'basketball', 'football', 'quickreaction') NOT NULL,
    rank_position TINYINT NOT NULL CHECK (rank_position IN (1, 2, 3)),
    player_name VARCHAR(255) NOT NULL,
    player_contact VARCHAR(50),
    score INT NOT NULL,
    won_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES sessions(session_id) ON DELETE CASCADE,
    UNIQUE KEY unique_session_rank (session_id, rank_position),
    INDEX idx_challenge_rank (challenge_type, rank_position),
    INDEX idx_session_id (session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert initial active sessions for each challenge
INSERT INTO sessions (challenge_type, session_start_time, status) VALUES
    ('pushup', NOW(), 'active'),
    ('plank', NOW(), 'active'),
    ('basketball', NOW(), 'active'),
    ('football', NOW(), 'active'),
    ('quickreaction', NOW(), 'active')
ON DUPLICATE KEY UPDATE status = status;
