import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_DATABASE ?? 'smartspec',
  entities: ['dist/**/*.entity{.ts,.js}'],
  synchronize: process.env.NODE_ENV !== 'production',
  logging: process.env.NODE_ENV !== 'production',
  // Connection pooling configuration
  extra: {
    // Maximum number of clients in the pool
    max: parseInt(process.env.DB_POOL_MAX ?? '20', 10),
    // Minimum number of clients in the pool
    min: parseInt(process.env.DB_POOL_MIN ?? '4', 10),
    // Maximum time (ms) that a client can be idle before being removed
    idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT ?? '30000', 10),
    // Maximum time (ms) to wait for a client to become available
    connectionTimeoutMillis: parseInt(process.env.DB_POOL_CONNECTION_TIMEOUT ?? '2000', 10),
  },
  // SSL configuration for production
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false,
  } : false,
})); 