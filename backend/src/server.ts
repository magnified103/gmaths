import Fastify from 'fastify';
import cors from '@fastify/cors';
import formbody from '@fastify/formbody';
import multipart from '@fastify/multipart';
import jwt from '@fastify/jwt';
import { Server as SocketIOServer } from 'socket.io';
import { authRoutes } from './routes/authRoutes';
import { adminRoutes } from './routes/adminRoutes';
import { questionRoutes } from './routes/questionRoutes';
import { examRoutes } from './routes/examRoutes';
import { timerRoutes } from './routes/timerRoutes';
import { gradingRoutes } from './routes/gradingRoutes';
import { WebSocketService } from './services/websocketService';

const fastify = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'warn' : 'info'
  }
});

// WebSocket service instance
let websocketService: WebSocketService;

/**
 * Register plugins for CORS, form handling, and file uploads.
 */
async function registerPlugins(): Promise<void> {
  // Simplified CORS configuration for development
  const corsOptions = process.env.NODE_ENV === 'production' 
    ? {
        origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['https://gmaths.edu.vn'],
        credentials: true
      }
    : {
        origin: true, // Allow all origins in development
        credentials: true
      };

  await fastify.register(cors, {
    ...corsOptions,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    preflightContinue: false,
    optionsSuccessStatus: 204
  });

  await fastify.register(formbody);
  await fastify.register(multipart);

  // Register fastify-jwt
  fastify.register(jwt, {
    secret: process.env.JWT_SECRET || 'a-very-secret-key-that-should-be-in-env',
  });

  // TODO: Add rate limiting back with proper TypeScript types
}

/**
 * Setup WebSocket server with Socket.io
 */
function setupWebSocket(): void {
  const io = new SocketIOServer(fastify.server, {
    cors: {
      origin: process.env.NODE_ENV === 'production' 
        ? (process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['https://gmaths.edu.vn'])
        : ['http://localhost:5173', 'http://localhost:3000'],
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  // Initialize WebSocket service
  websocketService = new WebSocketService(io);
  
  fastify.log.info('WebSocket server initialized');
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
  
  // Register exam routes
  await fastify.register(examRoutes, { prefix: '/api' });
  
  // Register timer routes (requires WebSocket service)
  await fastify.register(async (fastify) => {
    await timerRoutes(fastify, websocketService);
  }, { prefix: '/api/timer' });
  
  // Register grading routes
  await fastify.register(gradingRoutes);
}

/**
 * Start the Fastify server.
 */
async function start(): Promise<void> {
  try {
    await registerPlugins();
    
    // Setup WebSocket before routes (needed for timer routes)
    setupWebSocket();
    
    // Register all routes BEFORE starting to listen
    await registerRoutes();
    
    const port = parseInt(process.env.PORT || '3000', 10);
    const host = process.env.HOST || '0.0.0.0';

    await fastify.listen({ port, host });
    
    fastify.log.info(`Server listening on http://${host}:${port}`);
    fastify.log.info('Authentication routes registered at /api/auth/*');
    fastify.log.info('WebSocket server ready for timer synchronization');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  fastify.log.info('Received SIGTERM, closing server gracefully');
  if (websocketService) {
    await websocketService.cleanup();
  }
  await fastify.close();
});

process.on('SIGINT', async () => {
  fastify.log.info('Received SIGINT, closing server gracefully');
  if (websocketService) {
    await websocketService.cleanup();
  }
  await fastify.close();
});

// Start the server
start();
