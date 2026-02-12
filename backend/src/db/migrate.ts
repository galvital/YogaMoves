import { runMigrations } from './index';

async function main() {
  console.log('🔄 Running database migrations...');
  try {
    await runMigrations();
    console.log('✅ Migrations completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}