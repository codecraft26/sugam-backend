// TypeORM DataSource configuration
// This is the single source of truth for TypeORM configuration
// Used by both the application and TypeORM CLI (via ormconfig.ts)
import { DataSource } from 'typeorm';
import { config } from './env';
import { readdirSync } from 'fs';
import path from 'path';

// Function to get migration files, excluding seed files
// At runtime, only load compiled .js files to avoid TypeScript loading issues
function getMigrations(): string[] {
  try {
    const migrationsDir = path.join(process.cwd(), 'migrations');
    const files = readdirSync(migrationsDir);
    // Only load .js files at runtime (compiled migrations)
    // TypeORM CLI will handle .ts files directly
    return files
      .filter(file => 
        file.endsWith('.js') && // Only .js files at runtime
        !file.includes('seed')
      )
      .map(file => path.join(migrationsDir, file));
  } catch (error) {
    // If migrations directory doesn't exist, return empty array
    return [];
  }
}

// Connection pool configuration
// Default values are optimized for production workloads
// Can be overridden via environment variables
const poolConfig = {
  max: config.DB_POOL_MAX || 20, // Maximum number of connections in the pool
  min: config.DB_POOL_MIN || 5, // Minimum number of connections in the pool
  idleTimeoutMillis: config.DB_POOL_IDLE_TIMEOUT || 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: config.DB_POOL_CONNECTION_TIMEOUT || 2000, // Return an error after 2 seconds if connection cannot be established
};

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: config.DB_HOST,
  port: config.DB_PORT,
  username: config.DB_USER,
  password: config.DB_PASSWORD,
  database: config.DB_NAME,
  // Paths relative to project root
  // Always use dist (compiled JS) at runtime to avoid loading TypeScript files
  // TypeORM CLI uses ts-node and can load .ts files directly
  entities: ['dist/**/*.model.js'],
  // Load migrations dynamically, excluding seed files
  migrations: getMigrations(),
  synchronize: false, // Never use true in production
  logging: config.NODE_ENV === 'development',
  ssl: config.DB_SSL ? { rejectUnauthorized: false } : false,
  migrationsTableName: 'migrations',
  // Connection pooling configuration
  extra: {
    max: poolConfig.max, // Maximum number of clients in the pool
    min: poolConfig.min, // Minimum number of clients in the pool
    idleTimeoutMillis: poolConfig.idleTimeoutMillis, // Close idle clients after this many milliseconds
    connectionTimeoutMillis: poolConfig.connectionTimeoutMillis, // Return an error after this many milliseconds if a connection cannot be established
    // Additional pool settings
    statement_timeout: 30000, // Query timeout in milliseconds (30 seconds)
    query_timeout: 30000, // Query timeout in milliseconds
  },
});

