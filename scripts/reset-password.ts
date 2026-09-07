import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function resetAdminPassword() {
  const email = process.argv[2] || 'admin@karkhanax.com';
  const newPassword = process.argv[3] || 'Admin@12345';

  console.log(`Resetting password for user: ${email}`);

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    console.error(`Error: User with email ${email} not found.`);
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { email },
    data: { passwordHash, isVerified: true },
  });

  console.log(`Successfully updated password for ${email}`);
}

resetAdminPassword()
  .catch((e) => {
    console.error('Password reset script error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
