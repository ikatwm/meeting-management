/**
 * Test Fixtures
 * Provides sample data for users, meetings, candidates, and positions
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

/**
 * Sample Position fixtures
 */
export const positionFixtures = {
  seniorDeveloper: {
    id: 1,
    name: 'Senior Developer',
  } as Position,

  productManager: {
    id: 2,
    name: 'Product Manager',
  } as Position,

  designer: {
    id: 3,
    name: 'UX Designer',
  } as Position,

  qaEngineer: {
    id: 4,
    name: 'QA Engineer',
  } as Position,
};

/**
 * Sample Applied Position fixtures
 */
export const appliedPositionFixtures = {
  fullStackDeveloper: {
    id: 1,
    name: 'Full Stack Developer',
  } as AppliedPosition,

  frontendDeveloper: {
    id: 2,
    name: 'Frontend Developer',
  } as AppliedPosition,

  backendDeveloper: {
    id: 3,
    name: 'Backend Developer',
  } as AppliedPosition,

  dataScientist: {
    id: 4,
    name: 'Data Scientist',
  } as AppliedPosition,
};

/**
 * Sample User fixtures with different roles
 */
export const userFixtures = {
  hrUser: {
    id: 1,
    name: 'HR Manager',
    email: 'hr@example.com',
    role: 'hr',
    passwordHash: '$2a$10$examplehashedpassword',
    lastLogin: new Date('2024-01-15T10:00:00Z'),
    positionId: 2,
  } as User,

  managerUser: {
    id: 2,
    name: 'Engineering Manager',
    email: 'manager@example.com',
    role: 'manager',
    passwordHash: '$2a$10$examplehashedpassword',
    lastLogin: new Date('2024-01-15T09:00:00Z'),
    positionId: 1,
  } as User,

  staffUser: {
    id: 3,
    name: 'Staff Engineer',
    email: 'staff@example.com',
    role: 'staff',
    passwordHash: '$2a$10$examplehashedpassword',
    lastLogin: new Date('2024-01-14T15:00:00Z'),
    positionId: 1,
  } as User,

  anotherStaff: {
    id: 4,
    name: 'Senior Staff',
    email: 'senior.staff@example.com',
    role: 'staff',
    passwordHash: '$2a$10$examplehashedpassword',
    lastLogin: new Date('2024-01-14T16:00:00Z'),
    positionId: 1,
  } as User,
};

/**
 * Sample Candidate fixtures
 */
export const candidateFixtures = {
  appliedCandidate: {
    id: 1,
    name: 'John Doe',
    email: 'john.doe@example.com',
    appliedPositionId: 1,
    status: 'applied',
    interviewNotes: null,
    createdAt: new Date('2024-01-10T10:00:00Z'),
    updatedAt: new Date('2024-01-10T10:00:00Z'),
  } as Candidate,

  screeningCandidate: {
    id: 2,
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    appliedPositionId: 1,
    status: 'screening',
    interviewNotes: 'Strong technical background',
    createdAt: new Date('2024-01-08T14:00:00Z'),
    updatedAt: new Date('2024-01-12T09:00:00Z'),
  } as Candidate,

  interviewCandidate: {
    id: 3,
    name: 'Bob Johnson',
    email: 'bob.johnson@example.com',
    appliedPositionId: 2,
    status: 'interview',
    interviewNotes: 'Excellent communication skills',
    createdAt: new Date('2024-01-05T11:00:00Z'),
    updatedAt: new Date('2024-01-14T10:00:00Z'),
  } as Candidate,

  offerCandidate: {
    id: 4,
    name: 'Alice Williams',
    email: 'alice.williams@example.com',
    appliedPositionId: 3,
    status: 'offer',
    interviewNotes: 'Top performer, extended offer',
    createdAt: new Date('2024-01-03T09:00:00Z'),
    updatedAt: new Date('2024-01-15T14:00:00Z'),
  } as Candidate,

  rejectedCandidate: {
    id: 5,
    name: 'Charlie Brown',
    email: 'charlie.brown@example.com',
    appliedPositionId: 1,
    status: 'rejected',
    interviewNotes: 'Not a good fit for the role',
    createdAt: new Date('2024-01-02T10:00:00Z'),
    updatedAt: new Date('2024-01-10T16:00:00Z'),
  } as Candidate,
};

/**
 * Sample Meeting fixtures
 */
