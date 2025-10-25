import prisma from '../utilities/prisma';

export async function findAllPositions() {
  return prisma.position.findMany({
    orderBy: { name: 'asc' },
  });
}

export async function findAllAppliedPositions() {
  return prisma.appliedPosition.findMany({
    orderBy: { name: 'asc' },
  });
}

export async function findPositionById(id: number) {
  return prisma.position.findUnique({
    where: { id },
  });
}

export async function findAppliedPositionById(id: number) {
  return prisma.appliedPosition.findUnique({
    where: { id },
  });
}
