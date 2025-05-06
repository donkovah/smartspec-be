import { Client } from 'pg';
import { config } from 'dotenv';

config();

async function initializeDatabase() {
  const client = new Client({
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    user: process.env.DB_USERNAME ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'postgres',
    database: 'postgres', // Connect to default postgres database first
  });

  try {
    console.log('Connecting to PostgreSQL...');
    await client.connect();

    // Check if database exists
    const result = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [process.env.DB_DATABASE ?? 'smartspec']
    );

    if (result.rowCount === 0) {
      console.log(`Creating database ${process.env.DB_DATABASE ?? 'smartspec'}...`);
      await client.query(`CREATE DATABASE ${process.env.DB_DATABASE ?? 'smartspec'}`);
      console.log('Database created successfully');
    } else {
      console.log('Database already exists');
    }
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run if this file is executed directly
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log('Database initialization completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Database initialization failed:', error);
      process.exit(1);
    });
}

export { initializeDatabase }; 