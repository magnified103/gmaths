/**
 * Exam service unit tests
 * Tests all CRUD operations, validation, and business logic
 */

import { ExamService } from '../../src/services/examService';
import type {
  CreateExamRequest,
  UpdateExamRequest,
  ExamFilters,
} from '../../src/types/exam';

// Mock Prisma client
const mockPrisma = {
  exam: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn(),
  },
  question: {
    findMany: jest.fn(),
  },
  examQuestion: {
    deleteMany: jest.fn(),
    aggregate: jest.fn(),
  },
};

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashedPassword'),
}));

// Mock Prisma client
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => mockPrisma),
}));

describe('ExamService', () => {
  let examService: ExamService;

  const mockUserId = 'user-123';
  const mockExamId = 'exam-123';
  const mockQuestionId = 'question-123';

  const validCreateExamRequest: CreateExamRequest = {
    title: 'Test Exam',
    description: 'A test exam description',
    instructions: 'Test instructions',
    timeLimit: 60,
    maxAttempts: 3,
    shuffleQuestions: false,
    shuffleAnswers: false,
    showResults: true,
    showCorrectAnswers: true,
    feedbackType: 'AFTER_EXAM',
    navigationType: 'FREE',
    allowReview: true,
    requireFullscreen: false,
    preventCopyPaste: false,
    password: 'testpass',
    startDate: '2024-06-01T00:00:00Z',
    endDate: '2024-06-30T23:59:59Z',
    questionIds: [mockQuestionId],
    questionPoints: { [mockQuestionId]: 10 },
  };

  const mockExamResponse = {
    id: mockExamId,
    title: 'Test Exam',
    description: 'A test exam description',
    instructions: 'Test instructions',
    settings: {
      timeLimit: 60,
      maxAttempts: 3,
      shuffleQuestions: false,
      shuffleAnswers: false,
      showResults: true,
      showCorrectAnswers: true,
      feedbackType: 'AFTER_EXAM',
      navigationType: 'FREE',
      allowReview: true,
      requireFullscreen: false,
      preventCopyPaste: false,
      password: 'hashedPassword',
      startDate: '2024-06-01T00:00:00Z',
      endDate: '2024-06-30T23:59:59Z',
    },
    status: 'DRAFT',
    createdById: mockUserId,
    createdAt: new Date(),
    updatedAt: new Date(),
    isDeleted: false,
    deletedAt: null,
    createdBy: {
      id: mockUserId,
      username: 'testuser',
    },
    questions: [
      {
        id: 'exam-question-123',
        questionId: mockQuestionId,
        order: 1,
        points: 10,
        question: {
          id: mockQuestionId,
          content: 'Test question',
          type: 'MULTIPLE_CHOICE',
          points: 5,
          difficulty: 'MEDIUM',
          category: {
            id: 'cat-123',
            name: 'Test Category',
          },
        },
      },
    ],
  };

  beforeEach(() => {
    examService = new ExamService();
    jest.clearAllMocks();
  });

  describe('createExam', () => {
    beforeEach(() => {
      mockPrisma.question.findMany.mockResolvedValue([{ id: mockQuestionId }]);
      mockPrisma.exam.create.mockResolvedValue(mockExamResponse);
    });

    it('should create exam successfully with valid data', async () => {
      const result = await examService.createExam(validCreateExamRequest, mockUserId);

      expect(mockPrisma.question.findMany).toHaveBeenCalledWith({
        where: { 
          id: { in: [mockQuestionId] },
          isDeleted: false 
        },
        select: { id: true }
      });

      expect(mockPrisma.exam.create).toHaveBeenCalledWith({
        data: {
          title: 'Test Exam',
          description: 'A test exam description',
          instructions: 'Test instructions',
          settings: expect.objectContaining({
            timeLimit: 60,
            maxAttempts: 3,
            password: 'hashedPassword',
          }),
          status: 'DRAFT',
          createdById: mockUserId,
          questions: {
            create: [{
              questionId: mockQuestionId,
              order: 1,
              points: 10,
            }]
          }
        },
        include: expect.any(Object)
      });

      expect(result).toEqual(expect.objectContaining({
        id: mockExamId,
        title: 'Test Exam',
        status: 'DRAFT',
      }));
    });

    it('should throw error when exam has no questions', async () => {
      const invalidRequest = { ...validCreateExamRequest, questionIds: [] };

      await expect(examService.createExam(invalidRequest, mockUserId))
        .rejects
        .toThrow('Exam must have at least one question');
    });

    it('should throw error when questions do not exist', async () => {
      mockPrisma.question.findMany.mockResolvedValue([]);

      await expect(examService.createExam(validCreateExamRequest, mockUserId))
        .rejects
        .toThrow('Some questions do not exist or have been deleted');
    });

    it('should throw error with invalid title', async () => {
      const invalidRequest = { ...validCreateExamRequest, title: '' };

      await expect(examService.createExam(invalidRequest, mockUserId))
        .rejects
        .toThrow('Validation failed');
    });

    it('should throw error with invalid time limit', async () => {
      const invalidRequest = { ...validCreateExamRequest, timeLimit: 0 };

      await expect(examService.createExam(invalidRequest, mockUserId))
        .rejects
        .toThrow('Validation failed');
    });

    it('should throw error with invalid max attempts', async () => {
      const invalidRequest = { ...validCreateExamRequest, maxAttempts: 0 };

      await expect(examService.createExam(invalidRequest, mockUserId))
        .rejects
        .toThrow('Validation failed');
    });

    it('should throw error with invalid date range', async () => {
      const invalidRequest = {
        ...validCreateExamRequest,
        startDate: '2024-06-30T00:00:00Z',
        endDate: '2024-06-01T00:00:00Z',
      };

      await expect(examService.createExam(invalidRequest, mockUserId))
        .rejects
        .toThrow('Validation failed');
    });
  });

  describe('getExamById', () => {
    it('should return exam when found', async () => {
      mockPrisma.exam.findUnique.mockResolvedValue(mockExamResponse);

      const result = await examService.getExamById(mockExamId);

      expect(mockPrisma.exam.findUnique).toHaveBeenCalledWith({
        where: { id: mockExamId, isDeleted: false },
        include: expect.any(Object)
      });

      expect(result).toEqual(expect.objectContaining({
        id: mockExamId,
        title: 'Test Exam',
      }));
    });

    it('should return null when exam not found', async () => {
      mockPrisma.exam.findUnique.mockResolvedValue(null);

      const result = await examService.getExamById('nonexistent-id');

      expect(result).toBeNull();
    });
  });

  describe('getExams', () => {
    const mockExamList = [mockExamResponse];

    beforeEach(() => {
      mockPrisma.exam.findMany.mockResolvedValue(mockExamList);
      mockPrisma.exam.count.mockResolvedValue(1);
    });

    it('should return paginated exam list', async () => {
      const filters: ExamFilters = {
        search: 'test',
        status: 'DRAFT',
      };

      const result = await examService.getExams(filters, 1, 20);

      expect(mockPrisma.exam.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          isDeleted: false,
          OR: expect.any(Array),
          status: 'DRAFT',
        }),
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20,
      });

      expect(result).toEqual({
        exams: expect.any(Array),
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
    });

    it('should handle filtering by created user', async () => {
      const filters: ExamFilters = {
        createdById: mockUserId,
      };

      await examService.getExams(filters);

      expect(mockPrisma.exam.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          createdById: mockUserId,
        }),
        include: expect.any(Object),
        orderBy: expect.any(Object),
        skip: expect.any(Number),
        take: expect.any(Number),
      });
    });
  });

  describe('updateExam', () => {
    const updateRequest: UpdateExamRequest = {
      id: mockExamId,
      title: 'Updated Exam Title',
      timeLimit: 90,
    };

    beforeEach(() => {
      mockPrisma.exam.findUnique.mockResolvedValue(mockExamResponse);
      mockPrisma.exam.update.mockResolvedValue({
        ...mockExamResponse,
        title: 'Updated Exam Title',
      });
    });

    it('should update exam successfully', async () => {
      const result = await examService.updateExam(mockExamId, updateRequest, mockUserId);

      expect(mockPrisma.exam.findUnique).toHaveBeenCalledWith({
        where: { id: mockExamId, isDeleted: false },
        include: { questions: true }
      });

      expect(mockPrisma.exam.update).toHaveBeenCalledWith({
        where: { id: mockExamId },
        data: expect.objectContaining({
          title: 'Updated Exam Title',
          settings: expect.any(Object),
        }),
        include: expect.any(Object)
      });

      expect(result.title).toBe('Updated Exam Title');
    });

    it('should throw error when exam not found', async () => {
      mockPrisma.exam.findUnique.mockResolvedValue(null);

      await expect(examService.updateExam('nonexistent', updateRequest, mockUserId))
        .rejects
        .toThrow('Exam not found');
    });

    it('should prevent editing published exam content', async () => {
      const publishedExam = { ...mockExamResponse, status: 'PUBLISHED' };
      mockPrisma.exam.findUnique.mockResolvedValue(publishedExam);

      await expect(examService.updateExam(mockExamId, updateRequest, mockUserId))
        .rejects
        .toThrow('Cannot modify published exam content');
    });

    it('should allow status change on published exam', async () => {
      const publishedExam = { ...mockExamResponse, status: 'PUBLISHED' };
      mockPrisma.exam.findUnique.mockResolvedValue(publishedExam);
      
      const statusUpdate = { id: mockExamId, status: 'ARCHIVED' as const };

      await examService.updateExam(mockExamId, statusUpdate, mockUserId);

      expect(mockPrisma.exam.update).toHaveBeenCalledWith({
        where: { id: mockExamId },
        data: { status: 'ARCHIVED' },
        include: expect.any(Object)
      });
    });
  });

  describe('deleteExam', () => {
    beforeEach(() => {
      mockPrisma.exam.findUnique.mockResolvedValue(mockExamResponse);
      mockPrisma.exam.update.mockResolvedValue(mockExamResponse);
    });

    it('should soft delete exam successfully', async () => {
      await examService.deleteExam(mockExamId, mockUserId);

      expect(mockPrisma.exam.update).toHaveBeenCalledWith({
        where: { id: mockExamId },
        data: {
          isDeleted: true,
          deletedAt: expect.any(Date),
        }
      });
    });

    it('should throw error when exam not found', async () => {
      mockPrisma.exam.findUnique.mockResolvedValue(null);

      await expect(examService.deleteExam('nonexistent', mockUserId))
        .rejects
        .toThrow('Exam not found');
    });
  });

  describe('publishExam', () => {
    it('should publish draft exam successfully', async () => {
      mockPrisma.exam.findUnique.mockResolvedValue(mockExamResponse);
      mockPrisma.exam.update.mockResolvedValue({
        ...mockExamResponse,
        status: 'PUBLISHED',
      });

      const result = await examService.publishExam(mockExamId, mockUserId);

      expect(result.status).toBe('PUBLISHED');
    });

    it('should throw error when exam not found', async () => {
      mockPrisma.exam.findUnique.mockResolvedValue(null);

      await expect(examService.publishExam('nonexistent', mockUserId))
        .rejects
        .toThrow('Exam not found');
    });

    it('should throw error when exam is not draft', async () => {
      const publishedExam = { ...mockExamResponse, status: 'PUBLISHED' };
      mockPrisma.exam.findUnique.mockResolvedValue(publishedExam);

      await expect(examService.publishExam(mockExamId, mockUserId))
        .rejects
        .toThrow('Only draft exams can be published');
    });
  });

  describe('archiveExam', () => {
    it('should archive exam successfully', async () => {
      mockPrisma.exam.findUnique.mockResolvedValue(mockExamResponse);
      mockPrisma.exam.update.mockResolvedValue({
        ...mockExamResponse,
        status: 'ARCHIVED',
      });

      const result = await examService.archiveExam(mockExamId, mockUserId);

      expect(result.status).toBe('ARCHIVED');
    });

    it('should throw error when exam already archived', async () => {
      const archivedExam = { ...mockExamResponse, status: 'ARCHIVED' };
      mockPrisma.exam.findUnique.mockResolvedValue(archivedExam);

      await expect(examService.archiveExam(mockExamId, mockUserId))
        .rejects
        .toThrow('Exam is already archived');
    });
  });

  describe('duplicateExam', () => {
    beforeEach(() => {
      mockPrisma.exam.findUnique.mockResolvedValue(mockExamResponse);
      mockPrisma.question.findMany.mockResolvedValue([{ id: mockQuestionId }]);
      mockPrisma.exam.create.mockResolvedValue({
        ...mockExamResponse,
        id: 'new-exam-123',
        title: 'Test Exam (Copy)',
      });
    });

    it('should duplicate exam successfully', async () => {
      const result = await examService.duplicateExam(mockExamId, undefined, mockUserId);

      expect(result.title).toBe('Test Exam (Copy)');
      expect(result.id).toBe('new-exam-123');
    });

    it('should use custom title when provided', async () => {
      mockPrisma.exam.create.mockResolvedValue({
        ...mockExamResponse,
        id: 'new-exam-123',
        title: 'Custom Title',
      });

      const result = await examService.duplicateExam(mockExamId, 'Custom Title', mockUserId);

      expect(result.title).toBe('Custom Title');
    });
  });

  describe('getExamPreview', () => {
    it('should return preview for published exam', async () => {
      const publishedExam = { ...mockExamResponse, status: 'PUBLISHED' };
      mockPrisma.exam.findUnique.mockResolvedValue(publishedExam);

      const result = await examService.getExamPreview(mockExamId);

      expect(result).toEqual(expect.objectContaining({
        id: mockExamId,
        title: 'Test Exam',
        totalPoints: 10,
        questionCount: 1,
        requiresPassword: true,
      }));
    });

    it('should return null for non-published exam', async () => {
      mockPrisma.exam.findUnique.mockResolvedValue(mockExamResponse);

      const result = await examService.getExamPreview(mockExamId);

      expect(result).toBeNull();
    });
  });

  describe('getExamStatistics', () => {
    beforeEach(() => {
      mockPrisma.exam.count.mockResolvedValue(10);
      mockPrisma.exam.groupBy.mockResolvedValue([
        { status: 'DRAFT', _count: { status: 5 } },
        { status: 'PUBLISHED', _count: { status: 3 } },
        { status: 'ARCHIVED', _count: { status: 2 } },
      ]);
      mockPrisma.examQuestion.aggregate.mockResolvedValue({
        _count: { id: 25 },
        _avg: { order: 2.5 },
      });
    });

    it('should return exam statistics', async () => {
      const result = await examService.getOverallExamStatistics();

      expect(result).toEqual({
        totalExams: 10,
        draftExams: 5,
        publishedExams: 3,
        archivedExams: 2,
        totalQuestions: 25,
        averageQuestionsPerExam: 2.5,
        averageDuration: 0,
      });
    });
  });
}); 