import { initializeDatabase } from './init-db';
import { DataSource } from 'typeorm';
import dbConfig from '../../typeorm.config';

async function startup() {
  try {
    console.log('Starting application initialization...');
    
    // Initialize database if it doesn't exist
    await initializeDatabase();
    console.log('Database initialization completed');
    
    // Initialize data source and run migrations
    const dataSource = new DataSource(dbConfig);
    await dataSource.initialize();
    console.log('Running migrations...');
    const migrations = await dataSource.runMigrations();
    console.log(`Successfully ran ${migrations.length} migrations`);
    migrations.forEach(migration => {
      console.log(`- ${migration.name}`);
    });
    await dataSource.destroy();
    
    console.log('Application initialization completed successfully');
  } catch (error) {
    console.error('Error during application initialization:', error);
    process.exit(1);
  }
}

// Run startup if this file is executed directly
if (require.main === module) {
  void startup();
}

export { startup }; 