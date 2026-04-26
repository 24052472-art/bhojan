const { Client } = require('pg');

// Project ID: djkyjxsgtpyrlegepydg
// Password: provided by user
const connectionString = "postgresql://postgres:9749939797%40abhi@db.djkyjxsgtpyrlegepydg.supabase.co:5432/postgres";

async function repair() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log("Connected to DB...");
    
    console.log("Adding columns...");
    await client.query(`
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_email TEXT;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS settled_by TEXT;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS settled_at TIMESTAMPTZ DEFAULT NOW();
    `);
    
    console.log("Reloading schema cache...");
    await client.query("NOTIFY pgrst, 'reload schema';");
    
    console.log("SUCCESS: Database repaired and cache flushed!");
  } catch (err) {
    console.error("REPAIR ERROR:", err);
  } finally {
    await client.end();
  }
}

repair();
