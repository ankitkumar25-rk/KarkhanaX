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

  // 3. Seed Sample Industrial Products
  const laserCategory = await prisma.category.findUnique({ where: { slug: 'cnc-laser-cutting' } });
  const hardwareCategory = await prisma.category.findUnique({ where: { slug: 'hardware-components' } });

  if (laserCategory && hardwareCategory) {
    const productsData = [
      {
        name: 'Laser Cut SS304 Mounting Bracket',
        slug: 'laser-cut-ss304-mounting-bracket',
        description: 'Custom laser cut Stainless Steel 304 mounting bracket, 3mm thickness with countersunk holes.',
        price: 249.00,
        unit: 'piece',
        sku: 'MSB-SS304-03MM',
        materialGrade: 'SS304',
        thicknessMm: 3.0,
        dimensions: '150x100x3 mm',
        weightKg: 0.35,
        finishType: 'Raw Brushed',
        categoryId: laserCategory.id,
      },
      {
        name: 'Heavy Duty Structural L-Angle Bracket',
        slug: 'heavy-duty-structural-l-angle-bracket',
        description: 'Mild Steel powder-coated L-angle bracket for industrial frame support.',
        price: 189.00,
        unit: 'piece',
        sku: 'HW-LAB-MS-05MM',
        materialGrade: 'MS Grade A',
        thicknessMm: 5.0,
        dimensions: '100x100x50 mm',
        weightKg: 0.60,
        finishType: 'Black Powder Coated',
        categoryId: hardwareCategory.id,
      },
    ];

    for (const prod of productsData) {
      await prisma.product.upsert({
        where: { slug: prod.slug },
        update: { price: prod.price, description: prod.description },
        create: prod,
      });
    }
    console.log('Sample industrial products seeded successfully.');
  }

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
