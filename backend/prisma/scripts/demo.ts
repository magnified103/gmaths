import { PrismaClient, Role, QuestionType, Difficulty, ExamStatus, NavigationType, FeedbackType, Prisma } from '@prisma/client';
import bcrypt from 'bcrypt';
import { ExamSettings } from '../../src/types/exam';
import { MultipleChoiceData, QuestionTypeData } from '../../src/types/questions';

const prisma = new PrismaClient();

/**
 * Hash a password using bcrypt with salt rounds.
 * @param password - Plain text password to hash.
 * @returns Promise resolving to the hashed password.
 */
async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

/**
 * Seeds default question categories
 */
async function seedCategories() {
  const existingCategories = await prisma.questionCategory.count();
  if (existingCategories > 0) {
    console.log(' Categories already exist, skipping creation');
    return;
  }

  const categories = [
    {
      name: 'Đại số',
      description: 'Các câu hỏi về đại số và phương trình',
      color: '#3B82F6'
    },
    {
      name: 'Hình học',
      description: 'Các câu hỏi về hình học phẳng và không gian',
      color: '#10B981'
    },
    {
      name: 'Giải tích',
      description: 'Các câu hỏi về giới hạn, đạo hàm và tích phân',
      color: '#F59E0B'
    },
    {
      name: 'Xác suất và thống kê',
      description: 'Các câu hỏi về xác suất và thống kê',
      color: '#8B5CF6'
    },
    {
      name: 'Toán rời rạc',
      description: 'Các câu hỏi về tổ hợp, đồ thị và logic',
      color: '#EF4444'
    },
    {
      name: 'Vật lý',
      description: 'Các câu hỏi về cơ học, điện học và quang học',
      color: '#06B6D4'
    },
    {
      name: 'Hóa học',
      description: 'Các câu hỏi về hóa học hữu cơ và vô cơ',
      color: '#84CC16'
    }
  ];

  for (const category of categories) {
    await prisma.questionCategory.create({
      data: category
    });
  }

  console.log('✅ Created default question categories');
}

/**
 * Seeds default question tags
 */
async function seedTags() {
  const existingTags = await prisma.tag.count();
  if (existingTags > 0) {
    console.log(' Tags already exist, skipping creation');
    return;
  }

  const tags = [
    { name: 'Cơ bản', color: '#10B981' },
    { name: 'Nâng cao', color: '#F59E0B' },
    { name: 'Lớp 10', color: '#3B82F6' },
    { name: 'Lớp 11', color: '#8B5CF6' },
    { name: 'Lớp 12', color: '#EF4444' },
    { name: 'Đại học', color: '#06B6D4' },
    { name: 'Thi thử', color: '#84CC16' },
    { name: 'THPT Quốc gia', color: '#F97316' },
    { name: 'Olympic', color: '#EC4899' },
    { name: 'Thực hành', color: '#6B7280' }
  ];

  for (const tag of tags) {
    await prisma.tag.create({
      data: tag
    });
  }

  console.log(' Created default question tags');
}

/**
 * Main seeding function to populate the database with initial data.
 */
