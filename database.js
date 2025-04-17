const { Pool } = require("pg");
require("dotenv").config();

// Create a new PostgreSQL connection pool
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Initialize the database with the required table
const initDatabase = async () => {
  try {
    // Create the users table if it doesn't exist
    // Add the certificate_path field to the users table in database.js
    await pool.query(`
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    father_name VARCHAR(100),
    dob VARCHAR(20),
    blood_group VARCHAR(10),
    education VARCHAR(100),
    occupation VARCHAR(100),
    aadhar VARCHAR(20),
    voter_id VARCHAR(20),
    member_no VARCHAR(20),
    branch VARCHAR(100),
    district VARCHAR(100),
    photo_path VARCHAR(255),
    certificate_path VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`);
    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Error initializing database:", error);
  }
};

module.exports = {
  pool,
  initDatabase,
};
