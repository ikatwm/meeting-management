import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utilities/auth';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create positions
  const positions = await Promise.all([
    prisma.position.create({ data: { name: 'HR Manager' } }),
    prisma.position.create({ data: { name: 'Engineering Manager' } }),
    prisma.position.create({ data: { name: 'Product Manager' } }),
    prisma.position.create({ data: { name: 'Senior Engineer' } }),
  ]);
  console.log('✅ Created positions');

  // Create applied positions
  const appliedPositions = await Promise.all([
    prisma.appliedPosition.create({ data: { name: 'Software Engineer' } }),
    prisma.appliedPosition.create({ data: { name: 'Frontend Developer' } }),
    prisma.appliedPosition.create({ data: { name: 'Backend Developer' } }),
    prisma.appliedPosition.create({ data: { name: 'Full Stack Developer' } }),
    prisma.appliedPosition.create({ data: { name: 'DevOps Engineer' } }),
  ]);
  console.log('✅ Created applied positions');

  // Create users
  const users = await Promise.all([
    prisma.user.create({
      data: {
        name: 'Sarah Johnson',
        email: 'sarah@company.com',
        role: 'hr',
        passwordHash: await hashPassword('password123'),
        positionId: positions[0].id,
      },
    }),
    prisma.user.create({
      data: {
        name: 'Mike Chen',
        email: 'mike@company.com',
        role: 'manager',
        passwordHash: await hashPassword('password123'),
        positionId: positions[1].id,
      },
    }),
    prisma.user.create({
      data: {
        name: 'Emily Davis',
        email: 'emily@company.com',
        role: 'staff',
        passwordHash: await hashPassword('password123'),
        positionId: positions[3].id,
      },
    }),
  ]);
  console.log('✅ Created users');

  // Create candidates
  const candidates = await Promise.all([
    prisma.candidate.create({
      data: {
        name: 'Alice Smith',
        email: 'alice@example.com',
        appliedPositionId: appliedPositions[0].id,
        status: 'interview',
        interviewNotes: 'Strong technical background in React and TypeScript',
      },
    }),
    prisma.candidate.create({
      data: {
        name: 'Bob Wilson',
        email: 'bob@example.com',
        appliedPositionId: appliedPositions[1].id,
        status: 'screening',
        interviewNotes: 'Good portfolio, needs technical assessment',
      },
    }),
    prisma.candidate.create({
      data: {
        name: 'Carol Martinez',
        email: 'carol@example.com',
        appliedPositionId: appliedPositions[2].id,
        status: 'applied',
      },
    }),
  ]);
  console.log('✅ Created candidates');

  // Create meetings
  const meetings = await Promise.all([
    prisma.meeting.create({
      data: {
        title: 'Technical Interview - Alice Smith',
        startTime: new Date('2025-11-05T10:00:00Z'),
        endTime: new Date('2025-11-05T11:00:00Z'),
        location: 'Meeting Room A',
        meetingType: 'onsite',
        notes: 'Focus on React and system design',
        status: 'confirmed',
        userId: users[1].id,
        candidateId: candidates[0].id,
      },
    }),
    prisma.meeting.create({
      data: {
        title: 'Phone Screening - Bob Wilson',
        startTime: new Date('2025-11-06T14:00:00Z'),
        endTime: new Date('2025-11-06T14:30:00Z'),
        meetingType: 'zoom',
        notes: 'Initial screening call',
        status: 'pending',
        userId: users[0].id,
        candidateId: candidates[1].id,
      },
    }),
  ]);
  console.log('✅ Created meetings');

  // Create interview participants
  await prisma.interviewParticipant.create({
    data: {
      meetingId: meetings[0].id,
      userId: users[2].id,
    },
  });
  console.log('✅ Created interview participants');

  // Create candidate history
  await prisma.candidateHistory.create({
    data: {
      candidateId: candidates[0].id,
      meetingId: meetings[0].id,
      feedback: 'Excellent problem-solving skills. Strong communication.',
    },
  });
  console.log('✅ Created candidate history');

  console.log('🎉 Database seeding completed successfully!');
  console.log('\n📝 Sample credentials:');
  console.log('Email: sarah@company.com (HR)');
  console.log('Email: mike@company.com (Manager)');
  console.log('Email: emily@company.com (Staff)');
  console.log('Password: password123 (for all users)\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
