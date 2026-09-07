import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function promoteToAdmin() {
  const email = process.argv[2];

  if (!email) {
    console.error('Usage: npx tsx scripts/promote-admin.ts <user-email>');
    process.exit(1);
  }

  console.log(`Promoting user ${email} to ADMIN role...`);

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    console.error(`User with email ${email} not found.`);
    process.exit(1);
  }

  const updatedUser = await prisma.user.update({
    where: { email },
    data: {
      role: 'ADMIN',
      isVerified: true,
    },
  });

  console.log(`Successfully promoted ${updatedUser.email} to ADMIN role.`);
}

promoteToAdmin()
  .catch((e) => {
    console.error('Error promoting user to admin:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
