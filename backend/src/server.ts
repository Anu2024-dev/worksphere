import app from './app.js';
import { config } from './config/env.js';
import prisma from './config/prisma.js';

const PORT = config.port;

async function startServer() {
  try {
    // Verify database connection on startup
    await prisma.$connect();
    console.log('PostgreSQL database connected successfully via Prisma.');

    const server = app.listen(PORT, () => {
      console.log(`WorkSphere API Server running at http://localhost:${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/api/health`);
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
