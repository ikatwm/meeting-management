import prisma from '../utilities/prisma';
import { hashPassword } from '../utilities/auth';
import type { RegisterRequest } from '../utilities/types';

export async function createUser(data: RegisterRequest) {
  const passwordHash = await hashPassword(data.password);

  return prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      role: data.role,
      passwordHash,
      positionId: data.positionId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      positionId: true,
    },
  });
}

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
  });
}

export async function findUserById(id: number) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      positionId: true,
      position: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
}

export async function updateUserLastLogin(userId: number) {
  return prisma.user.update({
    where: { id: userId },
    data: { lastLogin: new Date() },
  });
}
