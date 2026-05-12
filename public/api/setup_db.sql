-- New Morning Star Public School - Database Setup
-- Use this script in Hostinger phpMyAdmin (SQL tab)

CREATE TABLE IF NOT EXISTS school_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    data_type VARCHAR(50) NOT NULL,
    session_id VARCHAR(20) NOT NULL,
    content LONGTEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY (data_type, session_id)
);

-- Optional: Initial data types you might want to pre-seed
-- INSERT INTO school_data (data_type, session_id, content) VALUES ('sessions_list', 'global', '["2023-24", "2024-25", "2025-26", "2026-27"]');
