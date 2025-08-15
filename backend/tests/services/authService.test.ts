import { prisma } from '../../src/utils/db';
import {
  hashPassword,
  comparePassword,
  generateSecureToken,
  registerUser,
  loginUser,
  getUserById,
  requestPasswordReset,
  resetPassword,
  verifyEmail
} from '../../src/services/authService';
import { seed as dbseed } from '../../prisma/seed';

describe('Authentication Service', () => {
  let mockPrisma: any;

  beforeEach(async () => {
    // Get the mock from global setup
    mockPrisma = (global as any).mockPrismaClient;
    
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Set up environment variable for JWT
    process.env.JWT_SECRET = 'test-secret-key-for-testing-only';
  });

  afterEach(() => {
    // Clean up environment variables
    delete process.env.JWT_SECRET;
  });

  describe('Password Hashing', () => {
    test('should hash password correctly', async () => {
      const password = 'TestPassword123!';
      const hashedPassword = await hashPassword(password);

      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword).toMatch(/^\$2[ab]\$12\$/); // bcrypt hash pattern
      expect(hashedPassword.length).toBeGreaterThan(50);
    });

    test('should compare password correctly', async () => {
      const password = 'TestPassword123!';
      const hashedPassword = await hashPassword(password);

      const isValid = await comparePassword(password, hashedPassword);
      const isInvalid = await comparePassword('WrongPassword', hashedPassword);

      expect(isValid).toBe(true);
      expect(isInvalid).toBe(false);
    });
  });

  describe('Secure Token Generation', () => {
    test('should generate secure random token', () => {
      const token1 = generateSecureToken();
      const token2 = generateSecureToken();

      expect(typeof token1).toBe('string');
      expect(typeof token2).toBe('string');
      expect(token1.length).toBe(64); // 32 bytes = 64 hex chars
      expect(token2.length).toBe(64);
      expect(token1).not.toBe(token2); // Should be unique
      expect(token1).toMatch(/^[a-f0-9]{64}$/); // Hex pattern
    });
  });

  describe('User Registration', () => {
    beforeEach(async () => {
      await prisma.user.deleteMany();
      await dbseed(prisma);
    });

    // test('should register new user successfully', async () => {
    //   const userData = {
    //     username: 'testuser',
    //     email: 'test@example.com',
    //     password: 'TestPassword123!'
    //   };

    //   const mockUser = {
    //     id: 'test-user-id',
    //     username: userData.username,
    //     email: userData.email,
    //     password: 'hashed-password',
    //     role: 'STUDENT',
    //     emailVerified: false,
    //     emailVerificationToken: 'verification-token'
    //   };

    //   // Mock Prisma calls
    //   mockPrisma.user.findFirst.mockResolvedValue(null); // No existing user
    //   mockPrisma.user.create.mockResolvedValue(mockUser as any);

    //   const result = await registerUser(userData);

    //   expect(result.user.id).toBe(mockUser.id);
    //   expect(result.user.username).toBe(mockUser.username);
    //   expect(result.user.email).toBe(mockUser.email);
    //   expect(result.user.role).toBe(mockUser.role);
    //   expect(result.user.emailVerified).toBe(false);
    //   expect(typeof result.token).toBe('string');
    // });

    test('should throw error for duplicate email', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'TestPassword123!'
      };

      await registerUser(userData);

      const existingUser = {
        id: 'existing-id',
        email: userData.email,
        username: 'different-username'
      };

      await expect(registerUser(userData)).rejects.toThrow('Email đã được sử dụng');
    });

    test('should throw error for duplicate username', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'TestPassword123!'
      };

      await registerUser(userData);

      const existingUser = {
        id: 'existing-id',
        email: 'different@example.com',
        username: userData.username,
        password: 'abc123456',
      };

      await expect(registerUser(existingUser)).rejects.toThrow('Tên đăng nhập đã được sử dụng');
    });
  });

  describe('User Login', () => {
    beforeEach(async () => {
      await prisma.user.deleteMany();
      await dbseed(prisma);
    });

    test('should login user with correct credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'TestPassword123!'
      };

      const hashedPassword = await hashPassword(loginData.password);
      const mockUser = {
        id: 'test-user-id',
        username: 'testuser',
        email: loginData.email,
        password: hashedPassword,
        emailVerified: true
      };
      await prisma.user.create({
        data: mockUser
      });

      const result = await loginUser(loginData);

      expect(result.id).toBe(mockUser.id);
      expect(result.username).toBe(mockUser.username);
      expect(result.email).toBe(mockUser.email);
    });

    test('should throw error for non-existent user', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'TestPassword123!'
      };

      await expect(loginUser(loginData)).rejects.toThrow('Email hoặc mật khẩu không đúng');
    });

    test('should throw error for incorrect password', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'WrongPassword123!'
      };

      const mockUser = {
        username: 'abc',
        email: loginData.email,
        password: 'TestPassword123!'
      };

      await registerUser(mockUser);

      await expect(loginUser(loginData)).rejects.toThrow('Email hoặc mật khẩu không đúng');
    });
  });

  // describe('Email Verification', () => {
  //   test('should verify email with valid token', async () => {
  //     const token = 'valid-verification-token';
  //     const mockUser = {
  //       id: 'test-user-id',
  //       emailVerificationToken: token
  //     };

  //     mockPrisma.user.findFirst.mockResolvedValue(mockUser as any);
  //     mockPrisma.user.update.mockResolvedValue({} as any);

  //     const result = await verifyEmail(token);

  //     expect(result.success).toBe(true);
  //     expect(mockPrisma.user.update).toHaveBeenCalledWith({
  //       where: { id: mockUser.id },
  //       data: {
  //         emailVerified: true,
  //         emailVerificationToken: null
  //       }
  //     });
  //   });

  //   test('should throw error for invalid verification token', async () => {
  //     const token = 'invalid-token';

  //     mockPrisma.user.findFirst.mockResolvedValue(null);

  //     await expect(verifyEmail(token)).rejects.toThrow('Token xác thực email không hợp lệ');
  //   });
  // });

  // describe('Password Reset', () => {
  //   test('should request password reset for existing user', async () => {
  //     const email = 'test@example.com';
  //     const mockUser = {
  //       id: 'test-user-id',
  //       email: email
  //     };

  //     mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);
  //     mockPrisma.user.update.mockResolvedValue({} as any);

  //     const result = await requestPasswordReset(email);

  //     expect(result.success).toBe(true);
  //     expect(mockPrisma.user.update).toHaveBeenCalledWith({
  //       where: { id: mockUser.id },
  //       data: {
  //         passwordResetToken: expect.any(String),
  //         passwordResetExpires: expect.any(Date)
  //       }
  //     });
  //   });

  //   test('should return success for non-existent user (security)', async () => {
  //     const email = 'nonexistent@example.com';

  //     mockPrisma.user.findUnique.mockResolvedValue(null);

  //     const result = await requestPasswordReset(email);

  //     expect(result.success).toBe(true);
  //     expect(mockPrisma.user.update).not.toHaveBeenCalled();
  //   });

  //   test('should reset password with valid token', async () => {
  //     const token = 'valid-reset-token';
  //     const newPassword = 'NewPassword123!';
  //     const futureDate = new Date(Date.now() + 3600000); // 1 hour from now

  //     const mockUser = {
  //       id: 'test-user-id',
  //       passwordResetToken: token,
  //       passwordResetExpires: futureDate
  //     };

  //     mockPrisma.user.findFirst.mockResolvedValue(mockUser as any);
  //     mockPrisma.user.update.mockResolvedValue({} as any);

  //     const result = await resetPassword(token, newPassword);

  //     expect(result.success).toBe(true);
  //     expect(mockPrisma.user.update).toHaveBeenCalledWith({
  //       where: { id: mockUser.id },
  //       data: {
  //         password: expect.any(String),
  //         passwordResetToken: null,
  //         passwordResetExpires: null
  //       }
  //     });
  //   });

  //   test('should throw error for expired reset token', async () => {
  //     const token = 'expired-token';
  //     const newPassword = 'NewPassword123!';

  //     mockPrisma.user.findFirst.mockResolvedValue(null); // No user found with valid token

  //     await expect(resetPassword(token, newPassword)).rejects.toThrow(
  //       'Token đặt lại mật khẩu không hợp lệ hoặc đã hết hạn'
  //     );
  //   });
  // });

  describe('Get User By ID', () => {
    beforeEach(async () => {
      await prisma.user.deleteMany();
      await dbseed(prisma);
    });

    test('should return user data for valid ID', async () => {
      const userId = 'test-user-id';
      const userData = {
        id: userId,
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashed-password',
        emailVerified: true,
      };

      await prisma.user.create({
        data: {
          ...userData,
          roles: {
            connect: [
              { slug: 'student' },
              { slug: 'superuser' }
            ]
          }
        }
      });

      const result = await getUserById(userId) as any;

      expect(result.id).toEqual(userData.id);
      expect(result.username).toEqual(userData.username);
      expect(result.email).toEqual(userData.email);
      expect(result.emailVerified).toEqual(userData.emailVerified);
      expect(result.roles).toEqual(expect.arrayContaining(['student', 'superuser']));
      expect(result.roles.length).toBe(2);
    });

    test('should return null for non-existent user', async () => {
      const userId = 'non-existent-id';

      const result = await getUserById(userId);

      expect(result).toBeNull();
    });
  });
});
