import 'dotenv/config';
import type { Config } from 'drizzle-kit';

export default {
  schema: './src/lib/db/schema.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.POSTGRES_VECTOR_URL!,
  },
  verbose: true,
  strict: true,
} satisfies Config; 