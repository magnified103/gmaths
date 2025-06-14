/**
 * Question service for managing questions, categories, and tags
 * Provides CRUD operations with validation and LaTeX processing
 */

import { PrismaClient, Prisma } from '@prisma/client';
import type {
  CreateQuestionRequest,
  UpdateQuestionRequest,
  QuestionWithRelations,
  QuestionListResponse,
  QuestionFilters,
  QuestionValidationResult,
  QuestionValidationError,
  CreateCategoryRequest,
  CreateTagRequest,
  QuestionTypeData,
  QuestionTypeEnum,
  DifficultyEnum,
} from '../types/questions';

const prisma = new PrismaClient();

/**
 * Question service class with all business logic
 */
export class QuestionService {
  /**
   * Convert standardized lowercase question type to Prisma enum format
   * @param type - Standardized question type
   * @returns Prisma enum value
   */
  private toPrismaQuestionType(type: QuestionTypeEnum): string {
    const typeMap: Record<QuestionTypeEnum, string> = {
      'multiple-choice': 'MULTIPLE_CHOICE',
      'multiple-select': 'MULTIPLE_SELECT',
      'true-false': 'TRUE_FALSE',
      'fill-blank': 'FILL_BLANK',
      'essay': 'ESSAY'
    };
    return typeMap[type];
  }

  /**
   * Convert Prisma enum to standardized lowercase question type
   * @param type - Prisma enum value
   * @returns Standardized question type
   */
  private fromPrismaQuestionType(type: string): QuestionTypeEnum {
    const typeMap: Record<string, QuestionTypeEnum> = {
      'MULTIPLE_CHOICE': 'multiple-choice',
      'MULTIPLE_SELECT': 'multiple-select',
      'TRUE_FALSE': 'true-false',
      'FILL_BLANK': 'fill-blank',
      'ESSAY': 'essay'
    };
    return typeMap[type] || type.toLowerCase() as QuestionTypeEnum;
  }

  /**
   * Convert standardized lowercase difficulty to Prisma enum format
   * @param difficulty - Standardized difficulty
   * @returns Prisma enum value
   */
  private toPrismaDifficulty(difficulty: DifficultyEnum): string {
    const difficultyMap: Record<DifficultyEnum, string> = {
      'easy': 'EASY',
      'medium': 'MEDIUM',
      'hard': 'HARD'
    };
    return difficultyMap[difficulty];
  }

  /**
   * Convert Prisma enum to standardized lowercase difficulty
   * @param difficulty - Prisma enum value
   * @returns Standardized difficulty
   */
  private fromPrismaDifficulty(difficulty: string): DifficultyEnum {
    const difficultyMap: Record<string, DifficultyEnum> = {
      'EASY': 'easy',
      'MEDIUM': 'medium',
      'HARD': 'hard'
    };
    return difficultyMap[difficulty] || difficulty.toLowerCase() as DifficultyEnum;
  }

  /**
   * Creates a new question with validation
   * @param data - Question creation data
   * @param createdById - ID of the user creating the question
   * @returns Created question with relations
   */
  async createQuestion(
    data: CreateQuestionRequest, 
    createdById: string
  ): Promise<QuestionWithRelations> {
    // Validate question data
    const validation = await this.validateQuestion(data);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
    }

    // Validate LaTeX content
    const latexValidation = this.validateLatexContent(data.content);
    if (!latexValidation.isValid) {
      throw new Error(`LaTeX validation failed: ${latexValidation.errors.map(e => e.message).join(', ')}`);
    }

    // Prepare tag connections
    const tagConnections = data.tagIds?.map(tagId => ({
      tag: { connect: { id: tagId } }
    })) || [];

