import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting KarkhanaX database seeding...');

  // 1. Seed Admin User
  const adminEmail = 'admin@karkhanax.com';
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash('Admin@12345', 12);
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'KarkhanaX Administrator',
        phone: '+91 96025 60933',
        passwordHash,
        role: 'ADMIN',
        isVerified: true,
      },
    });
    console.log(`Admin user created: ${admin.email}`);
  } else {
    console.log(`Admin user already exists: ${existingAdmin.email}`);
  }

  // 2. Seed Industrial Categories
  const categoriesData = [
    {
      name: 'CNC Laser Cutting',
      slug: 'cnc-laser-cutting',
      description: 'High precision fiber laser cutting for sheet metal, SS, MS, and aluminum plates.',
    },
    {
      name: 'Sheet Metal Bending',
      slug: 'sheet-metal-bending',
      description: 'CNC press brake bending and custom plate forming services.',
    },
    {
      name: 'Industrial Powder Coating',
      slug: 'industrial-powder-coating',
      description: 'In-house electrostatic powder coating plant for durable surface finishing.',
    },
    {
      name: 'Hardware Components',
      slug: 'hardware-components',
      description: 'Standard industrial fasteners, brackets, hinges, and structural hardware.',
    },
  ];

  for (const cat of categoriesData) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, description: cat.description },
      create: cat,
    });
  }
  console.log('Industrial categories seeded successfully.');

  console.log('Database seeding process completed.');
}

main()
  .catch((e) => {
    console.error('Database seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
