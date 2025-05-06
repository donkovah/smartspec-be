import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import dbConfig from '../../typeorm.config';

config();

async function runMigrations() {
  const dataSource = new DataSource(dbConfig);

  try {
    await dataSource.initialize();
    console.log('Running migrations...');
    const migrations = await dataSource.runMigrations();
    console.log(`Successfully ran ${migrations.length} migrations`);
    migrations.forEach(migration => {
      console.log(`- ${migration.name}`);
    });
  } catch (error) {
    console.error('Error running migrations:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
  }
}

void runMigrations(); 