import Fastify from 'fastify';
import cors from '@fastify/cors';
import formbody from '@fastify/formbody';
import multipart from '@fastify/multipart';
import { authRoutes } from './routes/authRoutes';
import { adminRoutes } from './routes/adminRoutes';
import { questionRoutes } from './routes/questionRoutes';

const fastify = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'warn' : 'info'
  }
});

/**
 * Register plugins for CORS, form handling, and file uploads.
 */
async function registerPlugins(): Promise<void> {
  // Simplified CORS configuration for development
  const corsOptions = process.env.NODE_ENV === 'production' 
    ? {
        origin: ['https://gmaths.edu.vn'],
        credentials: true
      }
    : {
        origin: true, // Allow all origins in development
        credentials: true
      };

  await fastify.register(cors, {
    ...corsOptions,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    preflightContinue: false,
    optionsSuccessStatus: 204
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
  
  // Register admin routes
  await fastify.register(adminRoutes, { prefix: '/api' });
  
  // Register question routes
  await fastify.register(questionRoutes, { prefix: '/api/questions' });
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