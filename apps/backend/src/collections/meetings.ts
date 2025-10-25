import prisma from '../utilities/prisma';
import type { CreateMeetingRequest, UpdateMeetingRequest } from '../utilities/types';

export async function createMeeting(userId: number, data: CreateMeetingRequest) {
  const { participantIds, ...meetingData } = data;

  return prisma.meeting.create({
    data: {
      ...meetingData,
      startTime: new Date(data.startTime),
      endTime: new Date(data.endTime),
      userId,
      interviewParticipants: participantIds
        ? {
            create: participantIds.map((participantUserId) => ({
              userId: participantUserId,
            })),
          }
        : undefined,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      candidate: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      interviewParticipants: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });
}

export async function findMeetings(page: number, pageSize: number, includeDeleted = false) {
  const skip = (page - 1) * pageSize;

  const where = includeDeleted ? {} : { deletedAt: null };

  const [meetings, total] = await Promise.all([
    prisma.meeting.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { startTime: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        candidate: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        interviewParticipants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    }),
    prisma.meeting.count({ where }),
  ]);

  return { meetings, total };
}

export async function findMeetingById(id: number) {
  return prisma.meeting.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      candidate: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      interviewParticipants: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });
}

export async function updateMeeting(id: number, data: UpdateMeetingRequest) {
  const { participantIds, ...updateData } = data;

  const meeting = await prisma.meeting.update({
    where: { id },
    data: {
      ...updateData,
      ...(data.startTime && { startTime: new Date(data.startTime) }),
      ...(data.endTime && { endTime: new Date(data.endTime) }),
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      candidate: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      interviewParticipants: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  return meeting;
}

export async function softDeleteMeeting(id: number) {
  return prisma.meeting.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}

export async function hardDeleteMeeting(id: number) {
  return prisma.meeting.delete({
    where: { id },
  });
}
