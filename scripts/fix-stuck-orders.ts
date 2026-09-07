import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixStuckOrders() {
  console.log('Scanning for orders stuck in PENDING status for over 24 hours...');

  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const stuckOrders = await prisma.order.findMany({
    where: {
      status: 'PENDING',
      paymentStatus: 'PENDING',
      createdAt: {
        lt: cutoff,
      },
    },
  });

  console.log(`Found ${stuckOrders.length} stuck pending orders.`);

  for (const order of stuckOrders) {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'CANCELLED',
        notes: 'Order auto-cancelled due to expired pending payment window.',
      },
    });
    console.log(`Auto-cancelled stuck order: ${order.id}`);
  }

  console.log('Order maintenance cleanup complete.');
}

fixStuckOrders()
  .catch((e) => {
    console.error('Error running fix-stuck-orders script:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
