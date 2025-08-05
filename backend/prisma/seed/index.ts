import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export async function seed(prisma: PrismaClient) {
  // generate permissions
  const permissions = [
    { code: 'User:Create' },
    { code: 'User:Read' },
    { code: 'User:Update' },
    { code: 'User:Delete' },
  ];
  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: {
        code: perm.code,
      },
      update: {},
      create: {
        code: perm.code,
      },
    });
  }

  // generate roles
  const roles = [
    { slug: 'student', name: 'Student', perms: [] },
    { slug: 'staff', name: 'Staff', perms: [], },
    { slug: 'superuser', name: 'Superuser', perms: [], },
  ];
  for (const role of roles) {
    await prisma.role.upsert({
      where: { slug: role.slug },
      update: {},
      create: {
        slug: role.slug,
        name: role.name,
        permissions: {
          connect: role.perms.map((perm) => ({
            code: perm
          })),
        },
      },
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
