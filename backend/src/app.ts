import { FastifyInstance, FastifyPluginOptions } from 'fastify'
import { serializerCompiler, validatorCompiler, ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod';
import { hasZodFastifySchemaValidationErrors } from 'fastify-type-provider-zod';
import { Server as SocketIOServer } from 'socket.io';
import { authRoutes } from './routes/authRoutes';
import { adminRoutes } from './routes/adminRoutes';
import { questionRoutes } from './routes/questionRoutes';
import { examRoutes } from './routes/examRoutes';
import { timerRoutes } from './routes/timerRoutes';
import { gradingRoutes } from './routes/gradingRoutes';
import { roleRoutes } from './routes/roleRoutes';
import { permissionRoutes } from './routes/permissionRoutes';
import { WebSocketService } from './services/websocketService';
import { globalErrorHandler } from './utils/errors';


export default async function serviceApp(
  fastify: FastifyInstance,
) {
  fastify.setValidatorCompiler(validatorCompiler);
  fastify.setSerializerCompiler(serializerCompiler);

  // Setup error handling before registering routes
  fastify.setErrorHandler(globalErrorHandler);

  // Health check endpoint
  fastify.withTypeProvider<ZodTypeProvider>().get('/health', {
    schema: {
      summary: 'Health Check',
      description: 'Checks the health of the backend service.',
      tags: ['System'],
      response: {
        200: z.object({
          status: z.string(),
          timestamp: z.string().datetime(),
          service: z.string()
        })
      }
    }
  }, async (request, reply) => {
    return { 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      service: 'gmaths-backend'
    };
  });

  // API health check
  fastify.withTypeProvider<ZodTypeProvider>().get('/api/health', async (request, reply) => {
    return { 
      status: 'ok',
      message: 'GMATHS API is running',
      timestamp: new Date().toISOString()
    };
  });

  // Register authentication routes
  await fastify.register(authRoutes, { prefix: '/api' });

  // Register role routes
  await fastify.register(roleRoutes, { prefix: '/api' });

  // Register permission routes
  await fastify.register(permissionRoutes, { prefix: '/api' });
  
  // Register admin routes
  await fastify.register(adminRoutes, { prefix: '/api' });
  
  // Register question routes
  await fastify.register(questionRoutes, { prefix: '/api/questions' });
  
  // Register exam routes
  await fastify.register(examRoutes, { prefix: '/api' });

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
  const websocketService = new WebSocketService(io);
  
  // Register timer routes (requires WebSocket service)
  await fastify.register(async (fastify) => {
    await timerRoutes(fastify, websocketService);
  }, { prefix: '/api/timer' });
  
  // // Register grading routes
  await fastify.register(gradingRoutes);

  fastify.addHook('onClose', async (instance) => {
    if (websocketService) {
      await websocketService.cleanup();
    }
  });
}
