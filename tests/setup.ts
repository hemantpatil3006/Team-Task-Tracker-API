import 'dotenv/config';
import { prisma } from '../src/config/database';

// Override to test database
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;

// Ensure clean DB connection for tests
afterAll(async () => {
  await prisma.$disconnect();
});
