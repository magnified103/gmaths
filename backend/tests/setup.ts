// Jest setup file for global configuration

// Create a proper Prisma mock with jest functions
const mockPrismaClient = {
  user: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  $disconnect: jest.fn(),
};

// Mock Prisma client globally
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => mockPrismaClient),
}));

// Set up test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-testing-only';

// Export the mock for test files to use
(global as any).mockPrismaClient = mockPrismaClient; 