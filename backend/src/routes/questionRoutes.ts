/**
 * Question management API routes
 * Provides RESTful endpoints for question CRUD operations, categories, and tags
 */

import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { questionService } from '../services/questionService';
import { authenticate, requirePermission } from '../utils/authMiddleware';
import type {
  CreateQuestionRequest,
  UpdateQuestionRequest,
  QuestionFilters,
  CreateCategoryRequest,
  CreateTagRequest,
} from '../types/questions';

/**
 * Route parameters and body schemas
 */
interface QuestionParams {
  id: string;
}

interface QuestionListQuery {
  page?: string;
  limit?: string;
  search?: string;
  type?: string;
  categoryId?: string;
  difficulty?: string;
  tagIds?: string;
  createdById?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface CategoryParams {
  id: string;
}

interface TagParams {
  id: string;
}

/**
 * Question routes registration
 * @param fastify - Fastify instance
 */
export async function questionRoutes(fastify: FastifyInstance) {
  /**
   * GET /api/questions
   * Get paginated list of questions with filtering
   */
  fastify.get<{ Querystring: QuestionListQuery }>('/', {
    preHandler: authenticate
  }, async (request, reply) => {
    try {
      console.log('Question route accessed with query:', request.query);
      
      const {
        page = '1',
        limit = '20',
        search,
        type,
        categoryId,
        difficulty,
        tagIds,
        createdById,
        sortBy,
        sortOrder = 'desc'
      } = request.query;

      const filters: QuestionFilters = {};
      if (search) filters.search = search;
      if (type) filters.type = type as any;
      if (categoryId) filters.categoryId = categoryId;
      if (difficulty) filters.difficulty = difficulty as any;
      if (tagIds) filters.tagIds = tagIds.split(',');
      if (createdById) filters.createdById = createdById;
      if (sortBy) filters.sortBy = sortBy as any;
      if (sortOrder) filters.sortOrder = sortOrder;

      console.log('Parsed filters:', filters);

      const pageNum = parseInt(page, 10) || 1;
      const limitNum = parseInt(limit, 10) || 20;

      console.log('Calling questionService.getQuestions with:', { filters, pageNum, limitNum });

      const result = await questionService.getQuestions(
        filters,
        pageNum,
        limitNum
      );

      console.log('Successfully fetched questions:', result);

      reply.send({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error in GET /api/questions:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      
      reply.code(500).send({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to fetch questions'
      });
    }
  });

  /**
   * GET /api/questions/:id
   * Get a single question by ID
   */
  fastify.get<{ Params: QuestionParams }>('/:id', {
    preHandler: authenticate
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const question = await questionService.getQuestionById(id);

      if (!question) {
        return reply.code(404).send({
          error: 'Not Found',
          message: 'Question not found'
        });
      }

      reply.send({
        success: true,
        data: question
      });
    } catch (error) {
      reply.code(500).send({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to fetch question'
      });
    }
  });

  /**
   * POST /api/questions
   * Create a new question (Admin only)
   */
  fastify.post<{ Body: CreateQuestionRequest }>('/', {
    preHandler: [authenticate, requirePermission('create', 'Question')]
  }, async (request, reply) => {
    try {
      // @ts-ignore
      const userId = request.userId;
      
      const question = await questionService.createQuestion(request.body, userId);

      reply.code(201).send({
        success: true,
        data: question,
        message: 'Question created successfully'
      });
    } catch (error) {
      const statusCode = error instanceof Error && error.message.includes('Admin access required') ? 403 : 400;
      reply.code(statusCode).send({
        error: statusCode === 403 ? 'Forbidden' : 'Bad Request',
        message: error instanceof Error ? error.message : 'Failed to create question'
      });
    }
  });

  /**
   * PUT /api/questions/:id
   * Update an existing question (Admin only)
   */
  fastify.put<{ Params: QuestionParams; Body: UpdateQuestionRequest }>('/:id', {
    preHandler: [authenticate, requirePermission('update', 'Question')]
  }, async (request, reply) => {
    try {
      // @ts-ignore
      const userId = request.userId;
      const { id } = request.params;

      const updateData = { ...request.body, id };
      const question = await questionService.updateQuestion(id, updateData, userId);

      reply.send({
        success: true,
        data: question,
        message: 'Question updated successfully'
      });
    } catch (error) {
      let statusCode = 400; // Default to Bad Request
      
      if (error instanceof Error) {
        if (error.message.includes('Admin access required')) {
          statusCode = 403;
        } else if (error.message.includes('not found')) {
          statusCode = 404;
        }
      }
      
      reply.code(statusCode).send({
        error: statusCode === 403 ? 'Forbidden' : statusCode === 404 ? 'Not Found' : 'Bad Request',
        message: error instanceof Error ? error.message : 'Failed to update question'
      });
    }
  });

  /**
   * DELETE /api/questions/:id
   * Soft delete a question (Admin only)
   */
  fastify.delete<{ Params: QuestionParams }>('/:id', {
    preHandler: [authenticate, requirePermission('delete', 'Question')]
  }, async (request, reply) => {
    try {
      // @ts-ignore
      const userId = request.userId;
      const { id } = request.params;

      await questionService.deleteQuestion(id, userId);

      reply.send({
        success: true,
        message: 'Question deleted successfully'
      });
    } catch (error) {
      let statusCode = 400; // Default to Bad Request
      
      if (error instanceof Error) {
        if (error.message.includes('Admin access required')) {
          statusCode = 403;
        } else if (error.message.includes('not found')) {
          statusCode = 404;
        }
      }
      
      reply.code(statusCode).send({
        error: statusCode === 403 ? 'Forbidden' : statusCode === 404 ? 'Not Found' : 'Bad Request',
        message: error instanceof Error ? error.message : 'Failed to delete question'
      });
    }
  });

  /**
   * GET /api/questions/categories
   * Get all question categories
   */
  fastify.get('/categories', {
    preHandler: authenticate
  }, async (request, reply) => {
    try {
      const categories = await questionService.getCategories();

      reply.send({
        success: true,
        data: categories
      });
    } catch (error) {
      reply.code(500).send({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to fetch categories'
      });
    }
  });

  /**
   * POST /api/questions/categories
   * Create a new question category (Admin only)
   */
  fastify.post<{ Body: CreateCategoryRequest }>('/categories', {
    preHandler: [authenticate, requirePermission('create', 'Category')]
  }, async (request, reply) => {
    try {
      const category = await questionService.createCategory(request.body);

      reply.code(201).send({
        success: true,
        data: category,
        message: 'Category created successfully'
      });
    } catch (error) {
      const statusCode = error instanceof Error && error.message.includes('Admin access required') ? 403 : 400;
      reply.code(statusCode).send({
        error: statusCode === 403 ? 'Forbidden' : 'Bad Request',
        message: error instanceof Error ? error.message : 'Failed to create category'
      });
    }
  });

  /**
   * GET /api/questions/tags
   * Get all question tags
   */
  fastify.get('/tags', {
    preHandler: authenticate
  }, async (request, reply) => {
    try {
      const tags = await questionService.getTags();

      reply.send({
        success: true,
        data: tags
      });
    } catch (error) {
      reply.code(500).send({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to fetch tags'
      });
    }
  });

  /**
   * POST /api/questions/tags
   * Create a new question tag (Admin only)
   */
  fastify.post<{ Body: CreateTagRequest }>('/tags', {
    preHandler: [authenticate, requirePermission('create', 'Tag')]
  }, async (request, reply) => {
    try {
      const tag = await questionService.createTag(request.body);

      reply.code(201).send({
        success: true,
        data: tag,
        message: 'Tag created successfully'
      });
    } catch (error) {
      const statusCode = error instanceof Error && error.message.includes('Admin access required') ? 403 : 400;
      reply.code(statusCode).send({
        error: statusCode === 403 ? 'Forbidden' : 'Bad Request',
        message: error instanceof Error ? error.message : 'Failed to create tag'
      });
    }
  });

  /**
   * POST /api/questions/bulk-import
   * Bulk import questions from CSV (Admin only)
   * TODO: Implement in future step
   */
  fastify.post('/bulk-import', {
    preHandler: [authenticate, requirePermission('import', 'Question')]
  }, async (request, reply) => {
    try {
      reply.code(501).send({
        error: 'Not Implemented',
        message: 'Bulk import functionality will be implemented in a future step'
      });
    } catch (error) {
      reply.code(403).send({
        error: 'Forbidden',
        message: 'Admin access required'
      });
    }
  });

  /**
   * GET /api/questions/export
   * Export questions to CSV (Admin only)
   * TODO: Implement in future step
   */
  fastify.get('/export', {
    preHandler: [authenticate, requirePermission('export', 'Question')]
  }, async (request, reply) => {
    try {
      reply.code(501).send({
        error: 'Not Implemented',
        message: 'Export functionality will be implemented in a future step'
      });
    } catch (error) {
      reply.code(403).send({
        error: 'Forbidden',
        message: 'Admin access required'
      });
    }
  });
}
