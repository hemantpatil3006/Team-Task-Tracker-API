import 'dotenv/config';
import app from './app';
import { config } from './config';
import { prisma } from './config/database';
import { getRedisClient } from './config/redis';

async function main() {
  // Verify DB connection
  await prisma.$connect();
  console.log('[DB] Connected to PostgreSQL');

  // Verify Redis connection
  const redis = getRedisClient();
  await redis.connect();
  console.log('[Redis] Connection verified');

  const server = app.listen(config.port, () => {
    console.log(`\n🚀 Team Task Tracker API`);
    console.log(`   Listening on: http://localhost:${config.port}`);
    console.log(`   Docs:         http://localhost:${config.port}/api/docs`);
    console.log(`   Health:       http://localhost:${config.port}/health`);
    console.log(`   Environment:  ${config.nodeEnv}\n`);
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`\n[Server] Received ${signal}, shutting down gracefully...`);
    server.close(async () => {
      await prisma.$disconnect();
      await redis.quit();
      console.log('[Server] Shutdown complete');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  console.error('[Server] Fatal startup error:', err);
  process.exit(1);
});
