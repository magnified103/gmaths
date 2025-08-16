import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

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
    console.log('✅ Categories already exist, skipping creation');
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
    console.log('✅ Tags already exist, skipping creation');
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

  console.log('✅ Created default question tags');
}

/**
 * Main seeding function to populate the database with initial data.
 */
async function main() {
  console.log('🌱 Starting database seeding...');

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

  console.log('✅ Created default admin user:');
  console.log(`   Email: ${adminUser.email}`);
  console.log(`   Username: ${adminUser.username}`);
  console.log(`   Password: Admin@2024!`);
  console.log('   ⚠️  Please change the default password after first login!');

  // Seed question categories and tags
  await seedCategories();
  await seedTags();

  console.log('🌱 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 