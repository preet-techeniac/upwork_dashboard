import { neon } from '@neondatabase/serverless';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;

// High-performance stateless HTTP client for serverless environments (Vercel)
// Bypasses TCP connection limits and TCP/SSL handshakes, offering extremely low latency.
const sql = connectionString ? neon(connectionString, { fullResults: true }) : null;

const localPool = connectionString
  ? null
  : new Pool({
      user:     process.env.POSTGRES_USER     ?? 'postgres',
      host:     process.env.POSTGRES_HOST     ?? 'localhost',
      database: process.env.POSTGRES_DB       ?? 'upwork_dashboard',
      password: process.env.POSTGRES_PASSWORD ?? '',
      port:     Number(process.env.POSTGRES_PORT) || 5432,
    });

export const pool = {
  query: async (text: string, params?: any[]) => {
    if (sql) {
      return await (sql as any).query(text, params);
    }
    if (localPool) {
      return await localPool.query(text, params);
    }
    throw new Error('Database connection is not configured');
  },
  end: async () => {
    if (localPool) {
      await localPool.end();
    }
  }
};