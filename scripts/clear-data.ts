import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearCustomerTestData() {
  console.log('Clearing customer test data and active sessions...');

  await prisma.cartItem.deleteMany({});
  await prisma.cart.deleteMany({});
  await prisma.wishlistItem.deleteMany({});
  await prisma.returnItem.deleteMany({});
  await prisma.return.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.serviceOrder.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.refreshToken.deleteMany({});
  await prisma.passwordResetToken.deleteMany({});
  await prisma.supportTicket.deleteMany({});

  // Delete non-admin customer accounts
  const deletedUsers = await prisma.user.deleteMany({
    where: {
      role: 'CUSTOMER',
    },
  });

  console.log(`Deleted ${deletedUsers.count} customer accounts and reset activity records.`);
}

clearCustomerTestData()
  .catch((e) => {
    console.error('Error clearing test data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