export const meetingFixtures = {
  upcomingMeeting: {
    id: 1,
    title: 'Technical Interview - John Doe',
    startTime: new Date('2024-01-20T14:00:00Z'),
    endTime: new Date('2024-01-20T15:00:00Z'),
    location: 'Conference Room A',
    meetingType: 'onsite',
    notes: 'Focus on system design and coding',
    status: 'confirmed',
    userId: 2,
    candidateId: 1,
    createdAt: new Date('2024-01-15T10:00:00Z'),
    updatedAt: new Date('2024-01-15T10:00:00Z'),
    deletedAt: null,
  } as Meeting,

  zoomMeeting: {
    id: 2,
    title: 'Initial Screening - Jane Smith',
    startTime: new Date('2024-01-18T10:00:00Z'),
    endTime: new Date('2024-01-18T11:00:00Z'),
    location: 'https://zoom.us/j/123456789',
    meetingType: 'zoom',
    notes: 'Behavioral questions and background check',
    status: 'confirmed',
    userId: 1,
    candidateId: 2,
    createdAt: new Date('2024-01-12T14:00:00Z'),
    updatedAt: new Date('2024-01-12T14:00:00Z'),
    deletedAt: null,
  } as Meeting,

  pendingMeeting: {
    id: 3,
    title: 'Follow-up Interview - Bob Johnson',
    startTime: new Date('2024-01-22T15:00:00Z'),
    endTime: new Date('2024-01-22T16:00:00Z'),
    location: 'https://meet.google.com/abc-defg-hij',
    meetingType: 'google_meet',
    notes: 'Team fit discussion',
    status: 'pending',
    userId: 2,
    candidateId: 3,
    createdAt: new Date('2024-01-14T11:00:00Z'),
    updatedAt: new Date('2024-01-14T11:00:00Z'),
    deletedAt: null,
  } as Meeting,

  pastMeeting: {
    id: 4,
    title: 'Final Round - Alice Williams',
    startTime: new Date('2024-01-10T13:00:00Z'),
    endTime: new Date('2024-01-10T14:30:00Z'),
    location: 'Executive Suite',
    meetingType: 'onsite',
    notes: 'Decision made to extend offer',
    status: 'confirmed',
    userId: 1,
    candidateId: 4,
    createdAt: new Date('2024-01-08T09:00:00Z'),
    updatedAt: new Date('2024-01-10T15:00:00Z'),
    deletedAt: null,
  } as Meeting,

  deletedMeeting: {
    id: 5,
    title: 'Cancelled Interview - Charlie Brown',
    startTime: new Date('2024-01-12T10:00:00Z'),
    endTime: new Date('2024-01-12T11:00:00Z'),
    location: 'Conference Room B',
    meetingType: 'onsite',
    notes: 'Candidate withdrew application',
    status: 'confirmed',
    userId: 1,
    candidateId: 5,
    createdAt: new Date('2024-01-05T14:00:00Z'),
    updatedAt: new Date('2024-01-08T10:00:00Z'),
    deletedAt: new Date('2024-01-08T10:00:00Z'),
  } as Meeting,
};

/**
 * Sample Interview Participant fixtures
 */
export const interviewParticipantFixtures = {
  participant1: {
    id: 1,
    meetingId: 1,
    userId: 3,
  } as InterviewParticipant,

  participant2: {
    id: 2,
    meetingId: 1,
    userId: 4,
  } as InterviewParticipant,

  participant3: {
    id: 3,
    meetingId: 2,
    userId: 2,
  } as InterviewParticipant,
};

/**
 * Sample Candidate History fixtures
 */
export const candidateHistoryFixtures = {
  history1: {
    id: 1,
    candidateId: 2,
    meetingId: 2,
    feedback: 'Strong candidate, good technical knowledge',
    recordedAt: new Date('2024-01-12T15:00:00Z'),
  } as CandidateHistory,

  history2: {
    id: 2,
    candidateId: 3,
    meetingId: null,
    feedback: 'Resume screened, moving to interview stage',
    recordedAt: new Date('2024-01-14T09:00:00Z'),
  } as CandidateHistory,

  history3: {
    id: 3,
    candidateId: 4,
    meetingId: 4,
    feedback: 'Excellent performance, extending offer',
    recordedAt: new Date('2024-01-10T15:00:00Z'),
  } as CandidateHistory,
};

/**
 * Helper to create a complete meeting with related data
 */
export const createCompleteMeeting = (
  overrides?: Partial<Meeting>
): Meeting & {
  user: User;
  candidate: Candidate;
  interviewParticipants: InterviewParticipant[];
} => {
  return {
    ...meetingFixtures.upcomingMeeting,
    ...overrides,
    user: userFixtures.managerUser,
    candidate: candidateFixtures.appliedCandidate,
    interviewParticipants: [interviewParticipantFixtures.participant1],
  };
};

/**
 * Helper to create a complete candidate with related data
 */
export const createCompleteCandidate = (
  overrides?: Partial<Candidate>
): Candidate & {
  appliedPosition: AppliedPosition;
  meetings: Meeting[];
  candidateHistories: CandidateHistory[];
} => {
  return {
    ...candidateFixtures.appliedCandidate,
    ...overrides,
    appliedPosition: appliedPositionFixtures.fullStackDeveloper,
    meetings: [meetingFixtures.upcomingMeeting],
    candidateHistories: [candidateHistoryFixtures.history1],
  };
};

/**
 * Helper to create arrays of fixtures for pagination testing
 */
export const createFixtureArray = <T>(fixture: T, count: number): T[] => {
  return Array.from({ length: count }, (_, i) => ({
    ...fixture,
    id: i + 1,
  }));
};