    try {
      const question = await prisma.question.create({
        data: {
          type: this.toPrismaQuestionType(data.type) as any, // Prisma enum
          content: data.content,
          explanation: data.explanation,
          points: data.points,
          difficulty: this.toPrismaDifficulty(data.difficulty) as any, // Prisma enum
          imageUrl: data.imageUrl, // Include image URL for question images
          typeData: data.typeData as Prisma.InputJsonValue,
          categoryId: data.categoryId,
          createdById,
          tags: {
            create: tagConnections
          }
        },
        include: {
          category: true,
          tags: {
            include: {
              tag: true
            }
          },
          createdBy: {
            select: {
              id: true,
              username: true
            }
          }
        }
      });

      return this.formatQuestionResponse(question);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new Error('Question with this content already exists');
        }
      }
      throw new Error(`Failed to create question: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Updates an existing question
   * @param id - Question ID
   * @param data - Update data
   * @param userId - ID of the user making the update
   * @returns Updated question with relations
   */
  async updateQuestion(
    id: string, 
    data: UpdateQuestionRequest,
    userId: string
  ): Promise<QuestionWithRelations> {
    // Check if question exists and user has permission
    const existing = await prisma.question.findUnique({
      where: { id, isDeleted: false }
    });

    if (!existing) {
      throw new Error('Question not found');
    }

    // For now, allow any admin to edit. In future, add ownership checks
    // if (existing.createdById !== userId) {
    //   throw new Error('Unauthorized to edit this question');
    // }

    // Validate if content is being updated
    if (data.content) {
      const latexValidation = this.validateLatexContent(data.content);
      if (!latexValidation.isValid) {
        throw new Error(`LaTeX validation failed: ${latexValidation.errors.map(e => e.message).join(', ')}`);
      }
    }

    try {
      // Prepare update data
      const updateData: any = {};
      if (data.type) updateData.type = this.toPrismaQuestionType(data.type) as any;
      if (data.content) updateData.content = data.content;
      if (data.explanation !== undefined) updateData.explanation = data.explanation;
      if (data.points) updateData.points = data.points;
      if (data.difficulty) updateData.difficulty = this.toPrismaDifficulty(data.difficulty) as any;
      if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
      if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl; // Handle image URL updates
      if (data.typeData) updateData.typeData = data.typeData as Prisma.InputJsonValue;

      // Handle tag updates if provided
      if (data.tagIds) {
        // Delete existing tag relations
        await prisma.questionTag.deleteMany({
          where: { questionId: id }
        });

        // Create new tag relations
        if (data.tagIds.length > 0) {
          updateData.tags = {
            create: data.tagIds.map(tagId => ({
              tag: { connect: { id: tagId } }
            }))
          };
        }
      }

      const question = await prisma.question.update({
        where: { id },
        data: updateData,
        include: {
          category: true,
          tags: {
            include: {
              tag: true
            }
          },
          createdBy: {
            select: {
              id: true,
              username: true
            }
          }
        }
      });

      return this.formatQuestionResponse(question);
    } catch (error) {
      throw new Error(`Failed to update question: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Gets a question by ID
   * @param id - Question ID
   * @returns Question with relations or null if not found
   */
  async getQuestionById(id: string): Promise<QuestionWithRelations | null> {
    const question = await prisma.question.findUnique({
      where: { id, isDeleted: false },
      include: {
        category: true,
        tags: {
          include: {
            tag: true
          }
        },
        createdBy: {
          select: {
            id: true,
            username: true
          }
        }
      }
    });

    return question ? this.formatQuestionResponse(question) : null;
  }

  /**
   * Gets a paginated list of questions with filtering
   * @param filters - Search and filter options
   * @param page - Page number (1-based)
   * @param limit - Number of items per page
   * @returns Paginated question list
   */
  async getQuestions(
    filters: QuestionFilters = {},
    page: number = 1,
    limit: number = 20
  ): Promise<QuestionListResponse> {
    // Build where clause
    const where: Prisma.QuestionWhereInput = {
      isDeleted: false
    };

    // Search filter
    if (filters.search) {
      where.OR = [
        { content: { contains: filters.search, mode: 'insensitive' } },
        { explanation: { contains: filters.search, mode: 'insensitive' } },
        { category: { name: { contains: filters.search, mode: 'insensitive' } } }
      ];
    }

    // Type filter
    if (filters.type && filters.type.toUpperCase() !== 'ALL') {
      where.type = this.toPrismaQuestionType(filters.type as QuestionTypeEnum) as any;
    }

    // Category filter
    if (filters.categoryId && filters.categoryId !== 'all') {
      where.categoryId = filters.categoryId;
    }

    // Difficulty filter
    if (filters.difficulty && filters.difficulty.toUpperCase() !== 'ALL') {
      where.difficulty = this.toPrismaDifficulty(filters.difficulty as DifficultyEnum) as any;
    }

    // Tag filter
    if (filters.tagIds && filters.tagIds.length > 0) {
      where.tags = {
        some: {
          tagId: {
            in: filters.tagIds
          }
        }
      };
    }

    // Created by filter
    if (filters.createdById) {
      where.createdById = filters.createdById;
    }

    // Build order by clause
    const orderBy: Prisma.QuestionOrderByWithRelationInput = {};
    if (filters.sortBy) {
      switch (filters.sortBy) {
        case 'category':
          orderBy.category = { name: filters.sortOrder || 'asc' };
          break;
        default:
          orderBy[filters.sortBy] = filters.sortOrder || 'asc';
      }
    } else {
      orderBy.createdAt = 'desc'; // Default sort
    }

    const skip = (page - 1) * limit;

    try {
      const [questions, total] = await Promise.all([
        prisma.question.findMany({
          where,
          orderBy,
          skip,
          take: limit,
          include: {
            category: true,
            tags: {
              include: {
                tag: true
              }
            },
            createdBy: {
              select: {
                id: true,
                username: true
              }
            }
          }
        }),
        prisma.question.count({ where })
      ]);

      return {
        questions: questions.map(q => this.formatQuestionResponse(q)),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      throw new Error(`Failed to fetch questions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Soft deletes a question
   * @param id - Question ID
   * @param userId - ID of the user performing the deletion
   */
  async deleteQuestion(id: string, userId: string): Promise<void> {
    const question = await prisma.question.findUnique({
      where: { id, isDeleted: false }
    });

    if (!question) {
      throw new Error('Question not found');
    }

    // For now, allow any admin to delete. In future, add ownership checks
    // if (question.createdById !== userId) {
    //   throw new Error('Unauthorized to delete this question');
    // }

    await prisma.question.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date()
      }
    });
  }

  /**
   * Creates a new question category
   * @param data - Category creation data
   * @returns Created category
   */
  async createCategory(data: CreateCategoryRequest) {
    try {
      return await prisma.questionCategory.create({
        data: {
          name: data.name,
          description: data.description,
          color: data.color,
          parentId: data.parentId
        }
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new Error('Category with this name already exists');
        }
      }
      throw new Error(`Failed to create category: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Gets all question categories
   * @returns List of categories with hierarchy
   */
  async getCategories() {
    return await prisma.questionCategory.findMany({
      include: {
        parent: true,
        children: true,
        _count: {
          select: {
            questions: {
              where: { isDeleted: false }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });
  }

  /**
   * Creates a new tag
   * @param data - Tag creation data
   * @returns Created tag
   */
  async createTag(data: CreateTagRequest) {
    try {
      return await prisma.tag.create({
        data: {
          name: data.name,
          color: data.color
        }
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new Error('Tag with this name already exists');
        }
      }
      throw new Error(`Failed to create tag: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Gets all tags
   * @returns List of tags
   */
  async getTags() {
    return await prisma.tag.findMany({
      include: {
        _count: {
          select: {
            questions: {
              where: {
                question: { isDeleted: false }
              }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });
  }

  /**
   * Validates question data
   * @param data - Question data to validate
   * @returns Validation result
   */
  private async validateQuestion(data: CreateQuestionRequest): Promise<QuestionValidationResult> {
    const errors: QuestionValidationError[] = [];
    const warnings: QuestionValidationError[] = [];

    // Basic validation
    if (!data.content || data.content.trim().length === 0) {
      errors.push({
        field: 'content',
        message: 'Question content is required',
        code: 'REQUIRED'
      });
    }

    if (data.points <= 0) {
      errors.push({
        field: 'points',
        message: 'Question points must be greater than 0',
        code: 'INVALID_VALUE'
      });
    }

    // Type-specific validation
    const typeValidation = this.validateTypeSpecificData(data.type, data.typeData);
    errors.push(...typeValidation.errors);
    warnings.push(...typeValidation.warnings);

    // Category validation
    if (data.categoryId) {
      const categoryExists = await prisma.questionCategory.findUnique({
        where: { id: data.categoryId }
      });
      if (!categoryExists) {
        errors.push({
          field: 'categoryId',
          message: 'Selected category does not exist',
          code: 'NOT_FOUND'
        });
      }
    }

    // Tag validation
    if (data.tagIds && data.tagIds.length > 0) {
      const existingTags = await prisma.tag.findMany({
        where: { id: { in: data.tagIds } }
      });
      const missingTags = data.tagIds.filter(
        tagId => !existingTags.some(tag => tag.id === tagId)
      );
      if (missingTags.length > 0) {
        errors.push({
          field: 'tagIds',
          message: `Tags not found: ${missingTags.join(', ')}`,
          code: 'NOT_FOUND'
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validates type-specific question data
   * @param type - Question type
   * @param typeData - Type-specific data
   * @returns Validation result
   */
  private validateTypeSpecificData(
    type: QuestionTypeEnum, 
    typeData: QuestionTypeData
  ): QuestionValidationResult {
    const errors: QuestionValidationError[] = [];
    const warnings: QuestionValidationError[] = [];

    switch (type) {
      case 'multiple-choice':
      case 'multiple-select':
        const mcData = typeData as any;
        if (!mcData.options || !Array.isArray(mcData.options)) {
          errors.push({
            field: 'typeData.options',
            message: 'Options array is required',
            code: 'REQUIRED'
          });
        } else {
          if (mcData.options.length < 2) {
            errors.push({
              field: 'typeData.options',
              message: 'At least 2 options are required',
              code: 'MIN_LENGTH'
            });
          }

          const correctOptions = mcData.options.filter((opt: any) => opt.isCorrect);
          if (type === 'multiple-choice' && correctOptions.length !== 1) {
            errors.push({
              field: 'typeData.options',
              message: 'Exactly one correct option is required for multiple choice',
              code: 'INVALID_COUNT'
            });
          } else if (type === 'multiple-select' && correctOptions.length === 0) {
            errors.push({
              field: 'typeData.options',
              message: 'At least one correct option is required for multiple select',
              code: 'MIN_COUNT'
            });
          }

          // Check for empty option text
          mcData.options.forEach((opt: any, index: number) => {
            if (!opt.text || opt.text.trim().length === 0) {
              errors.push({
                field: `typeData.options[${index}].text`,
                message: `Option ${index + 1} text is required`,
                code: 'REQUIRED'
              });
            }
          });
        }
        break;

      case 'true-false':
        const tfData = typeData as any;
        if (typeof tfData.correctAnswer !== 'boolean') {
          errors.push({
            field: 'typeData.correctAnswer',
            message: 'Correct answer must be true or false',
            code: 'INVALID_TYPE'
          });
        }
        break;

      case 'fill-blank':
        const fbData = typeData as any;
        if (!fbData.blanks || !Array.isArray(fbData.blanks)) {
          errors.push({
            field: 'typeData.blanks',
            message: 'Blanks array is required',
            code: 'REQUIRED'
          });
        } else if (fbData.blanks.length === 0) {
          errors.push({
            field: 'typeData.blanks',
            message: 'At least one blank is required',
            code: 'MIN_LENGTH'
          });
        }
        break;

      case 'essay':
        const essayData = typeData as any;
        if (essayData.maxWords && essayData.minWords && essayData.maxWords < essayData.minWords) {
          errors.push({
            field: 'typeData',
            message: 'Maximum words cannot be less than minimum words',
            code: 'INVALID_RANGE'
          });
        }
        break;
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validates LaTeX content for basic syntax errors
   * @param content - LaTeX content to validate
   * @returns Validation result
   */
  private validateLatexContent(content: string): QuestionValidationResult {
    const errors: QuestionValidationError[] = [];
    const warnings: QuestionValidationError[] = [];

    // Basic LaTeX syntax checks
    const openBraces = (content.match(/\{/g) || []).length;
    const closeBraces = (content.match(/\}/g) || []).length;
    
    if (openBraces !== closeBraces) {
      errors.push({
        field: 'content',
        message: 'Unmatched curly braces in LaTeX content',
        code: 'LATEX_SYNTAX'
      });
    }

    // Check for common LaTeX errors
    const invalidCommands = content.match(/\\[a-zA-Z]+\s*\{\s*\}/g);
    if (invalidCommands) {
      warnings.push({
        field: 'content',
        message: 'Empty LaTeX commands found, consider reviewing',
        code: 'LATEX_WARNING'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Formats question response to match expected frontend interface
   * @param question - Raw question from database
   * @returns Formatted question response
   */
  private formatQuestionResponse(question: any): QuestionWithRelations {
    return {
      ...question,
      type: this.fromPrismaQuestionType(question.type),
      difficulty: this.fromPrismaDifficulty(question.difficulty),
      tags: question.tags.map((qt: any) => ({
        ...qt.tag,
        questionTag: {
          questionId: qt.questionId,
          tagId: qt.tagId
        }
      }))
    };
  }
}

// Export singleton instance
export const questionService = new QuestionService(); 