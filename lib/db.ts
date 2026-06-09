import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;

export const pool = connectionString
  ? new Pool({
      connectionString,
      ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: false },
    })
  : new Pool({
      user:     process.env.POSTGRES_USER     ?? 'postgres',
      host:     process.env.POSTGRES_HOST     ?? 'localhost',
      database: process.env.POSTGRES_DB       ?? 'upwork_dashboard',
      password: process.env.POSTGRES_PASSWORD ?? '',
      port:     Number(process.env.POSTGRES_PORT) || 5432,
    });