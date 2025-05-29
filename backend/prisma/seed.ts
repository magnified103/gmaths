import { PrismaClient, UserRole } from '@prisma/client';
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
 * Main seeding function to populate the database with initial data.
 */
async function main() {
  console.log('🌱 Starting database seeding...');

  // Check if admin user already exists
  const existingAdmin = await prisma.user.findFirst({
    where: {
      role: UserRole.ADMIN,
    },
  });

  if (existingAdmin) {
    console.log('✅ Admin user already exists, skipping creation');
    return;
  }

  // Create default admin user
  const adminPassword = await hashPassword('Admin@2024!');
  
  const adminUser = await prisma.user.create({
    data: {
      username: 'admin',
      email: 'admin@gmaths.edu.vn',
      password: adminPassword,
      role: UserRole.ADMIN,
      emailVerified: true, // Admin account is pre-verified
    },
  });

  console.log('✅ Created default admin user:');
  console.log(`   Email: ${adminUser.email}`);
  console.log(`   Username: ${adminUser.username}`);
  console.log(`   Password: Admin@2024!`);
  console.log('   ⚠️  Please change the default password after first login!');

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