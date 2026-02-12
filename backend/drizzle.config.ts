import type { Config } from 'drizzle-kit';
import path from 'path';

export default {
  schema: './src/db/schema.ts',
  out: './migrations',
  driver: 'better-sqlite',
  dbCredentials: {
    url: path.join(process.cwd(), 'data', 'yogamoves.db'),
  },
  verbose: true,
  strict: true,
} satisfies Config;