/**
 * Mock Factories
 * Provides factory functions for creating test data with customizable properties
 */

import type {
  User,
  Position,
  AppliedPosition,
  Candidate,
  Meeting,
  InterviewParticipant,
  CandidateHistory,
} from '@prisma/client';
import type {
  CreateMeetingRequest,
  CreateCandidateRequest,
  RegisterRequest,
} from '../../utilities/types';

/**
 * Factory for creating Position test data
 */
export const createPosition = (overrides?: Partial<Position>): Position => {
  const defaults: Position = {
    id: 1,
    name: 'Software Engineer',
  };

  return { ...defaults, ...overrides };
};

/**
 * Factory for creating AppliedPosition test data
 */
export const createAppliedPosition = (overrides?: Partial<AppliedPosition>): AppliedPosition => {
  const defaults: AppliedPosition = {
    id: 1,
    name: 'Full Stack Developer',
  };

  return { ...defaults, ...overrides };
};

/**
 * Factory for creating User test data
 */
export const createUser = (overrides?: Partial<User>): User => {
  const timestamp = new Date();

  const defaults: User = {
    id: 1,
    name: 'Test User',
    email: `test-${Date.now()}@example.com`,
    role: 'hr',
    passwordHash: '$2a$10$examplehashedpassword',
    lastLogin: timestamp,
    positionId: 1,
  };

  return { ...defaults, ...overrides };
};

/**
 * Factory for creating Candidate test data
 */
export const createCandidate = (overrides?: Partial<Candidate>): Candidate => {
  const timestamp = new Date();

  const defaults: Candidate = {
    id: 1,
    name: 'John Doe',
    email: `candidate-${Date.now()}@example.com`,
    appliedPositionId: 1,
    status: 'applied',
    interviewNotes: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  return { ...defaults, ...overrides };
};

/**
 * Factory for creating Meeting test data
 */
export const createMeeting = (overrides?: Partial<Meeting>): Meeting => {
  const now = new Date();
  const startTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Tomorrow
  const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour later

  const defaults: Meeting = {
    id: 1,
    title: 'Technical Interview',
    startTime,
    endTime,
    location: 'Conference Room A',
    meetingType: 'onsite',
    notes: null,
    status: 'confirmed',
    userId: 1,
    candidateId: 1,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };

  return { ...defaults, ...overrides };
};

/**
 * Factory for creating InterviewParticipant test data
 */
export const createInterviewParticipant = (
  overrides?: Partial<InterviewParticipant>
): InterviewParticipant => {
  const defaults: InterviewParticipant = {
    id: 1,
    meetingId: 1,
    userId: 1,
  };

  return { ...defaults, ...overrides };
};

/**
 * Factory for creating CandidateHistory test data
 */
export const createCandidateHistory = (overrides?: Partial<CandidateHistory>): CandidateHistory => {
  const defaults: CandidateHistory = {
    id: 1,
    candidateId: 1,
    meetingId: 1,
    feedback: 'Good technical skills',
    recordedAt: new Date(),
  };

  return { ...defaults, ...overrides };
};

/**
 * Factory for creating CreateMeetingRequest test data
 */
export const createMeetingRequest = (
  overrides?: Partial<CreateMeetingRequest>
): CreateMeetingRequest => {
  const startTime = new Date(Date.now() + 24 * 60 * 60 * 1000); // Tomorrow
  const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour later

  const defaults: CreateMeetingRequest = {
    title: 'Technical Interview',
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    location: 'Conference Room A',
    meetingType: 'onsite',
    notes: 'Focus on system design',
    status: 'confirmed',
    candidateId: 1,
    participantIds: [],
  };

  return { ...defaults, ...overrides };
};

/**
 * Factory for creating CreateCandidateRequest test data
 */
export const createCandidateRequest = (
  overrides?: Partial<CreateCandidateRequest>
): CreateCandidateRequest => {
  const defaults: CreateCandidateRequest = {
    name: 'John Doe',
    email: `candidate-${Date.now()}@example.com`,
    appliedPositionId: 1,
    status: 'applied',
    interviewNotes: undefined,
  };

  return { ...defaults, ...overrides };
};

/**
 * Factory for creating RegisterRequest test data
 */
export const createRegisterRequest = (overrides?: Partial<RegisterRequest>): RegisterRequest => {
  const defaults: RegisterRequest = {
    name: 'Test User',
    email: `test-${Date.now()}@example.com`,
    password: 'SecurePassword123!',
    role: 'hr',
    positionId: undefined,
  };

  return { ...defaults, ...overrides };
};

/**
 * Batch factory - creates multiple instances of any factory function
 *
 * @example
 * ```typescript
 * const users = createBatch(createUser, 5, (index) => ({ id: index + 1 }));
 * // Creates 5 users with IDs 1-5
 * ```
 */
export const createBatch = <T>(
  factory: (overrides?: Partial<T>) => T,
  count: number,
  overridesFn?: (index: number) => Partial<T>
): T[] => {
  return Array.from({ length: count }, (_, index) => {
    const overrides = overridesFn ? overridesFn(index) : undefined;
    return factory(overrides);
  });
};

/**
 * Create a meeting with full relationships for testing
 */
export const createMeetingWithRelations = (
  overrides?: Partial<Meeting>
): Meeting & {
  user: User;
  candidate: Candidate | null;
  interviewParticipants: Array<InterviewParticipant & { user: User }>;
} => {
  const meeting = createMeeting(overrides);

  return {
    ...meeting,
    user: createUser({ id: meeting.userId }),
    candidate: meeting.candidateId ? createCandidate({ id: meeting.candidateId }) : null,
    interviewParticipants: [
      {
        id: 1,
        meetingId: meeting.id,
        userId: 2,
        user: createUser({ id: 2, name: 'Participant 1' }),
      },
    ],
  };
};

/**
 * Create a candidate with full relationships for testing
 */
export const createCandidateWithRelations = (
  overrides?: Partial<Candidate>
): Candidate & {
  appliedPosition: AppliedPosition;
  meetings: Meeting[];
  candidateHistories: CandidateHistory[];
} => {
  const candidate = createCandidate(overrides);

  return {
    ...candidate,
    appliedPosition: createAppliedPosition({ id: candidate.appliedPositionId }),
    meetings: [createMeeting({ candidateId: candidate.id })],
    candidateHistories: [
      createCandidateHistory({ candidateId: candidate.id, feedback: 'Initial screening complete' }),
    ],
  };
};

/**
 * Create paginated response for testing
 */
export const createPaginatedResponse = <T>(
  items: T[],
  page = 1,
  pageSize = 10,
  total?: number
): {
  [key: string]: T[] | { total: number; page: number; pageSize: number; totalPages: number };
} => {
  const actualTotal = total ?? items.length;
  const totalPages = Math.ceil(actualTotal / pageSize);

  return {
    [items[0] ? Object.keys(items[0])[0] : 'items']: items,
    pagination: {
      total: actualTotal,
      page,
      pageSize,
      totalPages,
    },
  };
};
