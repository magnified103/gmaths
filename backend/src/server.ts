import Fastify from 'fastify';
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod';
import { z } from 'zod';
import cors from '@fastify/cors';
import formbody from '@fastify/formbody';
import multipart from '@fastify/multipart';
import jwt from '@fastify/jwt';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { Server as SocketIOServer } from 'socket.io';
import { authRoutes } from './routes/authRoutes';
import { adminRoutes } from './routes/adminRoutes';
import { questionRoutes } from './routes/questionRoutes';
import { examRoutes } from './routes/examRoutes';
import { timerRoutes } from './routes/timerRoutes';
import { gradingRoutes } from './routes/gradingRoutes';
import { roleRoutes } from './routes/roleRoutes';
import { WebSocketService } from './services/websocketService';
import serviceApp from './app';

const fastify = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'warn' : 'info'
  }
});
fastify.setValidatorCompiler(validatorCompiler);
fastify.setSerializerCompiler(serializerCompiler);

/**
 * Register plugins for CORS, form handling, and file uploads.
 */
async function registerPlugins(): Promise<void> {
  // Zod schemas are handled by fastify-type-provider-zod, no need to add them here

  // Register Swagger
  await fastify.register(swagger, {
    openapi: {
      openapi: '3.0.0',
      info: {
        title: 'GMATHS Education API',
        description: 'API documentation for the GMATHS Online Testing Platform backend.',
        version: '1.0.0'
      },
      externalDocs: {
        url: 'https://swagger.io',
        description: 'Find more info here'
      },
      servers: [
        {
          url: 'http://localhost:3000', // Local development server
          description: 'Local Development Server'
        }
      ],
      tags: [
        { name: 'Auth', description: 'User authentication related endpoints' },
        { name: 'Admin', description: 'Admin panel and user management' },
        { name: 'Questions', description: 'Question bank management' },
        { name: 'Exams', description: 'Exam creation, management, and taking' },
        { name: 'Grading', description: 'Exam grading and results' },
        { name: 'Timer', description: 'Real-time timer synchronization' }
      ],
      components: {
        securitySchemes: {
          BearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          }
        }
      },
      security: [
        {
          BearerAuth: []
        }
      ]
    },
    transform: jsonSchemaTransform,
    // transformObject: createJsonSchemaTransform,
  });

  await fastify.register(swaggerUi, {
    routePrefix: '/documentation',
    uiConfig: {
      deepLinking: true,
    },
  });

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
 * Start the Fastify server.
 */
async function start(): Promise<void> {
  try {
    await registerPlugins();
    
    fastify.register(serviceApp);
    
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
  await fastify.close();
});

process.on('SIGINT', async () => {
  fastify.log.info('Received SIGINT, closing server gracefully');
  await fastify.close();
});

// Start the server
start();
