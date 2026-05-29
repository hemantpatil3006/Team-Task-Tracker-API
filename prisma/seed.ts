import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create demo organization
  const org = await prisma.organization.upsert({
    where: { slug: 'demo-org' },
    update: {},
    create: {
      name: 'Demo Organization',
      slug: 'demo-org',
    },
  });

  const BCRYPT_ROUNDS = 12;

  // Create demo users
  const [admin, manager, member] = await Promise.all([
    prisma.user.upsert({
      where: { email: 'admin@demo.com' },
      update: {},
      create: {
        name: 'Alice Admin',
        email: 'admin@demo.com',
        passwordHash: await bcrypt.hash('Admin1234!', BCRYPT_ROUNDS),
        role: 'ADMIN',
        organizationId: org.id,
      },
    }),
    prisma.user.upsert({
      where: { email: 'manager@demo.com' },
      update: {},
      create: {
        name: 'Bob Manager',
        email: 'manager@demo.com',
        passwordHash: await bcrypt.hash('Manager1234!', BCRYPT_ROUNDS),
        role: 'MANAGER',
        organizationId: org.id,
      },
    }),
    prisma.user.upsert({
      where: { email: 'member@demo.com' },
      update: {},
      create: {
        name: 'Carol Member',
        email: 'member@demo.com',
        passwordHash: await bcrypt.hash('Member1234!', BCRYPT_ROUNDS),
        role: 'MEMBER',
        organizationId: org.id,
      },
    }),
  ]);

  // Create demo project
  const project = await prisma.project.create({
    data: {
      name: 'Demo Project',
      description: 'A sample project for testing the API',
      organizationId: org.id,
    },
  });

  // Create demo tasks
  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - 3); // 3 days ago (overdue)

  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 14); // 2 weeks from now

  await Promise.all([
    prisma.task.create({
      data: {
        title: 'Setup CI/CD pipeline',
        description: 'Configure GitHub Actions for automated testing and deployment',
        priority: 'HIGH',
        status: 'IN_PROGRESS',
        assigneeId: member.id,
        projectId: project.id,
        dueDate: futureDate,
      },
    }),
    prisma.task.create({
      data: {
        title: 'Write API documentation',
        description: 'Document all endpoints using Swagger/OpenAPI',
        priority: 'MEDIUM',
        status: 'TODO',
        assigneeId: member.id,
        projectId: project.id,
        dueDate: pastDate, // Overdue for analytics demo
      },
    }),
    prisma.task.create({
      data: {
        title: 'Code review: auth module',
        description: 'Review pull request for the authentication module',
        priority: 'HIGH',
        status: 'DONE',
        assigneeId: manager.id,
        projectId: project.id,
        completedAt: new Date(),
      },
    }),
    prisma.task.create({
      data: {
        title: 'Performance testing',
        description: 'Run load tests and identify bottlenecks',
        priority: 'LOW',
        status: 'BLOCKED',
        assigneeId: member.id,
        projectId: project.id,
        dueDate: futureDate,
      },
    }),
  ]);

  console.log(`✅ Seed complete!`);
  console.log(`\n📋 Demo Credentials:`);
  console.log(`   ADMIN:   admin@demo.com   / Admin1234!`);
  console.log(`   MANAGER: manager@demo.com / Manager1234!`);
  console.log(`   MEMBER:  member@demo.com  / Member1234!`);
  console.log(`\n🌐 Swagger UI: http://localhost:3000/api/docs\n`);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
