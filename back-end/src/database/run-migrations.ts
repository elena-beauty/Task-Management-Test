import { AppDataSource } from './typeorm-datasource';

async function runMigrations() {
  await AppDataSource.initialize();
  try {
    await AppDataSource.runMigrations();
    // eslint-disable-next-line no-console
    console.log('Database migrations executed successfully');
  } finally {
    await AppDataSource.destroy();
  }
}

runMigrations().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Failed to run migrations', error);
  process.exit(1);
});

