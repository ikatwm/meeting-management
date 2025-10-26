import prisma from '../utilities/prisma';
import type { CreateCandidateRequest, UpdateCandidateRequest } from '../utilities/types';

export async function createCandidate(data: CreateCandidateRequest) {
  return prisma.candidate.create({
    data,
    include: {
      appliedPosition: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
}

export async function findCandidates(
  page: number = 1,
  pageSize: number = 10,
  search?: string,
  status?: string
) {
  const skip = (page - 1) * pageSize;

  // Build where clause for filtering
  const where: any = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (status) {
    where.status = status;
  }

  const [candidates, total] = await Promise.all([
    prisma.candidate.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        appliedPosition: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }),
    prisma.candidate.count({ where }),
  ]);

  return { candidates, total };
}

export async function findCandidateById(id: number) {
  return prisma.candidate.findUnique({
    where: { id },
    include: {
      appliedPosition: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
}

export async function updateCandidate(id: number, data: UpdateCandidateRequest) {
  return prisma.candidate.update({
    where: { id },
    data,
    include: {
      appliedPosition: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
}

export async function deleteCandidate(id: number) {
  return prisma.candidate.delete({
    where: { id },
  });
}

export async function findCandidateByEmail(email: string) {
  return prisma.candidate.findUnique({
    where: { email },
  });
}
