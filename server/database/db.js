import pkg from "pg";
const { Client } = pkg;
import fs from "fs";
import path from "path";

let dbUser = process.env.DB_USER;
let dbHost = process.env.DB_HOST;
let dbDatabase = process.env.DB_DATABASE;
let dbPassword = typeof process.env.DB_PASSWORD === "string" ? process.env.DB_PASSWORD.replace(/^\"|\"$/g, "") : process.env.DB_PASSWORD;
let dbPort = process.env.DB_PORT;

if (!dbUser || !dbHost || !dbDatabase) {
  try {
    const envPath = path.resolve(process.cwd(), "./config/config.env");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf8");
      const parse = (key) => {
        const re = new RegExp(`^${key}\\s*=\\s*(.*)$`, "m");
        const m = content.match(re);
        if (m && m[1]) return m[1].trim().replace(/^\"|\"$/g, "");
        return undefined;
      };
      dbUser = dbUser || parse("DB_USER");
      dbHost = dbHost || parse("DB_HOST");
      dbDatabase = dbDatabase || parse("DB_DATABASE");
      dbPassword = dbPassword || parse("DB_PASSWORD");
      dbPort = dbPort || parse("DB_PORT");
      console.log("DB env fallback: read values from config/config.env");
    }
  } catch (err) {
    console.warn("Failed to read config.env for DB fallback", err.message || err);
  }
}

const database = new Client({
  user: dbUser,
  host: dbHost,
  database: dbDatabase,
  password: dbPassword ? String(dbPassword) : undefined,
  port: dbPort ? Number(dbPort) : undefined,
});
// Log the DB connection target (do not log sensitive values like passwords)
console.log(
  `Attempting DB connection as user='${process.env.DB_USER}' host='${process.env.DB_HOST}' database='${process.env.DB_DATABASE}' port='${process.env.DB_PORT}'`
);

try {
  await database.connect();
  console.log("Database connected successfully");
} catch (error) {
  console.error("Database connection error", error);
  process.exit(1);
}

export default database;
