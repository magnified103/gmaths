import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export async function seed(prisma: PrismaClient) {
  // generate permissions
  const permissions = [
    { code: 'Admin:Read', description: 'Can access the admin page' },
    { code: 'User:Create', description: 'Can create new users' },
    { code: 'User:Read', description: 'Can read user information' },
    { code: 'User:Update', description: 'Can update user information' },
    { code: 'User:Delete', description: 'Can delete users' },
    { code: 'Stats:Read', description: 'Can read statistics' },
    { code: 'Exam:Create', description: 'Can create exams' },
    { code: 'Exam:Read', description: 'Can read exam information' },
    { code: 'Exam:Update', description: 'Can update exam information' },
    { code: 'Exam:Delete', description: 'Can delete exams' },
    { code: 'Role:Create', description: 'Can create roles' },
    { code: 'Role:Read', description: 'Can read role information' },
    { code: 'Role:Update', description: 'Can update role information' },
    { code: 'Role:Delete', description: 'Can delete roles' },
    { code: 'ExamSession:Create', description: 'Can create exam sessions' },
    { code: 'ExamSession:Read', description: 'Can read exam session information' },
    { code: 'ExamSession:Update', description: 'Can update exam session information' },
    { code: 'ExamSession:Delete', description: 'Can delete exam sessions' },
    { code: 'Question:Create', description: 'Can create questions' },
    { code: 'Question:Read', description: 'Can read question information' },
    { code: 'Question:Update', description: 'Can update question information' },
    { code: 'Question:Delete', description: 'Can delete questions' },
  ];
  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: {
        code: perm.code,
      },
      update: perm,
      create: perm,
    });
  }
}

if (require.main === module) {
  seed(prisma)
    .then(async () => {
      await prisma.$disconnect()
    })
    .catch(async (e) => {
      console.error(e)
      await prisma.$disconnect()
      process.exit(1)
    })
}
