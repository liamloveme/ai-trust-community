require('dotenv').config();
const mysql = require('mysql2/promise');
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'forum',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'trust_forum',
  waitForConnections: true,
  connectTimeout: 3000,
  queueLimit: 100,
  connectionLimit: 10,
  timezone: 'Z',
  dateStrings: true,
  charset: 'utf8mb4'
});
pool.on('connection',connection=>connection.query("SET time_zone = '+00:00'"));
module.exports = {pool};
