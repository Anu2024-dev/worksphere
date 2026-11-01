import app from './app.js';
import { config } from './config/env.js';
import prisma from './config/prisma.js';

const PORT = config.port;

async function startServer() {
  try {
    // Verify database connection and query readiness on startup
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    console.log('PostgreSQL database connected successfully via Prisma.');

    const server = app.listen(PORT, () => {
      console.log(`WorkSphere API Server running at http://localhost:${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/api/health`);
    });

    server.on('error', async (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`[ERROR] Port ${PORT} is already in use (EADDRINUSE).`);
        console.error(`Another WorkSphere backend process or service is already listening on port ${PORT}.`);
        console.error(`Please stop the existing process or set a different PORT in backend/.env.`);
      } else {
        console.error('Backend server encountered an unexpected error:', error);
      }
      await prisma.$disconnect();
      process.exit(1);
    });

    // Graceful shutdown handling
    const shutdown = async () => {
      console.log('Shutting down server gracefully...');
      server.close(async () => {
        await prisma.$disconnect();
        console.log('Server and database connections closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    console.error('Failed to start server:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

startServer();
