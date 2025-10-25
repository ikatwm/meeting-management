import prisma from '../utilities/prisma';

export async function addParticipant(meetingId: number, userId: number) {
  return prisma.interviewParticipant.create({
    data: {
      meetingId,
      userId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

export async function removeParticipant(meetingId: number, userId: number) {
  return prisma.interviewParticipant.delete({
    where: {
      meetingId_userId: {
        meetingId,
        userId,
      },
    },
  });
}

export async function findParticipantsByMeetingId(meetingId: number) {
  return prisma.interviewParticipant.findMany({
    where: { meetingId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}
