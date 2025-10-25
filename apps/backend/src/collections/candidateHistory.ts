import prisma from '../utilities/prisma';
import type { CreateCandidateHistoryRequest } from '../utilities/types';

export async function createCandidateHistory(
  candidateId: number,
  data: CreateCandidateHistoryRequest
) {
  return prisma.candidateHistory.create({
    data: {
      candidateId,
      meetingId: data.meetingId,
      feedback: data.feedback,
    },
    include: {
      meeting: {
        select: {
          id: true,
          title: true,
          startTime: true,
        },
      },
    },
  });
}

export async function findCandidateHistory(candidateId: number) {
  return prisma.candidateHistory.findMany({
    where: { candidateId },
    orderBy: { recordedAt: 'desc' },
    include: {
      meeting: {
        select: {
          id: true,
          title: true,
          startTime: true,
        },
      },
    },
  });
}
