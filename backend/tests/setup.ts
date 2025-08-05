// Mock UserRole enum
const UserRole = {
  STUDENT: 'STUDENT',
  ADMIN: 'ADMIN'
};

// Set up test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-testing-only';

// Mock Prisma client
// jest.mock('@prisma/client', () => {
//   return {
//     ...jest.requireActual('@prisma/client'),
//     PrismaClient: jest.requireActual('prismock').PrismockClient,
//   };
// });

import { prisma } from '../src/utils/db';