async function main() {
  console.log(' Starting database seeding...');

  const superuserRole = {
    slug: 'superuser',
    name: 'Superuser',
    description: 'Admin',
    permissions: {
      connect: [
        { code: 'Admin:Read' },
        { code: 'User:Create' },
        { code: 'User:Read' },
        { code: 'User:Update' },
        { code: 'User:Delete' },
        { code: 'Stats:Read' },
        { code: 'Exam:Create' },
        { code: 'Exam:Read' },
        { code: 'Exam:Update' },
        { code: 'Exam:Delete' },
        { code: 'Role:Create' },
        { code: 'Role:Read' },
        { code: 'Role:Update' },
        { code: 'Role:Delete' },
        { code: 'ExamSession:Create' },
        { code: 'ExamSession:Read' },
        { code: 'ExamSession:Update' },
        { code: 'ExamSession:Delete' },
        { code: 'Question:Create' },
        { code: 'Question:Read' },
        { code: 'Question:Update' },
        { code: 'Question:Delete' }
      ]
    }
  };

  // Create default roles
  await prisma.role.upsert({
    where: { slug: superuserRole.slug },
    update: superuserRole,
    create: superuserRole,
  });

  // Create student role
  await prisma.role.upsert({
    where: { slug: 'student' },
    update: {
      name: 'Student',
      description: 'Student role with limited permissions',
      permissions: {
        connect: [
          { code: 'ExamSession:Create' },
          { code: 'ExamSession:Read' },
          { code: 'ExamSession:Update' },
          { code: 'ExamSession:Delete' },
        ],
      },
    },
    create: {
      slug: 'student',
      name: 'Student',
      description: 'Student role with limited permissions',
      permissions: {
        connect: [
          { code: 'ExamSession:Create' },
          { code: 'ExamSession:Read' },
          { code: 'ExamSession:Update' },
          { code: 'ExamSession:Delete' },
        ],
      },
    }
  });

  // Create default admin user
  const adminPassword = await hashPassword('Admin@2024!');

  const adminData = {
    username: 'admin',
    email: 'admin@gmaths.edu.vn',
    password: adminPassword,
    roles: {
      connect: [
        { slug: 'superuser' },
      ]
    },
    emailVerified: true, // Admin account is pre-verified
  };
    
  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: adminData,
    create: adminData,
  });

  console.log(' Created default admin user:');
  console.log(`   Email: ${adminUser.email}`);
  console.log(`   Username: ${adminUser.username}`);
  console.log(`   Password: Admin@2024!`);
  console.log(' Please change the default password after first login!');

  // Create default student user
  const studentPassword = await hashPassword('aA!12345');
  const studentData = {
    username: 'test',
    email: 'user@test.com',
    password: studentPassword,
    roles: {
      connect: [
        { slug: 'student' },
      ]
    },
    emailVerified: true, // Student account is pre-verified
  };
  const studentUser = await prisma.user.upsert({
    where: { username: 'test' },
    update: studentData,
    create: studentData,
  });

  // Seed question categories and tags
  await seedCategories();
  await seedTags();

  // Retrieve category and tag IDs for questions
  const algebraCategory = await prisma.questionCategory.findUnique({ where: { name: 'Đại số' } });
  const basicTag = await prisma.tag.findUnique({ where: { name: 'Cơ bản' } });
  const advancedTag = await prisma.tag.findUnique({ where: { name: 'Nâng cao' } });

  if (!algebraCategory || !basicTag || !advancedTag) {
    console.error(' Required categories or tags not found. Skipping demo contest creation.');
    return;
  }

  // Define demo questions
  const demoQuestionsData: Array<Omit<Prisma.QuestionCreateInput, 'tags' | 'category' | 'createdBy' | 'typeData'> & { id: string; tagIds: string[]; categoryId: string; createdById: string; typeData: QuestionTypeData }> = [
    {
      id: 'demo-question-france-capital',
      type: QuestionType.MULTIPLE_CHOICE,
      content: 'What is the capital of France?',
      explanation: 'Paris is the capital and most populous city of France.',
      points: 1.0,
      difficulty: Difficulty.EASY,
      typeData: {
        options: [
          { id: 'opt_0', text: 'Berlin', isCorrect: false },
          { id: 'opt_1', text: 'Madrid', isCorrect: false },
          { id: 'opt_2', text: 'Paris', isCorrect: true },
          { id: 'opt_3', text: 'Rome', isCorrect: false },
        ],
      },
      categoryId: algebraCategory.id,
      createdById: adminUser.id,
      tagIds: [basicTag.id], // Store tag IDs temporarily
    },
    {
      id: 'demo-question-water-symbol',
      type: QuestionType.FILL_BLANK,
      content: 'The chemical symbol for water is _____.',
      explanation: 'Water is a chemical substance with the chemical formula H₂O.',
      points: 2.0,
      difficulty: Difficulty.MEDIUM,
      typeData: {
        blanks: [{ id: 'opt_0', position: 0, acceptedAnswers: ['H2O', 'HHO'], caseSensitive: false }],
      },
      categoryId: algebraCategory.id,
      createdById: adminUser.id,
      tagIds: [basicTag.id, advancedTag.id], // Store tag IDs temporarily
    },
    {
      id: 'demo-question-earth-flat',
      type: QuestionType.TRUE_FALSE,
      content: 'The Earth is flat.',
      explanation: 'The Earth is an oblate spheroid, not flat.',
      points: 1.0,
      difficulty: Difficulty.EASY,
      typeData: {
        correctAnswer: false,
      },
      categoryId: algebraCategory.id,
      createdById: adminUser.id,
      tagIds: [basicTag.id], // Store tag IDs temporarily
    },
  ];

  const createdQuestions: Prisma.QuestionGetPayload<{}>[] = [];
  for (const qData of demoQuestionsData) {
    const { tagIds, createdById, categoryId, typeData, ...questionBaseData } = qData; // Extract tagIds and createdById
    const question = await prisma.question.upsert({
      where: { id: qData.id },
      update: {
        ...questionBaseData,
        typeData: typeData as Prisma.JsonObject,
        createdBy: { connect: { id: createdById } },
        category: { connect: { id: categoryId } },
      },
      create: {
        ...questionBaseData,
        typeData: typeData as Prisma.JsonObject,
        createdBy: { connect: { id: createdById } },
        category: { connect: { id: categoryId } },
      },
    });
    createdQuestions.push(question);
    console.log(` Created demo question: "${question.content.substring(0, 30)}..."`);

    // Connect tags
    for (const tagId of tagIds) {
      await prisma.questionTag.upsert({
        where: {
          questionId_tagId: {
            questionId: question.id,
            tagId: tagId,
          },
        },
        update: {},
        create: {
          questionId: question.id,
          tagId: tagId,
        },
      });
    }
  }

  // Define demo contest (Exam)
  const contestId = 'demo-contest-general-knowledge';
  const contestTitle = 'Demo Contest: General Knowledge Challenge';
  const contestData = {
    id: contestId,
    title: contestTitle,
    description: 'A fun contest to test your general knowledge across various subjects.',
    instructions: 'Answer all questions within the time limit. Good luck!',
    status: ExamStatus.PUBLISHED,
    createdById: adminUser.id,
    settings: {
      timeLimit: 60, // 60 minutes
      maxAttempts: 300,
      scoringMethod: 'highest_score',
      startDate: (new Date()).toISOString(),
      endDate: (new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)).toISOString(), // 1 week from now
      visibility: 'public',
      navigationType: NavigationType.FREE,
      feedbackType: FeedbackType.AFTER_EXAM,
      shuffleQuestions: true,
      showLeaderboard: true,
      shuffleAnswers: false,
      showResults: true,
      showCorrectAnswers: true,
      allowReview: true,
      requireFullscreen: false,
      preventCopyPaste: false,
    },
  };

  const demoContest = await prisma.exam.upsert({
    where: { id: contestId },
    update: contestData,
    create: contestData,
  });
  console.log(` Created demo contest: "${demoContest.title}"`);

  // Link questions to the contest
  for (let i = 0; i < createdQuestions.length; i++) {
    const question = createdQuestions[i];
    await prisma.examQuestion.upsert({
      where: {
        examId_questionId: {
          examId: demoContest.id,
          questionId: question.id,
        },
      },
      update: {
        order: i,
        points: question.points, // Use question's default points
      },
      create: {
        examId: demoContest.id,
        questionId: question.id,
        order: i,
        points: question.points,
      },
    });
    console.log(` Linked question "${question.content.substring(0, 20)}..." to contest.`);
  }

  console.log(' Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(' Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
