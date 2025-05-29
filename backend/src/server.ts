import Fastify from 'fastify';
import cors from '@fastify/cors';
import formbody from '@fastify/formbody';
import multipart from '@fastify/multipart';
import { authRoutes } from './routes/authRoutes';

const fastify = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'warn' : 'info'
  }
});

/**
 * Register plugins for CORS, form handling, and file uploads.
 */
async function registerPlugins(): Promise<void> {
  await fastify.register(cors, {
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://gmaths.edu.vn'] 
      : ['http://localhost:5173'],
    credentials: true
  });

  await fastify.register(formbody);
  await fastify.register(multipart);

  // TODO: Add rate limiting back with proper TypeScript types
}

/**
 * Register application routes.
 */
async function registerRoutes(): Promise<void> {
  // Health check endpoint
  fastify.get('/health', async (request, reply) => {
    return { 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      service: 'gmaths-backend'
    };
  });

  // API health check
  fastify.get('/api/health', async (request, reply) => {
    return { 
      status: 'ok',
      message: 'GMATHS API is running',
      timestamp: new Date().toISOString()
    };
  });

  // Register authentication routes
  await fastify.register(authRoutes, { prefix: '/api' });
}

/**
 * Start the Fastify server.
 */
async function start(): Promise<void> {
  try {
    await registerPlugins();
    await registerRoutes();

    const port = parseInt(process.env.PORT || '3000', 10);
    const host = process.env.HOST || '0.0.0.0';

    await fastify.listen({ port, host });
    
    fastify.log.info(`Server listening on http://${host}:${port}`);
    fastify.log.info('Authentication routes registered at /api/auth/*');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  fastify.log.info('Received SIGTERM, closing server gracefully');
  await fastify.close();
});

process.on('SIGINT', async () => {
  fastify.log.info('Received SIGINT, closing server gracefully');
  await fastify.close();
});

// Start the server
start(); 