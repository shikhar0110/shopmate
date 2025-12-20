import pkg from "pg";
import dotenv from "dotenv";
const { Pool } = pkg;

// Ensure environment is loaded when this module is imported directly
dotenv.config({ path: "./config/config.env" });

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL is not set");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes("render.com")
    ? { rejectUnauthorized: false }
    : false
});

export default pool;
