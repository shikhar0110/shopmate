import database from "../database/db.js";

export async function createUserTable() {
  try {
    // If a composite type named 'users' exists but the table doesn't,
    // creating the table will fail because Postgres tries to create a
    // composite type with the same name. Detect that situation and
    // remove the orphan type before creating the table.
    const tableCheck = await database.query("SELECT to_regclass('public.users') AS reg");
    if (tableCheck.rows[0].reg) {
      console.log('Users table already exists, skipping creation');
      return;
    }

    const typeCheck = await database.query("SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'users') AS exists");
    if (typeCheck.rows[0].exists) {
      console.warn("Found an existing Postgres type named 'users' without a table — dropping the orphan type to allow table creation.");
      await database.query("DROP TYPE IF EXISTS users CASCADE");
      console.log("Dropped orphan type 'users'.");
    }
    const query = `
        CREATE TABLE IF NOT EXISTS users (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            name VARCHAR(100) NOT NULL CHECK (char_length(name) >= 3),
            email VARCHAR(100) UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role VARCHAR(10) DEFAULT 'User' CHECK (role IN ('User', 'Admin')),
            avatar JSONB DEFAULT NULL,
            reset_password_token TEXT DEFAULT NULL,
            reset_password_expire TIMESTAMP DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;
    await database.query(query);
  } catch (error) {
    console.error("❌ Failed To Create Users Table.", error);
    // Rethrow so higher-level invoker can decide what to do
    throw error;
  }
}