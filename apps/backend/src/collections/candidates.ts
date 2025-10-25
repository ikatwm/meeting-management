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

export async function findCandidates() {
  return prisma.candidate.findMany({
    orderBy: { createdAt: 'desc' },
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
