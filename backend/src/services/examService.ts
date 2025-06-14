/**
 * Exam service for managing exams and exam questions
 * Provides CRUD operations with validation and scheduling logic
 */

import { PrismaClient, Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import type {
  CreateExamRequest,
  UpdateExamRequest,
  ExamWithRelations,
  ExamListResponse,
  ExamFilters,
  ExamValidationResult,
  ExamValidationError,
  ExamPreview,
  ExamSettings,
  ExamQueryOptions,
  ExamStatistics,
  ScheduleValidation,
  ExamStatus,
  FeedbackType,
  NavigationType,
  ExamAvailability,
  ExamForTakingResponse,
  TakeableExamsResponse,
  ExamSubmission,
  ExamSubmissionResult,
  ExamAnswer,
} from '../types/exam';
import GradingService from './gradingService';
import { ExamSessionService } from './examSessionService';

const prisma = new PrismaClient();

/**
 * Exam service class with all business logic
 */
export class ExamService {
  private gradingService: GradingService;
  private sessionService: ExamSessionService;

  constructor() {
    this.gradingService = new GradingService();
    this.sessionService = new ExamSessionService();
  }

  /**
   * Convert Prisma enum to standardized lowercase question type
   * @param type - Prisma enum value
   * @returns Standardized question type
   */
  private fromPrismaQuestionType(type: string): string {
    const typeMap: Record<string, string> = {
      'MULTIPLE_CHOICE': 'multiple-choice',
      'MULTIPLE_SELECT': 'multiple-select',
      'TRUE_FALSE': 'true-false',
      'FILL_BLANK': 'fill-blank',
      'ESSAY': 'essay'
    };
    return typeMap[type] || type.toLowerCase();
  }

  /**
   * Creates a new exam with validation
   * @param data - Exam creation data
   * @param createdById - ID of the user creating the exam
   * @returns Created exam with relations
   */
  async createExam(
    data: CreateExamRequest,
    createdById: string
  ): Promise<ExamWithRelations> {
    // Validate exam data
    const validation = await this.validateExam(data);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
    }

    // Validate questions exist
    if (data.questionIds.length === 0) {
      throw new Error('Exam must have at least one question');
    }

    const existingQuestions = await prisma.question.findMany({
      where: { 
        id: { in: data.questionIds },
        isDeleted: false 
      },
      select: { id: true }
    });

    if (existingQuestions.length !== data.questionIds.length) {
      throw new Error('Some questions do not exist or have been deleted');
    }

    // Validate schedule conflicts
    const scheduleValidation = await this.validateSchedule(data.startDate, data.endDate);
    if (!scheduleValidation.isValid) {
      throw new Error(`Schedule conflicts detected: ${scheduleValidation.conflicts.map(c => c.title).join(', ')}`);
    }

    try {
      // Prepare settings object
      const settings: ExamSettings = {
        timeLimit: data.timeLimit,
        maxAttempts: data.maxAttempts,
        shuffleQuestions: data.shuffleQuestions,
        shuffleAnswers: data.shuffleAnswers,
        showResults: data.showResults,
        showCorrectAnswers: data.showCorrectAnswers,
        feedbackType: data.feedbackType,
        navigationType: data.navigationType,
        allowReview: data.allowReview,
        requireFullscreen: data.requireFullscreen,
        preventCopyPaste: data.preventCopyPaste,
        startDate: data.startDate,
        endDate: data.endDate,
      };

      // Hash password if provided
      if (data.password) {
        const saltRounds = 12;
        settings.password = await bcrypt.hash(data.password, saltRounds);
      }

      const exam = await prisma.exam.create({
        data: {
          title: data.title,
          description: data.description,
          instructions: data.instructions,
          settings: settings as unknown as Prisma.InputJsonValue,
          status: 'DRAFT',
          createdById,
          questions: {
            create: data.questionIds.map((questionId, index) => ({
              questionId,
              order: index + 1,
              points: data.questionPoints?.[questionId] || undefined,
            }))
          }
        },
        include: {
          createdBy: {
            select: {
              id: true,
              username: true,
            }
          },
          questions: {
            include: {
              question: {
                select: {
                  id: true,
                  content: true,
                  type: true,
                  points: true,
                  difficulty: true,
                  category: {
                    select: {
                      id: true,
                      name: true,
                    }
                  }
                }
              }
            },
            orderBy: {
              order: 'asc'
            }
          }
        }
      });

      return this.formatExamResponse(exam);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new Error('Exam with this title already exists');
        }
      }
      throw new Error(`Failed to create exam: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Updates an existing exam
   * @param id - Exam ID
   * @param data - Update data
   * @param userId - ID of the user making the update
   * @returns Updated exam with relations
   */
  async updateExam(
    id: string,
    data: UpdateExamRequest,
    userId: string
  ): Promise<ExamWithRelations> {
    // Check if exam exists and user has permission
    const existing = await prisma.exam.findUnique({
      where: { id, isDeleted: false },
      include: { questions: true }
    });

    if (!existing) {
      throw new Error('Exam not found');
    }

    // For now, allow any admin to edit. In future, add ownership checks
    // if (existing.createdById !== userId) {
    //   throw new Error('Unauthorized to edit this exam');
    // }

    // Prevent editing published exams unless changing status
    if (existing.status === 'PUBLISHED' && data.status !== 'ARCHIVED') {
      const allowedFields = ['status'];
      const providedFields = Object.keys(data).filter(key => key !== 'id');
      const hasDisallowedChanges = providedFields.some(field => !allowedFields.includes(field));
      
      if (hasDisallowedChanges) {
        throw new Error('Cannot modify published exam content. Archive first to make changes.');
      }
    }

    try {
      // Prepare update data
      const updateData: any = {};
      
      if (data.title) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.instructions !== undefined) updateData.instructions = data.instructions;
      if (data.status) updateData.status = data.status;

      // Update settings if provided
      if (this.hasSettingsUpdate(data)) {
        const currentSettings = existing.settings as unknown as ExamSettings;
        const newSettings: ExamSettings = {
          ...currentSettings,
          ...(data.timeLimit && { timeLimit: data.timeLimit }),
          ...(data.maxAttempts && { maxAttempts: data.maxAttempts }),
          ...(data.shuffleQuestions !== undefined && { shuffleQuestions: data.shuffleQuestions }),
          ...(data.shuffleAnswers !== undefined && { shuffleAnswers: data.shuffleAnswers }),
          ...(data.showResults !== undefined && { showResults: data.showResults }),
          ...(data.showCorrectAnswers !== undefined && { showCorrectAnswers: data.showCorrectAnswers }),
          ...(data.feedbackType && { feedbackType: data.feedbackType }),
          ...(data.navigationType && { navigationType: data.navigationType }),
          ...(data.allowReview !== undefined && { allowReview: data.allowReview }),
          ...(data.requireFullscreen !== undefined && { requireFullscreen: data.requireFullscreen }),
          ...(data.preventCopyPaste !== undefined && { preventCopyPaste: data.preventCopyPaste }),
          ...(data.startDate !== undefined && { startDate: data.startDate }),
          ...(data.endDate !== undefined && { endDate: data.endDate }),
        };

        // Handle password update
        if (data.password !== undefined) {
          if (data.password) {
            const saltRounds = 12;
            newSettings.password = await bcrypt.hash(data.password, saltRounds);
          } else {
            delete newSettings.password;
          }
        }

        updateData.settings = newSettings as unknown as Prisma.InputJsonValue;
      }

      // Handle question updates if provided
      if (data.questionIds) {
        // Validate questions exist
        const existingQuestions = await prisma.question.findMany({
          where: { 
            id: { in: data.questionIds },
            isDeleted: false 
          },
          select: { id: true }
        });

        if (existingQuestions.length !== data.questionIds.length) {
          throw new Error('Some questions do not exist or have been deleted');
        }

        // Delete existing question relations
        await prisma.examQuestion.deleteMany({
          where: { examId: id }
        });

        // Create new question relations
        if (data.questionIds.length > 0) {
          updateData.questions = {
            create: data.questionIds.map((questionId, index) => ({
              questionId,
              order: index + 1,
              points: data.questionPoints?.[questionId] || undefined,
            }))
          };
        }
      }

      const exam = await prisma.exam.update({
        where: { id },
        data: updateData,
        include: {
          createdBy: {
            select: {
              id: true,
              username: true,
            }
          },
          questions: {
            include: {
              question: {
                select: {
                  id: true,
                  content: true,
                  type: true,
                  points: true,
                  difficulty: true,
                  category: {
                    select: {
                      id: true,
                      name: true,
                    }
                  }
                }
              }
            },
            orderBy: {
              order: 'asc'
            }
          }
        }
      });

      return this.formatExamResponse(exam);
    } catch (error) {
      throw new Error(`Failed to update exam: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Gets an exam by ID
   * @param id - Exam ID
   * @param options - Query options
   * @returns Exam with relations or null if not found
   */
  async getExamById(id: string, options: ExamQueryOptions = {}): Promise<ExamWithRelations | null> {
    const {
      includeQuestions = true,
      includeCreatedBy = true,
      includeDeleted = false,
      questionDetails = true
    } = options;

    const whereClause: any = { id };
    if (!includeDeleted) {
      whereClause.isDeleted = false;
    }

    const includeClause: any = {};
    
    if (includeCreatedBy) {
      includeClause.createdBy = {
        select: {
          id: true,
          username: true,
        }
      };
    }

    if (includeQuestions) {
      includeClause.questions = {
        orderBy: {
          order: 'asc'
        }
      };
      
      if (questionDetails) {
        includeClause.questions.include = {
          question: {
            select: {
              id: true,
              content: true,
              type: true,
              points: true,
              difficulty: true,
              category: {
                select: {
                  id: true,
                  name: true,
                }
              }
            }
          }
        };
      }
    }

    const exam = await prisma.exam.findUnique({
      where: whereClause,
      include: includeClause
    });

    if (!exam) {
      return null;
    }

    return this.formatExamResponse(exam);
  }

  /**
   * Gets paginated list of exams with filtering
   * @param filters - Filtering options
   * @param page - Page number (1-based)
   * @param limit - Items per page
   * @returns Paginated exam list
   */
  async getExams(
    filters: ExamFilters = {},
    page: number = 1,
    limit: number = 20
  ): Promise<ExamListResponse> {
    const skip = (page - 1) * limit;
    
    // Build where clause
    const whereClause: any = {
      isDeleted: false
    };

    if (filters.search) {
      whereClause.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    if (filters.status && filters.status !== 'ALL') {
      whereClause.status = filters.status;
    }

    if (filters.createdById) {
      whereClause.createdById = filters.createdById;
    }

    // Date filtering would need to parse settings JSON - simplified for now
    if (filters.startDate || filters.endDate) {
      // This would require JSON path queries in production
      // For now, we'll skip this complex filtering
    }

    // Build order clause
    const orderBy: any = {};
    if (filters.sortBy) {
      if (filters.sortBy === 'startDate' || filters.sortBy === 'endDate') {
        // JSON field sorting is complex, default to createdAt
        orderBy.createdAt = filters.sortOrder || 'desc';
      } else {
        orderBy[filters.sortBy] = filters.sortOrder || 'desc';
      }
    } else {
      orderBy.createdAt = 'desc';
    }

    try {
      const [exams, total] = await Promise.all([
        prisma.exam.findMany({
          where: whereClause,
          include: {
            createdBy: {
              select: {
                id: true,
                username: true,
              }
            },
            questions: {
              include: {
                question: {
                  select: {
                    id: true,
                    content: true,
                    type: true,
                    points: true,
                    difficulty: true,
                    category: {
                      select: {
                        id: true,
                        name: true,
                      }
                    }
                  }
                }
              },
              orderBy: {
                order: 'asc'
              }
            }
          },
          orderBy,
          skip,
          take: limit,
        }),
        prisma.exam.count({ where: whereClause })
      ]);

      const formattedExams = exams.map(exam => this.formatExamResponse(exam));
      const totalPages = Math.ceil(total / limit);

      return {
        exams: formattedExams,
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      throw new Error(`Failed to fetch exams: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Soft deletes an exam
   * @param id - Exam ID
   * @param userId - ID of the user deleting the exam
   */
  async deleteExam(id: string, userId: string): Promise<void> {
    const exam = await prisma.exam.findUnique({
      where: { id, isDeleted: false }
    });

    if (!exam) {
      throw new Error('Exam not found');
    }

    // For now, allow any admin to delete. In future, add ownership checks
    // if (exam.createdById !== userId) {
    //   throw new Error('Unauthorized to delete this exam');
    // }

    try {
      await prisma.exam.update({
        where: { id },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
        }
      });
    } catch (error) {
      throw new Error(`Failed to delete exam: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Publishes an exam (changes status from DRAFT to PUBLISHED)
   * @param id - Exam ID
   * @param userId - ID of the user publishing the exam
   * @returns Updated exam
   */
  async publishExam(id: string, userId: string): Promise<ExamWithRelations> {
    const exam = await this.getExamById(id);
    if (!exam) {
      throw new Error('Exam not found');
    }

    if (exam.status !== 'DRAFT') {
      throw new Error('Only draft exams can be published');
    }

    // Validate exam is ready for publishing
    const validation = await this.validateExamForPublishing(exam);
    if (!validation.isValid) {
      throw new Error(`Cannot publish exam: ${validation.errors.map(e => e.message).join(', ')}`);
    }

    return this.updateExam(id, { id, status: 'PUBLISHED' }, userId);
  }

  /**
   * Archives an exam (changes status to ARCHIVED)
   * @param id - Exam ID
   * @param userId - ID of the user archiving the exam
   * @returns Updated exam
   */
  async archiveExam(id: string, userId: string): Promise<ExamWithRelations> {
    const exam = await this.getExamById(id);
    if (!exam) {
      throw new Error('Exam not found');
    }

    if (exam.status === 'ARCHIVED') {
      throw new Error('Exam is already archived');
    }

    return this.updateExam(id, { id, status: 'ARCHIVED' }, userId);
  }

  /**
   * Duplicates an exam
   * @param id - Exam ID to duplicate
   * @param newTitle - Optional new title
   * @param userId - ID of the user duplicating the exam
   * @returns Duplicated exam
   */
  async duplicateExam(id: string, newTitle: string | undefined, userId: string): Promise<ExamWithRelations> {
    const originalExam = await this.getExamById(id);
    if (!originalExam) {
      throw new Error('Exam not found');
    }

    const duplicateData: CreateExamRequest = {
      title: newTitle || `${originalExam.title} (Copy)`,
      description: originalExam.description,
      instructions: originalExam.instructions,
      timeLimit: (originalExam.settings as ExamSettings).timeLimit,
      maxAttempts: (originalExam.settings as ExamSettings).maxAttempts,
      shuffleQuestions: (originalExam.settings as ExamSettings).shuffleQuestions,
      shuffleAnswers: (originalExam.settings as ExamSettings).shuffleAnswers,
      showResults: (originalExam.settings as ExamSettings).showResults,
      showCorrectAnswers: (originalExam.settings as ExamSettings).showCorrectAnswers,
      feedbackType: (originalExam.settings as ExamSettings).feedbackType,
      navigationType: (originalExam.settings as ExamSettings).navigationType,
      allowReview: (originalExam.settings as ExamSettings).allowReview,
      requireFullscreen: (originalExam.settings as ExamSettings).requireFullscreen,
      preventCopyPaste: (originalExam.settings as ExamSettings).preventCopyPaste,
      questionIds: originalExam.questions.map(eq => eq.questionId),
      questionPoints: originalExam.questions.reduce((acc, eq) => {
        if (eq.points) {
          acc[eq.questionId] = eq.points;
        }
        return acc;
      }, {} as Record<string, number>)
    };

    return this.createExam(duplicateData, userId);
  }

  /**
   * Gets exam preview data for students
   * @param id - Exam ID
   * @returns Exam preview data
   */
  async getExamPreview(id: string): Promise<ExamPreview | null> {
    const exam = await this.getExamById(id, { questionDetails: true });
    if (!exam || exam.status !== 'PUBLISHED') {
      return null;
    }

    const settings = exam.settings as unknown as ExamSettings;
    const totalPoints = exam.questions.reduce((sum, eq) => {
      return sum + (eq.points || eq.question.points);
    }, 0);

    return {
      id: exam.id,
      title: exam.title,
      description: exam.description,
      instructions: exam.instructions,
      timeLimit: settings.timeLimit,
      maxAttempts: settings.maxAttempts,
      totalPoints,
      questionCount: exam.questions.length,
      estimatedDuration: settings.timeLimit, // Could be calculated differently
      requiresPassword: !!settings.password,
      startDate: settings.startDate,
      endDate: settings.endDate,
      questions: exam.questions.map(eq => ({
        id: eq.question.id,
        content: eq.question.content,
        type: eq.question.type,
        points: eq.points || eq.question.points,
        order: eq.order,
      }))
    };
  }

  /**
   * Gets overall exam statistics for admin dashboard
   * @returns Overall exam statistics
   */
  async getOverallExamStatistics(): Promise<ExamStatistics> {
    const [totalExams, statusCounts, questionStats] = await Promise.all([
      prisma.exam.count({ where: { isDeleted: false } }),
      prisma.exam.groupBy({
        by: ['status'],
        where: { isDeleted: false },
        _count: { status: true }
      }),
      prisma.examQuestion.aggregate({
        _count: { id: true },
        _avg: { order: true }
      })
    ]);

    const statusMap = statusCounts.reduce((acc, item) => {
      acc[item.status] = item._count.status;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalExams,
      draftExams: statusMap.DRAFT || 0,
      publishedExams: statusMap.PUBLISHED || 0,
      archivedExams: statusMap.ARCHIVED || 0,
      totalQuestions: questionStats._count.id || 0,
      averageQuestionsPerExam: questionStats._avg.order || 0,
      averageDuration: 0, // Would need to calculate from settings JSON
    };
  }

  /**
   * Validates exam data
   * @param data - Exam data to validate
   * @returns Validation result
   */
  private async validateExam(data: CreateExamRequest): Promise<ExamValidationResult> {
    const errors: ExamValidationError[] = [];
    const warnings: ExamValidationError[] = [];

    // Title validation
    if (!data.title || data.title.trim().length === 0) {
      errors.push({
        field: 'title',
        message: 'Title is required',
        code: 'REQUIRED'
      });
    } else if (data.title.length > 200) {
      errors.push({
        field: 'title',
        message: 'Title must be less than 200 characters',
        code: 'TOO_LONG'
      });
    }

    // Time limit validation
    if (data.timeLimit <= 0) {
      errors.push({
        field: 'timeLimit',
        message: 'Time limit must be greater than 0',
        code: 'INVALID_VALUE'
      });
    } else if (data.timeLimit > 480) { // 8 hours
      warnings.push({
        field: 'timeLimit',
        message: 'Time limit is very long (over 8 hours)',
        code: 'LONG_DURATION'
      });
    }

    // Max attempts validation
    if (data.maxAttempts <= 0 || data.maxAttempts > 10) {
      errors.push({
        field: 'maxAttempts',
        message: 'Max attempts must be between 1 and 10',
        code: 'INVALID_RANGE'
      });
    }

    // Date validation
    if (data.startDate && data.endDate) {
      const startDate = new Date(data.startDate);
      const endDate = new Date(data.endDate);
      
      if (startDate >= endDate) {
        errors.push({
          field: 'dates',
          message: 'Start date must be before end date',
          code: 'INVALID_DATE_RANGE'
        });
      }
      
      if (startDate < new Date()) {
        warnings.push({
          field: 'startDate',
          message: 'Start date is in the past',
          code: 'PAST_DATE'
        });
      }
    }

    // Question validation
    if (!data.questionIds || data.questionIds.length === 0) {
      errors.push({
        field: 'questionIds',
        message: 'Exam must have at least one question',
        code: 'REQUIRED'
      });
    } else if (data.questionIds.length > 100) {
      warnings.push({
        field: 'questionIds',
        message: 'Exam has many questions (over 100), consider splitting',
        code: 'MANY_QUESTIONS'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validates exam for publishing
   * @param exam - Exam to validate
   * @returns Validation result
   */
  private async validateExamForPublishing(exam: ExamWithRelations): Promise<ExamValidationResult> {
    const errors: ExamValidationError[] = [];
    const warnings: ExamValidationError[] = [];

    // Must have questions
    if (exam.questions.length === 0) {
      errors.push({
        field: 'questions',
        message: 'Exam must have at least one question to be published',
        code: 'NO_QUESTIONS'
      });
    }

    // Validate settings
    const settings = exam.settings as unknown as ExamSettings;
    if (settings.startDate) {
      const startDate = new Date(settings.startDate);
      if (startDate < new Date()) {
        warnings.push({
          field: 'startDate',
          message: 'Exam start date is in the past',
          code: 'PAST_START_DATE'
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
   * Validates schedule for conflicts
   * @param startDate - Start date string
   * @param endDate - End date string
   * @param excludeExamId - Exam ID to exclude from conflict check
   * @returns Schedule validation result
   */
  private async validateSchedule(
    startDate?: string,
    endDate?: string,
    excludeExamId?: string
  ): Promise<ScheduleValidation> {
    // Simplified validation - in production would check for overlapping exams
    // This would require complex JSON path queries on the settings field
    
    return {
      isValid: true,
      conflicts: []
    };
  }

  /**
   * Checks if update data contains settings changes
   * @param data - Update data
   * @returns True if settings need updating
   */
  private hasSettingsUpdate(data: UpdateExamRequest): boolean {
    const settingsFields = [
      'timeLimit', 'maxAttempts', 'shuffleQuestions', 'shuffleAnswers',
      'showResults', 'showCorrectAnswers', 'feedbackType', 'navigationType',
      'allowReview', 'requireFullscreen', 'preventCopyPaste', 'password',
      'startDate', 'endDate'
    ];
    
    return settingsFields.some(field => field in data);
  }

  /**
   * Get formatted exam response
   * @param exam - Raw exam data from database
   * @returns Formatted exam response
   */
  private formatExamResponse(exam: any): ExamWithRelations {
    // Format the exam settings if they're stored as JSON
    let settings = exam.settings;
    if (typeof settings === 'string') {
      try {
        settings = JSON.parse(settings);
      } catch (error) {
        console.warn('Failed to parse exam settings JSON:', error);
        settings = {};
      }
    }

    // Format questions and calculate metrics
    const formattedQuestions = exam.questions?.map((eq: any) => ({
      id: eq.id,
      examId: eq.examId,
      questionId: eq.questionId,
      order: eq.order,
      points: eq.points,
      createdAt: eq.createdAt,
      updatedAt: eq.updatedAt,
      question: eq.question ? {
        ...eq.question,
        type: this.fromPrismaQuestionType(eq.question.type)
      } : eq.question
    })) || [];

    // Calculate total points and question count
    const totalPoints = formattedQuestions.reduce((sum: number, eq: any) => {
      // Use custom points if set, otherwise use question's default points
      const questionPoints = eq.points ?? eq.question?.points ?? 0;
      return sum + questionPoints;
    }, 0);

    const questionCount = formattedQuestions.length;

    // Estimate duration (2 minutes per question as default)
    const estimatedDuration = Math.max(questionCount * 2, settings.timeLimit || 0);

    return {
      id: exam.id,
      title: exam.title,
      description: exam.description,
      instructions: exam.instructions,
      settings: settings as ExamSettings,
      status: exam.status,
      createdById: exam.createdById,
      createdAt: exam.createdAt,
      updatedAt: exam.updatedAt,
      isDeleted: exam.isDeleted,
      deletedAt: exam.deletedAt,
      createdBy: exam.createdBy,
      questions: formattedQuestions,
      totalPoints,
      questionCount,
      estimatedDuration
    };
  }

  // ==========================================
  // EXAM TAKING FUNCTIONALITY
  // ==========================================

  /**
   * Get available exams for student taking
   * @param filters - Filter criteria 
   * @param page - Page number
   * @param limit - Items per page
   * @param userId - Student user ID
   * @returns Available exams for taking
   */
  /*
  async getTakeableExams(
    filters: ExamFilters = {},
    page: number = 1,
    limit: number = 20,
    userId: string
  ): Promise<TakeableExamsResponse> {
    // Method temporarily disabled due to TypeScript issues
    throw new Error('Method temporarily disabled');
  }
  */

  /**
   * Check if an exam is available for a user to take
   * @param examId - Exam ID
   * @param userId - Student user ID
   * @returns Availability status and details
   */
  async checkExamAvailability(examId: string, userId: string): Promise<ExamAvailability> {
    try {
      // NOTE: Removed session cleanup from here to prevent interfering with active sessions during page refresh
      // Session cleanup should only run during scheduled tasks or explicit cleanup calls
      
      // Get exam with settings
      const exam = await prisma.exam.findFirst({
        where: {
          id: examId,
          isDeleted: false,
          status: 'PUBLISHED'
        }
      });

      if (!exam) {
        return {
          available: false,
          reason: 'Exam not found or not published',
          requiresPassword: false,
          canStart: false
        };
      }

      const settings = exam.settings as unknown as ExamSettings;
      const now = new Date();

      // Check if exam has started
      if (settings.startDate) {
        const startDate = new Date(settings.startDate);
        if (now < startDate) {
          return {
            available: false,
            reason: 'Exam has not started yet',
            requiresPassword: !!settings.password,
            canStart: false,
            startTime: settings.startDate,
            endTime: settings.endDate
          };
        }
      }

      // Check if exam has ended
      if (settings.endDate) {
        const endDate = new Date(settings.endDate);
        if (now > endDate) {
          return {
            available: false,
            reason: 'Exam has ended',
            requiresPassword: !!settings.password,
            canStart: false,
            startTime: settings.startDate,
            endTime: settings.endDate
          };
        }
      }

      // Check attempt limits using session service
      const remainingAttempts = await this.sessionService.getRemainingAttempts(
        examId, 
        userId, 
        settings.maxAttempts
      );
      
      if (remainingAttempts <= 0) {
        return {
          available: false,
          reason: `Maximum attempts (${settings.maxAttempts}) reached`,
          requiresPassword: !!settings.password,
          canStart: false
        };
      }

      // Check if user has an ongoing session
      const ongoingSession = await this.sessionService.getActiveSession(examId, userId);
      if (ongoingSession) {
        // Calculate time remaining
        const startedAt = ongoingSession.startedAt;
        const timeLimit = settings.timeLimit * 60 * 1000; // Convert to milliseconds
        const elapsed = now.getTime() - startedAt.getTime();
        const timeRemaining = Math.max(0, timeLimit - elapsed);

        if (timeRemaining <= 0) {
          // Session has expired, but DON'T complete it here to avoid race conditions
          // Let getExamForTaking handle session cleanup/creation properly
          console.log(`⏰ Session ${ongoingSession.id} has expired for user ${userId}, will be cleaned up during exam start`);
          
          return {
            available: true, // Allow user to start new session since old one expired
            reason: 'Previous session has expired, you can start a new attempt',
            requiresPassword: !!settings.password,
            canStart: true
          };
        }

        return {
          available: true,
          reason: 'You have an ongoing session',
          requiresPassword: !!settings.password,
          canStart: true,
          timeRemaining: Math.floor(timeRemaining / 1000) // Convert to seconds
        };
      }

      // Exam is available
      return {
        available: true,
        requiresPassword: !!settings.password,
        canStart: true,
        startTime: settings.startDate,
        endTime: settings.endDate
      };

    } catch (error) {
      console.error('Error checking exam availability:', error);
      throw new Error('Failed to check exam availability');
    }
  }

  /**
   * Get exam data for taking (without correct answers)
   * @param examId - Exam ID
   * @param userId - Student user ID  
   * @param password - Exam password if required
   * @returns Exam data formatted for taking
   */
  async getExamForTaking(
    examId: string,
    userId: string,
    password?: string
  ): Promise<ExamForTakingResponse> {
    try {
      console.log(`🎯 getExamForTaking called with examId: ${examId}, userId: ${userId}, hasPassword: ${!!password}`);
      
      // First check if exam is available
      console.log(`🔍 Checking exam availability for exam ${examId} and user ${userId}`);
      const availability = await this.checkExamAvailability(examId, userId);
      console.log(`🔍 Availability result:`, availability);
      
      if (!availability.available) {
        console.log(`❌ Exam not available: ${availability.reason}`);
        throw new Error(availability.reason || 'Exam not available');
      }

      // Get exam with questions
      console.log(`📚 Fetching exam ${examId} with questions from database`);
      const exam = await prisma.exam.findFirst({
        where: {
          id: examId,
          isDeleted: false,
          status: 'PUBLISHED'
        },
        include: {
          questions: {
            include: {
              question: {
                select: {
                  id: true,
                  type: true,
                  content: true,
                  points: true,
                  typeData: true,
                  imageUrl: true
                }
              }
            },
            orderBy: {
              order: 'asc'
            }
          }
        } as any
      }) as any;

      if (!exam) {
        console.log(`❌ Exam ${examId} not found or not published`);
        throw new Error('Exam not found');
      }
      
      console.log(`✅ Exam found: ${exam.title}, questions: ${exam.questions?.length || 0}`);
      console.log(`🔧 Exam settings type:`, typeof exam.settings);
      console.log(`🔧 Exam settings:`, JSON.stringify(exam.settings, null, 2));

      const settings = exam.settings as unknown as ExamSettings;

      // Check remaining attempts using session service
      const remainingAttempts = await this.sessionService.getRemainingAttempts(
        examId, 
        userId, 
        settings.maxAttempts
      );

      // Check if user has remaining attempts
      if (remainingAttempts <= 0) {
        throw new Error(`Maximum attempts (${settings.maxAttempts}) reached`);
      }

      // Verify password if required (BEFORE creating session)
      console.log(`🔐 Password check - settings.password exists: ${!!settings.password}, password provided: ${!!password}`);
      if (settings.password && password) {
        console.log(`🔐 Verifying password with bcrypt.compare`);
        console.log(`🔐 Settings password type:`, typeof settings.password);
        console.log(`🔐 Settings password length:`, settings.password?.length);
        console.log(`🔐 Provided password type:`, typeof password);
        console.log(`🔐 Provided password length:`, password?.length);
        
        try {
          const isPasswordValid = await bcrypt.compare(password, settings.password);
          console.log(`🔐 Password validation result:`, isPasswordValid);
          if (!isPasswordValid) {
            throw new Error('Invalid exam password');
          }
        } catch (bcryptError) {
          console.error(`❌ bcrypt.compare error:`, bcryptError);
          throw new Error(`Password verification failed: ${bcryptError instanceof Error ? bcryptError.message : 'Unknown bcrypt error'}`);
        }
      } else if (settings.password && !password) {
        console.log(`🔐 Password required but not provided`);
        throw new Error('Exam password required');
      } else {
        console.log(`🔐 No password verification needed`);
      }

      // Get or create exam session (this handles all the duplicate creation logic)
      console.log(`🔄 Creating/getting session for user ${userId} on exam ${examId}, timeLimit: ${settings.timeLimit} minutes`);
      const session = await this.sessionService.getOrCreateSession(
        examId,
        userId,
        settings.timeLimit * 60 // Convert minutes to seconds
      );

      console.log(`✅ Session created/retrieved: ${session.id} active for user ${userId} on exam ${examId} (attempt ${session.attemptNumber})`);

      const currentAttempt = session.attemptNumber;

      // Format questions for taking (remove correct answers)
      const questionsForTaking = exam.questions.map((eq: any) => {
        const question = eq.question;
        const typeData = question.typeData as any;
        
        // Remove correct answers from type data and prepare clean structure
        let cleanTypeData = { ...typeData };
        let questionOptions: any[] = [];
        
        switch (question.type) {
          case 'MULTIPLE_CHOICE':
          case 'MULTIPLE_SELECT':
            if (cleanTypeData.options && Array.isArray(cleanTypeData.options)) {
              // Clean options by removing correct answer indicators
              questionOptions = cleanTypeData.options.map((option: any) => ({
                id: option.id,
                text: option.text
                // Remove isCorrect and explanation for security
              }));
              cleanTypeData.options = questionOptions;
            }
            break;
          case 'TRUE_FALSE':
            // Remove correctAnswer but keep showRandomOrder if exists
            const { correctAnswer, ...trueFalseData } = cleanTypeData;
            cleanTypeData = trueFalseData;
            break;
          case 'FILL_BLANK':
            if (cleanTypeData.blanks && Array.isArray(cleanTypeData.blanks)) {
              cleanTypeData.blanks = cleanTypeData.blanks.map((blank: any) => ({
                id: blank.id,
                position: blank.position,
                placeholder: blank.placeholder
                // Remove acceptedAnswers and caseSensitive for security
              }));
            }
            break;
          case 'ESSAY':
            // Essay questions don't need answer removal
            break;
        }

        return {
          id: question.id,
          examQuestionId: eq.id,
          type: this.fromPrismaQuestionType(question.type),
          content: question.content,
          imageUrl: question.imageUrl, // Include image URL for display during exam taking
          points: eq.points || question.points,
          order: eq.order,
          typeData: cleanTypeData,
          // Provide options at root level for frontend compatibility
          options: questionOptions,
          // Add other type-specific data at root level for AnswerInput compatibility
          ...(question.type === 'FILL_BLANK' && cleanTypeData.blanks ? { blanks: cleanTypeData.blanks } : {}),
          ...(question.type === 'TRUE_FALSE' && cleanTypeData.showRandomOrder !== undefined ? { showRandomOrder: cleanTypeData.showRandomOrder } : {}),
          ...(question.type === 'ESSAY' ? { 
            maxWords: cleanTypeData.maxWords, 
            minWords: cleanTypeData.minWords, 
            rubric: cleanTypeData.rubric 
          } : {})
        };
      });

      // Calculate total points
      const totalPoints = questionsForTaking.reduce((sum: number, q: any) => sum + q.points, 0);

      return {
        id: exam.id,
        title: exam.title,
        description: exam.description,
        instructions: exam.instructions,
        timeLimit: settings.timeLimit,
        maxAttempts: settings.maxAttempts,
        shuffleQuestions: settings.shuffleQuestions,
        shuffleAnswers: settings.shuffleAnswers,
        requiresPassword: !!settings.password,
        allowReview: settings.allowReview,
        requireFullscreen: settings.requireFullscreen,
        preventCopyPaste: settings.preventCopyPaste,
        questions: questionsForTaking,
        totalPoints: totalPoints,
        questionCount: questionsForTaking.length,
        remainingAttempts: remainingAttempts,
        currentAttempt: currentAttempt,
        // Include session data for robust state management
        sessionId: session.id,
        sessionData: {
          startedAt: session.startedAt.toISOString(),
          timeRemaining: session.timeRemaining,
          currentQuestion: session.currentQuestion,
          answers: session.answers
        }
      };

    } catch (error) {
      console.error('Error getting exam for taking:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to get exam for taking');
    }
  }

  /**
   * Submit exam answers and calculate score using enhanced grading service
   * @param submission - Exam submission data
   * @param userId - Student user ID
   * @returns Submission result with score
   */
  async submitExamAnswers(
    submission: ExamSubmission,
    userId: string
  ): Promise<ExamSubmissionResult> {
    try {
      // Get exam with questions and their correct answers
      const exam = await prisma.exam.findFirst({
        where: {
          id: submission.examId,
          isDeleted: false,
          status: 'PUBLISHED'
        },
        include: {
          questions: {
            include: {
              question: {
                select: {
                  id: true,
                  type: true,
                  content: true,
                  points: true,
                  typeData: true
                }
              }
            },
            orderBy: {
              order: 'asc'
            }
          }
        } as any
      }) as any;

      if (!exam) {
        throw new Error('Exam not found');
      }

      // Find the current active session
      const currentSession = await this.sessionService.getActiveSession(submission.examId, userId);
      if (!currentSession) {
        throw new Error('No active session found');
      }

      // Use enhanced grading service
      const gradingResult = await this.gradingService.gradeExamSubmission(
        submission,
        submission.examId,
        {
          passingPercentage: 60,
          allowPartialCredit: true,
          penalizeIncorrectAnswers: false,
          timeBonus: false,
          roundingMethod: 'round'
        }
      );

      // Create submission record with enhanced grading data
      const examSubmission = await prisma.examSubmission.create({
        data: {
          examId: submission.examId,
          userId: userId,
          answers: submission.answers as any,
          timeSpent: submission.timeSpent,
          score: gradingResult.totalScore,
          totalPoints: gradingResult.totalPoints,
          percentage: gradingResult.percentage,
          passed: gradingResult.passed,
          isAutoSubmit: submission.isAutoSubmit,
          submittedAt: new Date(),
          gradedAt: gradingResult.gradedAt
        }
      });

      // Complete the session and link it to the submission
      await this.sessionService.completeSession(currentSession.id, examSubmission.id);

      return {
        success: true,
        submissionId: examSubmission.id,
        score: gradingResult.totalScore,
        totalPoints: gradingResult.totalPoints,
        percentage: gradingResult.percentage,
        passed: gradingResult.passed,
        submittedAt: examSubmission.submittedAt.toISOString(),
        gradedAt: examSubmission.gradedAt?.toISOString()
      };

    } catch (error) {
      console.error('Error submitting exam answers:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to submit exam answers');
    }
  }

  /**
   * Get exam results with detailed question breakdown
   * @param examId - Exam ID
   * @param userId - Student user ID
   * @returns Detailed exam results
   */
  async getExamResults(examId: string, userId: string) {
    const submission = await prisma.examSubmission.findFirst({
      where: {
        examId: examId,
        userId: userId,
        gradedAt: { not: null }
      },
      include: {
        exam: {
          select: {
            id: true,
            title: true,
            questions: {
              include: {
                question: {
                  select: {
                    id: true,
                    content: true,
                    type: true,
                    points: true,
                    typeData: true,
                    explanation: true,
                    imageUrl: true
                  }
                }
              },
              orderBy: { order: 'asc' }
            }
          }
        },
        user: {
          select: {
            id: true,
            username: true
          }
        }
      }
    });

    if (!submission) {
      throw new Error('Exam results not found');
    }

    // Get exam statistics for comparison
    const examStats = await this.getExamStatistics(examId);

    // Get the attempt number from the associated session
    const session = await prisma.examSession.findFirst({
      where: {
        submissionId: submission.id
      },
      select: {
        attemptNumber: true,
        startedAt: true,
        completedAt: true
      }
    });

    // Process question results with detailed feedback
    const questionResults = submission.exam.questions.map((examQuestion) => {
      const question = examQuestion.question;
      const studentAnswer = (submission.answers as unknown as ExamAnswer[]).find(
        (answer) => answer.questionId === question.id
      );

      // Grade this specific question to get detailed feedback
      const grading = this.gradeQuestionForDisplay(
        question,
        studentAnswer,
        examQuestion.points || question.points
      );

      return {
        questionId: question.id,
        questionContent: question.content,
        questionType: this.fromPrismaQuestionType(question.type), // Convert DB type to frontend format
        questionOptions: (question.typeData as any)?.options || null,
        points: examQuestion.points || question.points,
        earnedPoints: grading.earnedPoints,
        isCorrect: grading.isCorrect,
        studentAnswer: studentAnswer?.answer,
        correctAnswer: this.extractCorrectAnswer(question),
        explanation: question.explanation,
        timeSpent: studentAnswer?.timeSpent || 0
      };
    });

    return {
      id: submission.id,
      examId: submission.examId,
      examTitle: submission.exam.title,
      studentId: submission.userId,
      studentName: submission.user.username,
      score: submission.score || 0,
      totalPoints: submission.totalPoints || 0,
      percentage: submission.percentage || 0,
      passed: submission.passed || false,
      timeSpent: submission.timeSpent,
      submittedAt: submission.submittedAt.toISOString(),
      gradedAt: submission.gradedAt?.toISOString(),
      questionResults,
      rank: await this.calculateStudentRank(examId, userId),
      totalStudents: examStats.totalSubmissions,
      averageScore: examStats.averageScore,
      highestScore: examStats.highestScore,
      attemptNumber: session?.attemptNumber || 1,
      attemptStartedAt: session?.startedAt?.toISOString(),
      attemptCompletedAt: session?.completedAt?.toISOString()
    };
  }

  /**
   * Get all exam attempts for a specific student and exam
   * @param examId - Exam ID
   * @param userId - Student user ID
   * @returns List of exam attempts with basic info
   */
  async getExamAttempts(examId: string, userId: string) {
    console.log(`🔍 getExamAttempts called with examId: ${examId}, userId: ${userId}`);
    
    // First, query ALL sessions for this user/exam to see the full picture
    const allSessions = await prisma.examSession.findMany({
      where: {
        examId: examId,
        userId: userId
      },
      orderBy: { attemptNumber: 'asc' }
    });
    
    console.log(`📊 Found ${allSessions.length} total sessions for user ${userId} on exam ${examId}:`, 
      allSessions.map(s => ({ 
        attempt: s.attemptNumber, 
        isActive: s.isActive, 
        hasSubmission: !!s.submissionId,
        completed: !!s.completedAt,
        sessionId: s.id.slice(-8), // Show last 8 chars for identification
        startedAt: s.startedAt.toISOString().split('T')[0] // Show just the date
      }))
    );
    
    // Also check direct submissions (for debugging)
    const allSubmissions = await prisma.examSubmission.findMany({
      where: {
        examId: examId,
        userId: userId
      },
      orderBy: { submittedAt: 'asc' }
    });
    
    console.log(`📝 Found ${allSubmissions.length} direct submissions for user ${userId} on exam ${examId}:`, 
      allSubmissions.map(s => ({ submissionId: s.id.slice(-8), submittedAt: s.submittedAt.toISOString().split('T')[0], score: `${s.score}/${s.totalPoints}` }))
    );

    // Step 1: Get sessions with linked submissions
    const sessionsWithSubmissions = await prisma.examSession.findMany({
      where: {
        examId: examId,
        userId: userId,
        isActive: false, // Only completed sessions
        submissionId: { not: null } // Only sessions with submissions
      },
      include: {
        submission: {
          select: {
            id: true,
            score: true,
            totalPoints: true,
            percentage: true,
            passed: true,
            submittedAt: true,
            gradedAt: true,
            isAutoSubmit: true
          }
        }
      },
      orderBy: { attemptNumber: 'asc' }
    });
    
    console.log(`✅ Found ${sessionsWithSubmissions.length} sessions with linked submissions`);
    
    // Step 2: Get orphaned submissions (submissions without linked sessions)
    const linkedSubmissionIds = sessionsWithSubmissions
      .map(s => s.submissionId)
      .filter((id): id is string => id !== null);
    
    const orphanedSubmissions = await prisma.examSubmission.findMany({
      where: {
        examId: examId,
        userId: userId,
        ...(linkedSubmissionIds.length > 0 ? { id: { notIn: linkedSubmissionIds } } : {})
      },
      orderBy: { submittedAt: 'asc' }
    });
    
    console.log(`🔍 Found ${orphanedSubmissions.length} orphaned submissions:`, 
      orphanedSubmissions.map(s => ({ id: s.id.slice(-8), score: `${s.score}/${s.totalPoints}` }))
    );
    
    // Step 3: Create attempt entries by combining sessions and orphaned submissions
    interface AttemptData {
      attemptNumber: number;
      startedAt: string;
      completedAt?: string;
      timeSpent: number;
      submissionId: string | null;
      submission: {
        id: string;
        score: number;
        totalPoints: number;
        percentage: number;
        passed: boolean;
        submittedAt: string;
        gradedAt?: string;
        isAutoSubmit: boolean;
      } | null;
    }
    
    const attempts: AttemptData[] = [];
    
    // Add sessions with submissions (these have proper attempt numbers)
    sessionsWithSubmissions.forEach(session => {
      attempts.push({
        attemptNumber: session.attemptNumber,
        startedAt: session.startedAt.toISOString(),
        completedAt: session.completedAt?.toISOString(),
        timeSpent: session.completedAt && session.startedAt 
          ? Math.floor((session.completedAt.getTime() - session.startedAt.getTime()) / 1000)
          : 0,
        submissionId: session.submissionId,
        submission: session.submission ? {
          id: session.submission.id,
          score: session.submission.score || 0,
          totalPoints: session.submission.totalPoints || 0,
          percentage: session.submission.percentage || 0,
          passed: session.submission.passed || false,
          submittedAt: session.submission.submittedAt.toISOString(),
          gradedAt: session.submission.gradedAt?.toISOString(),
          isAutoSubmit: session.submission.isAutoSubmit
        } : null
      });
    });
    
    // Add orphaned submissions as missing attempts
    orphanedSubmissions.forEach((submission) => {
      // Calculate what attempt number this should be
      // Find the lowest unused attempt number
      let attemptNumber = 1;
      const usedAttemptNumbers = new Set(attempts.map(a => a.attemptNumber));
      while (usedAttemptNumbers.has(attemptNumber)) {
        attemptNumber++;
      }
      
      attempts.push({
        attemptNumber: attemptNumber,
        startedAt: submission.submittedAt.toISOString(), // Use submission date as start time
        completedAt: submission.submittedAt.toISOString(),
        timeSpent: submission.timeSpent || 0,
        submissionId: submission.id,
        submission: {
          id: submission.id,
          score: submission.score || 0,
          totalPoints: submission.totalPoints || 0,
          percentage: submission.percentage || 0,
          passed: submission.passed || false,
          submittedAt: submission.submittedAt.toISOString(),
          gradedAt: submission.gradedAt?.toISOString(),
          isAutoSubmit: submission.isAutoSubmit
        }
      });
    });
    
    // Sort by attempt number
    attempts.sort((a, b) => a.attemptNumber - b.attemptNumber);
    
    console.log(`📋 Final attempts list (${attempts.length} total):`, 
      attempts.map(a => ({ 
        attempt: a.attemptNumber, 
        score: `${a.submission?.score}/${a.submission?.totalPoints}`,
        submissionId: a.submissionId?.slice(-8)
      }))
    );

    return attempts;
  }

  /**
   * Get exam results for a specific attempt
   * @param examId - Exam ID
   * @param userId - Student user ID
   * @param attemptNumber - Specific attempt number
   * @returns Detailed exam results for the attempt
   */
  async getExamResultsByAttempt(examId: string, userId: string, attemptNumber: number) {
    console.log(`🔍 getExamResultsByAttempt called with examId: ${examId}, userId: ${userId}, attemptNumber: ${attemptNumber}`);
    
    // First, get all valid attempts to verify if this attempt exists
    const allAttempts = await this.getExamAttempts(examId, userId);
    const requestedAttempt = allAttempts.find(attempt => attempt.attemptNumber === attemptNumber);
    
    if (!requestedAttempt) {
      console.log(`❌ Attempt ${attemptNumber} not found. Available attempts:`, allAttempts.map(a => a.attemptNumber));
      const error = new Error(`Exam attempt ${attemptNumber} not found for user ${userId}`);
      (error as any).statusCode = 404;
      throw error;
    }

    if (!requestedAttempt.submissionId) {
      console.log(`❌ Attempt ${attemptNumber} has no submission`);
      const error = new Error(`No submission found for attempt ${attemptNumber}`);
      (error as any).statusCode = 404;
      throw error;
    }

    // Get the submission with all required details
    const submission = await prisma.examSubmission.findFirst({
      where: {
        id: requestedAttempt.submissionId,
        examId: examId,
        userId: userId
      },
      include: {
        exam: {
          select: {
            id: true,
            title: true,
            questions: {
              include: {
                question: {
                  select: {
                    id: true,
                    content: true,
                    type: true,
                    points: true,
                    typeData: true,
                    explanation: true,
                    imageUrl: true
                  }
                }
              },
              orderBy: { order: 'asc' }
            }
          }
        },
        user: {
          select: {
            id: true,
            username: true
          }
        }
      }
    });

    if (!submission) {
      console.log(`❌ Submission ${requestedAttempt.submissionId} not found`);
      const error = new Error(`Submission not found for attempt ${attemptNumber}`);
      (error as any).statusCode = 404;
      throw error;
    }

    console.log(`✅ Found submission for attempt ${attemptNumber}:`, {
      submissionId: submission.id.slice(-8),
      score: `${submission.score}/${submission.totalPoints}`,
      submittedAt: submission.submittedAt.toISOString()
    });

    // Get exam statistics for comparison
    const examStats = await this.getExamStatistics(examId);

    // Process question results with detailed feedback
    const questionResults = submission.exam.questions.map((examQuestion) => {
      const question = examQuestion.question;
      const studentAnswer = (submission.answers as unknown as ExamAnswer[]).find(
        (answer) => answer.questionId === question.id
      );

      // Grade this specific question to get detailed feedback
      const grading = this.gradeQuestionForDisplay(
        question,
        studentAnswer,
        examQuestion.points || question.points
      );

      return {
        questionId: question.id,
        questionContent: question.content,
        questionType: this.fromPrismaQuestionType(question.type), // Convert DB type to frontend format
        questionOptions: (question.typeData as any)?.options || null,
        points: examQuestion.points || question.points,
        earnedPoints: grading.earnedPoints,
        isCorrect: grading.isCorrect,
        studentAnswer: studentAnswer?.answer,
        correctAnswer: this.extractCorrectAnswer(question),
        explanation: question.explanation,
        timeSpent: studentAnswer?.timeSpent || 0
      };
    });

    return {
      id: submission.id,
      examId: submission.examId,
      examTitle: submission.exam.title,
      studentId: submission.userId,
      studentName: submission.user.username,
      score: submission.score || 0,
      totalPoints: submission.totalPoints || 0,
      percentage: submission.percentage || 0,
      passed: submission.passed || false,
      timeSpent: submission.timeSpent,
      submittedAt: submission.submittedAt.toISOString(),
      gradedAt: submission.gradedAt?.toISOString(),
      questionResults,
      rank: await this.calculateStudentRank(examId, userId),
      totalStudents: examStats.totalSubmissions,
      averageScore: examStats.averageScore,
      highestScore: examStats.highestScore,
      attemptNumber: requestedAttempt.attemptNumber,
      attemptStartedAt: requestedAttempt.startedAt,
      attemptCompletedAt: requestedAttempt.completedAt
    };
  }

  /**
   * Get leaderboard for an exam
   * @param examId - Exam ID
   * @param limit - Maximum number of entries
   * @returns Leaderboard data
   */
  async getExamLeaderboard(examId: string, limit: number = 50) {
    return this.gradingService.getExamLeaderboard(examId, limit);
  }

  /**
   * Get performance analytics for an exam
   * @param examId - Exam ID
   * @returns Performance analytics
   */
  async getExamAnalytics(examId: string) {
    return this.gradingService.generatePerformanceAnalytics(examId);
  }

  /**
   * Extract correct answer from question for display
   * @param question - Question data
   * @returns Correct answer representation
   */
  private extractCorrectAnswer(question: any): any {
    const typeData = question.typeData as any;

    switch (question.type) {
      case 'MULTIPLE_CHOICE':
        const correctOption = typeData.options?.find((opt: any) => opt.isCorrect);
        return correctOption?.text || 'Unknown';

      case 'MULTIPLE_SELECT':
        const correctOptions = typeData.options?.filter((opt: any) => opt.isCorrect) || [];
        return correctOptions.map((opt: any) => opt.text);

      case 'TRUE_FALSE':
        return typeData.correctAnswer;

      case 'FILL_BLANK':
        const blanks: Record<string, string[]> = {};
        typeData.blanks?.forEach((blank: any) => {
          blanks[blank.id] = blank.acceptedAnswers || [];
        });
        return blanks;

      case 'ESSAY':
        return 'Manual grading required';

      default:
        return 'Unknown question type';
    }
  }

  /**
   * Grade a single question for display purposes
   * @param question - Question data
   * @param studentAnswer - Student answer
   * @param points - Question points
   * @returns Grading result for display
   */
  private gradeQuestionForDisplay(
    question: any,
    studentAnswer: ExamAnswer | undefined,
    points: number
  ): { earnedPoints: number; isCorrect: boolean } {
    if (!studentAnswer) {
      return { earnedPoints: 0, isCorrect: false };
    }

    const typeData = question.typeData as any;

    switch (question.type) {
      case 'MULTIPLE_CHOICE':
        const correctOption = typeData.options?.find((opt: any) => opt.isCorrect);
        const isCorrect = studentAnswer.answer === correctOption?.id;
        return { earnedPoints: isCorrect ? points : 0, isCorrect };

      case 'MULTIPLE_SELECT':
        const correctOptions = typeData.options?.filter((opt: any) => opt.isCorrect).map((opt: any) => opt.id) || [];
        const studentSelections = studentAnswer.answer || [];
        const correctSelections = studentSelections.filter((id: string) => correctOptions.includes(id));
        const incorrectSelections = studentSelections.filter((id: string) => !correctOptions.includes(id));
        const allCorrect = correctSelections.length === correctOptions.length && incorrectSelections.length === 0;
        const partialCredit = correctSelections.length / correctOptions.length;
        return { earnedPoints: partialCredit * points, isCorrect: allCorrect };

      case 'TRUE_FALSE':
        const tfCorrect = studentAnswer.answer === typeData.correctAnswer;
        return { earnedPoints: tfCorrect ? points : 0, isCorrect: tfCorrect };

      case 'FILL_BLANK':
        let correctBlanks = 0;
        const totalBlanks = typeData.blanks?.length || 0;
        
        typeData.blanks?.forEach((blank: any) => {
          const studentBlankAnswer = studentAnswer.answer?.[blank.id];
          if (studentBlankAnswer) {
            const acceptedAnswers = blank.acceptedAnswers || [];
            const caseSensitive = blank.caseSensitive || false;
            const isBlankCorrect = acceptedAnswers.some((accepted: string) => {
              const studentValue = caseSensitive ? studentBlankAnswer : studentBlankAnswer.toLowerCase();
              const acceptedValue = caseSensitive ? accepted : accepted.toLowerCase();
              return studentValue.trim() === acceptedValue.trim();
            });
            if (isBlankCorrect) correctBlanks++;
          }
        });

        const fbPartialCredit = totalBlanks > 0 ? correctBlanks / totalBlanks : 0;
        return { earnedPoints: fbPartialCredit * points, isCorrect: fbPartialCredit === 1 };

      default:
        return { earnedPoints: 0, isCorrect: false };
    }
  }

  /**
   * Calculate student rank for an exam
   * @param examId - Exam ID
   * @param userId - Student user ID
   * @returns Student rank
   */
  private async calculateStudentRank(examId: string, userId: string): Promise<number> {
    const studentSubmission = await prisma.examSubmission.findFirst({
      where: { examId, userId, gradedAt: { not: null } }
    });

    if (!studentSubmission) return 0;

    const betterSubmissions = await prisma.examSubmission.count({
      where: {
        examId,
        gradedAt: { not: null },
        OR: [
          { percentage: { gt: studentSubmission.percentage || 0 } },
          {
            percentage: studentSubmission.percentage,
            timeSpent: { lt: studentSubmission.timeSpent }
          },
          {
            percentage: studentSubmission.percentage,
            timeSpent: studentSubmission.timeSpent,
            submittedAt: { lt: studentSubmission.submittedAt }
          }
        ]
      }
    });

    return betterSubmissions + 1;
  }

  /**
   * Get basic exam statistics
   * @param examId - Exam ID
   * @returns Basic exam statistics
   */
  private async getExamStatistics(examId: string) {
    const submissions = await prisma.examSubmission.findMany({
      where: { examId, gradedAt: { not: null } },
      select: { score: true, totalPoints: true, percentage: true }
    });

    if (submissions.length === 0) {
      return {
        totalSubmissions: 0,
        averageScore: 0,
        highestScore: 0
      };
    }

    const averageScore = submissions.reduce((sum, sub) => sum + (sub.score || 0), 0) / submissions.length;
    const highestScore = Math.max(...submissions.map(sub => sub.score || 0));

    return {
      totalSubmissions: submissions.length,
      averageScore,
      highestScore
    };
  }

  /**
   * Get student's exam history
   * @param userId - Student user ID
   * @returns Student's exam submission history
   */
  async getStudentExamHistory(userId: string) {
    const submissions = await prisma.examSubmission.findMany({
      where: {
        userId: userId,
        gradedAt: { not: null }
      },
      include: {
        exam: {
          select: {
            id: true,
            title: true,
            status: true
          }
        },
        attempt: {
          select: {
            attemptNumber: true,
            startedAt: true,
            completedAt: true
          }
        }
      },
      orderBy: { submittedAt: 'desc' }
    });

    return submissions.map(submission => ({
      id: submission.id,
      examId: submission.examId,
      examTitle: submission.exam.title,
      score: submission.score || 0,
      totalPoints: submission.totalPoints || 0,
      percentage: submission.percentage || 0,
      passed: submission.passed || false,
      timeSpent: submission.timeSpent,
      submittedAt: submission.submittedAt.toISOString(),
      gradedAt: submission.gradedAt?.toISOString(),
      isAutoSubmit: submission.isAutoSubmit,
      attemptNumber: submission.attempt?.attemptNumber || 1,
      attemptStartedAt: submission.attempt?.startedAt?.toISOString(),
      attemptCompletedAt: submission.attempt?.completedAt?.toISOString()
    }));
  }

  /**
   * Get grouped exam history by exam for a student
   * @param userId - Student user ID
   * @returns Exam history grouped by exam with all attempts
   */
  async getStudentExamHistoryGrouped(userId: string) {
    const submissions = await prisma.examSubmission.findMany({
      where: {
        userId: userId,
        gradedAt: { not: null }
      },
      include: {
        exam: {
          select: {
            id: true,
            title: true,
            status: true
          }
        },
        attempt: {
          select: {
            attemptNumber: true,
            startedAt: true,
            completedAt: true
          }
        }
      },
      orderBy: [
        { examId: 'asc' },
        { submittedAt: 'desc' }
      ]
    });

    // Group submissions by exam
    const groupedByExam = submissions.reduce((acc, submission) => {
      const examId = submission.examId;
      
      if (!acc[examId]) {
        acc[examId] = {
          examId: submission.examId,
          examTitle: submission.exam.title,
          examStatus: submission.exam.status,
          attempts: []
        };
      }

      acc[examId].attempts.push({
        id: submission.id,
        score: submission.score || 0,
        totalPoints: submission.totalPoints || 0,
        percentage: submission.percentage || 0,
        passed: submission.passed || false,
        timeSpent: submission.timeSpent,
        submittedAt: submission.submittedAt.toISOString(),
        gradedAt: submission.gradedAt?.toISOString(),
        isAutoSubmit: submission.isAutoSubmit,
        attemptNumber: submission.attempt?.attemptNumber || 1,
        attemptStartedAt: submission.attempt?.startedAt?.toISOString(),
        attemptCompletedAt: submission.attempt?.completedAt?.toISOString()
      });

      return acc;
    }, {} as Record<string, any>);

    // Convert to array and sort by latest submission
    return Object.values(groupedByExam).sort((a: any, b: any) => {
      const aLatest = Math.max(...a.attempts.map((att: any) => new Date(att.submittedAt).getTime()));
      const bLatest = Math.max(...b.attempts.map((att: any) => new Date(att.submittedAt).getTime()));
      return bLatest - aLatest;
    });
  }

  /**
   * Get grading dashboard statistics
   * @returns Grading dashboard stats
   */
  async getGradingDashboardStats() {
    const [totalSubmissions, gradedSubmissions, recentSubmissions, passRateData] = await Promise.all([
      prisma.examSubmission.count(),
      prisma.examSubmission.count({ where: { gradedAt: { not: null } } }),
      prisma.examSubmission.count({
        where: {
          submittedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
        }
      }),
      prisma.examSubmission.findMany({
        where: { gradedAt: { not: null } },
        select: { passed: true }
      })
    ]);

    const totalPassed = passRateData.filter(sub => sub.passed).length;
    const passRate = passRateData.length > 0 ? (totalPassed / passRateData.length) * 100 : 0;

    return {
      totalSubmissions,
      gradedSubmissions,
      pendingGrading: totalSubmissions - gradedSubmissions,
      recentSubmissions,
      passRate: Math.round(passRate * 100) / 100,
      averageGradingTime: 0 // Would calculate from submission to grading time
    };
  }

  /**
   * Regrade an exam with updated algorithms
   * @param examId - Exam ID
   * @returns Regrade result
   */
  async regradeExam(examId: string) {
    const submissions = await prisma.examSubmission.findMany({
      where: { examId, gradedAt: { not: null } }
    });

    let regradedCount = 0;
    const errors: string[] = [];

    for (const submission of submissions) {
      try {
        // Re-run grading with current algorithms
        const gradingResult = await this.gradingService.gradeExamSubmission(
          {
            examId: submission.examId,
            answers: submission.answers as unknown as any[],
            timeSpent: submission.timeSpent,
            isAutoSubmit: submission.isAutoSubmit,
            submittedAt: submission.submittedAt.toISOString()
          },
          submission.examId
        );

        // Update submission with new scores
        await prisma.examSubmission.update({
          where: { id: submission.id },
          data: {
            score: gradingResult.totalScore,
            totalPoints: gradingResult.totalPoints,
            percentage: gradingResult.percentage,
            passed: gradingResult.passed,
            gradedAt: new Date()
          }
        });

        regradedCount++;
      } catch (error) {
        errors.push(`Submission ${submission.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return {
      totalSubmissions: submissions.length,
      regradedCount,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  /**
   * Export exam results as CSV
   * @param examId - Exam ID
   * @returns CSV data as string
   */
  async exportExamResults(examId: string): Promise<string> {
    const submissions = await prisma.examSubmission.findMany({
      where: {
        examId: examId,
        gradedAt: { not: null }
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true
          }
        },
        exam: {
          select: {
            title: true
          }
        }
      },
      orderBy: [
        { percentage: 'desc' },
        { submittedAt: 'asc' }
      ]
    });

    if (submissions.length === 0) {
      throw new Error('No submissions found for this exam');
    }

    // CSV headers
    const headers = [
      'Rank',
      'Student ID',
      'Username',
      'Email',
      'Score',
      'Total Points',
      'Percentage',
      'Passed',
      'Time Spent (minutes)',
      'Submitted At',
      'Graded At',
      'Auto Submit'
    ];

    // CSV rows
    const rows = submissions.map((submission, index) => [
      index + 1, // Rank
      submission.user.id,
      submission.user.username,
      submission.user.email,
      submission.score || 0,
      submission.totalPoints || 0,
      `${(submission.percentage || 0).toFixed(1)}%`,
      submission.passed ? 'Yes' : 'No',
      Math.round(submission.timeSpent / 60), // Convert seconds to minutes
      submission.submittedAt.toISOString(),
      submission.gradedAt?.toISOString() || '',
      submission.isAutoSubmit ? 'Yes' : 'No'
    ]);

    // Format as CSV
    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    return csvContent;
  }

  /**
   * Get exam summaries for admin dashboard
   * @returns Array of exam summaries with statistics
   */
  async getExamSummariesForAdmin() {
    const exams = await prisma.exam.findMany({
      where: {
        isDeleted: false
      },
      include: {
        questions: {
          select: {
            id: true
          }
        },
        _count: {
          select: {
            submissions: {
              where: {
                gradedAt: { not: null }
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get submission statistics for each exam
    const examSummaries = await Promise.all(
      exams.map(async (exam) => {
        const submissions = await prisma.examSubmission.findMany({
          where: {
            examId: exam.id,
            gradedAt: { not: null }
          },
          select: {
            score: true,
            totalPoints: true,
            percentage: true,
            passed: true,
            userId: true
          }
        });

        // Get unique students count
        const uniqueStudents = new Set(submissions.map(s => s.userId)).size;
        const completedStudents = submissions.length;

        // Calculate statistics
        const scores = submissions.map(s => s.score || 0);
        const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
        const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
        const lowestScore = scores.length > 0 ? Math.min(...scores) : 0;
        const passedCount = submissions.filter(s => s.passed).length;
        const passRate = submissions.length > 0 ? (passedCount / submissions.length) * 100 : 0;

        // Map exam status
        let status: 'active' | 'archived' | 'draft';
        switch (exam.status) {
          case 'PUBLISHED':
            status = 'active';
            break;
          case 'ARCHIVED':
            status = 'archived';
            break;
          default:
            status = 'draft';
            break;
        }

        return {
          id: exam.id,
          title: exam.title,
          totalStudents: uniqueStudents,
          completedStudents: completedStudents,
          averageScore: Math.round(averageScore * 100) / 100,
          highestScore: Math.round(highestScore * 100) / 100,
          lowestScore: Math.round(lowestScore * 100) / 100,
          passRate: Math.round(passRate * 100) / 100,
          createdAt: exam.createdAt.toISOString(),
          status
        };
      })
    );

    return examSummaries;
  }

  /**
   * Get student summaries for admin dashboard
   */
  async getStudentSummariesForAdmin() {
    // Get all users with exam statistics
    const users = await prisma.user.findMany({
      where: {
        role: 'STUDENT'
      },
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
        lastLoginAt: true,
        examSubmissions: {
          where: {
            gradedAt: { not: null }
          },
          select: {
            score: true,
            totalPoints: true,
            percentage: true,
            passed: true,
            submittedAt: true
          }
        }
      }
    });

    return users.map(user => {
      const submissions = user.examSubmissions;
      const totalExams = submissions.length;
      const passedExams = submissions.filter(s => s.passed).length;
      const averageScore = totalExams > 0 
        ? submissions.reduce((sum, s) => sum + (s.percentage || 0), 0) / totalExams 
        : 0;

      // Determine performance level
      let performance: 'excellent' | 'good' | 'average' | 'needs_improvement' = 'needs_improvement';
      if (averageScore >= 90) performance = 'excellent';
      else if (averageScore >= 75) performance = 'good';
      else if (averageScore >= 60) performance = 'average';

      return {
        id: user.id,
        name: user.username,
        email: user.email,
        totalExams: totalExams,
        completedExams: totalExams, // Since we're only getting completed ones
        averageScore: Math.round(averageScore * 10) / 10,
        lastActivity: user.lastLoginAt?.toISOString() || user.createdAt.toISOString(),
        overallPerformance: performance
      };
    });
  }

  /**
   * Get all results for a specific exam (Admin only)
   */
  async getExamAllResults(examId: string) {
    const submissions = await prisma.examSubmission.findMany({
      where: {
        examId: examId,
        gradedAt: { not: null }
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true
          }
        },
        exam: {
          select: {
            questions: {
              select: {
                id: true
              }
            }
          }
        }
      },
      orderBy: [
        { percentage: 'desc' },
        { submittedAt: 'asc' }
      ]
    });

    // Get attempt numbers from sessions
    const submissionIds = submissions.map(s => s.id);
    const sessions = await prisma.examSession.findMany({
      where: {
        submissionId: { in: submissionIds }
      },
      select: {
        submissionId: true,
        attemptNumber: true
      }
    });

    const sessionMap = new Map(sessions.map(s => [s.submissionId!, s.attemptNumber]));

    return submissions.map((submission, index) => {
      const totalQuestions = submission.exam.questions.length;
      const answers = submission.answers as unknown as ExamAnswer[];
      const correctAnswers = answers.filter(answer => {
        // This is a simplified calculation - in a real implementation,
        // you'd need to properly grade each answer
        return true; // Placeholder
      }).length;

      return {
        id: submission.id,
        studentId: submission.userId,
        studentName: submission.user.username,
        studentEmail: submission.user.email,
        score: submission.score || 0,
        totalPoints: submission.totalPoints || 0,
        percentage: submission.percentage || 0,
        passed: submission.passed || false,
        timeSpent: submission.timeSpent,
        submittedAt: submission.submittedAt.toISOString(),
        gradedAt: submission.gradedAt?.toISOString(),
        attemptNumber: sessionMap.get(submission.id) || 1,
        correctAnswers: correctAnswers,
        totalQuestions: totalQuestions,
        isAutoSubmit: submission.isAutoSubmit,
        rank: index + 1
      };
    });
  }

  /**
   * Get exam info and statistics (Admin only)
   */
  async getExamInfoAndStats(examId: string) {
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        questions: {
          include: {
            question: {
              select: {
                points: true
              }
            }
          }
        }
      }
    });

    if (!exam) {
      throw new Error('Exam not found');
    }

    const submissions = await prisma.examSubmission.findMany({
      where: {
        examId: examId,
        gradedAt: { not: null }
      },
      select: {
        score: true,
        totalPoints: true,
        percentage: true,
        passed: true,
        timeSpent: true
      }
    });

    const totalQuestions = exam.questions.length;
    const totalPoints = exam.questions.reduce((sum, eq) => sum + (eq.points || eq.question.points), 0);
    const passingScore = Math.floor(totalPoints * 0.5); // 50% passing score

    // Calculate statistics
    const totalStudents = submissions.length;
    const completedStudents = totalStudents; // Since we're only getting completed ones
    const scores = submissions.map(s => s.score || 0);
    const percentages = submissions.map(s => s.percentage || 0);
    const times = submissions.map(s => s.timeSpent || 0);

    const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const averagePercentage = percentages.length > 0 ? percentages.reduce((a, b) => a + b, 0) / percentages.length : 0;
    const averageTime = times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
    const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
    const lowestScore = scores.length > 0 ? Math.min(...scores) : 0;
    const passedCount = submissions.filter(s => s.passed).length;
    const passRate = totalStudents > 0 ? (passedCount / totalStudents) * 100 : 0;

    // Score distribution
    const scoreDistribution: Record<string, number> = {
      '90-100': 0,
      '80-89': 0,
      '70-79': 0,
      '60-69': 0,
      '50-59': 0,
      '0-49': 0
    };

    percentages.forEach(percentage => {
      if (percentage >= 90) scoreDistribution['90-100']++;
      else if (percentage >= 80) scoreDistribution['80-89']++;
      else if (percentage >= 70) scoreDistribution['70-79']++;
      else if (percentage >= 60) scoreDistribution['60-69']++;
      else if (percentage >= 50) scoreDistribution['50-59']++;
      else scoreDistribution['0-49']++;
    });

    // Safely extract settings with null check
    const settings = (exam.settings as unknown as ExamSettings) || null;
    const timeLimit = settings?.timeLimit || 60; // Default 60 minutes if not set

    return {
      examInfo: {
        id: exam.id,
        title: exam.title,
        description: exam.description,
        totalQuestions: totalQuestions,
        totalPoints: totalPoints,
        passingScore: passingScore,
        timeLimit: timeLimit,
        createdAt: exam.createdAt.toISOString(),
        status: exam.status.toLowerCase() as 'active' | 'archived' | 'draft'
      },
      statistics: {
        totalStudents,
        completedStudents,
        averageScore: Math.round(averageScore * 10) / 10,
        averagePercentage: Math.round(averagePercentage * 10) / 10,
        averageTime: Math.round(averageTime * 10) / 10,
        highestScore,
        lowestScore,
        passRate: Math.round(passRate * 10) / 10,
        scoreDistribution
      }
    };
  }

  /**
   * Get student info and statistics (Admin only)
   */
  async getStudentInfoAndStats(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        examSubmissions: {
          where: {
            gradedAt: { not: null }
          },
          include: {
            exam: {
              select: {
                title: true
              }
            }
          },
          orderBy: {
            submittedAt: 'desc'
          }
        }
      }
    });

    if (!user) {
      throw new Error('Student not found');
    }

    const submissions = user.examSubmissions;
    const totalExamsAvailable = await prisma.exam.count({
      where: {
        status: 'PUBLISHED'
      }
    });

    // Calculate statistics
    const totalExamsCompleted = submissions.length;
    const scores = submissions.map(s => s.score || 0);
    const percentages = submissions.map(s => s.percentage || 0);
    const times = submissions.map(s => s.timeSpent || 0);

    const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const averagePercentage = percentages.length > 0 ? percentages.reduce((a, b) => a + b, 0) / percentages.length : 0;
    const averageTime = times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
    const bestScore = scores.length > 0 ? Math.max(...scores) : 0;
    const worstScore = scores.length > 0 ? Math.min(...scores) : 0;
    const passedCount = submissions.filter(s => s.passed).length;
    const passRate = totalExamsCompleted > 0 ? (passedCount / totalExamsCompleted) * 100 : 0;
    const totalTimeSpent = times.reduce((a, b) => a + b, 0);
    const completionRate = totalExamsAvailable > 0 ? (totalExamsCompleted / totalExamsAvailable) * 100 : 0;

    // Determine performance based on average score
    let performance: 'excellent' | 'good' | 'average' | 'needs_improvement' = 'needs_improvement';
    if (averagePercentage >= 90) performance = 'excellent';
    else if (averagePercentage >= 75) performance = 'good';
    else if (averagePercentage >= 60) performance = 'average';

    // Simple trend calculation based on recent vs older scores
    let performanceTrend: 'improving' | 'declining' | 'stable' = 'stable';
    if (percentages.length >= 3) {
      const recentAvg = percentages.slice(0, Math.floor(percentages.length / 2)).reduce((a, b) => a + b, 0) / Math.floor(percentages.length / 2);
      const olderAvg = percentages.slice(Math.floor(percentages.length / 2)).reduce((a, b) => a + b, 0) / (percentages.length - Math.floor(percentages.length / 2));
      
      if (recentAvg > olderAvg + 5) performanceTrend = 'improving';
      else if (recentAvg < olderAvg - 5) performanceTrend = 'declining';
    }

    return {
      studentInfo: {
        id: user.id,
        name: user.username,
        email: user.email,
        studentId: user.id, // Using ID as student ID for now
        joinedAt: user.createdAt.toISOString(),
        lastActivity: user.lastLoginAt?.toISOString() || user.createdAt.toISOString(),
        totalExams: totalExamsAvailable,
        completedExams: totalExamsCompleted,
        averageScore: Math.round(averagePercentage * 10) / 10,
        overallPerformance: performance
      },
      statistics: {
        totalExamsCompleted,
        totalExamsAvailable,
        averageScore: Math.round(averageScore * 10) / 10,
        averagePercentage: Math.round(averagePercentage * 10) / 10,
        averageTime: Math.round(averageTime * 10) / 10,
        bestScore,
        worstScore,
        passRate: Math.round(passRate * 10) / 10,
        totalTimeSpent,
        streakDays: 0, // Placeholder - would need more complex calculation
        completionRate: Math.round(completionRate * 10) / 10,
        performanceTrend
      }
    };
  }
} 