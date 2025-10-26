// Type definitions for API requests and responses

// Auth Types
export type RegisterRequest = {
  name: string;
  email: string;
  password: string;
  role: 'hr' | 'manager' | 'staff';
  positionId?: number;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type AuthResponse = {
  token: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
    positionId?: number | null;
  };
};

// Meeting Types
export type MeetingStatus = 'confirmed' | 'pending';
export type MeetingType = 'onsite' | 'zoom' | 'google_meet';

export type CreateMeetingRequest = {
  title: string;
  startTime: string;
  endTime: string;
  location?: string;
  meetingType: MeetingType;
  notes?: string;
  status: MeetingStatus;
  candidateId?: number;
  participantIds?: number[];
};

export type UpdateMeetingRequest = Partial<CreateMeetingRequest>;

export type MeetingResponse = {
  id: number;
  title: string;
  startTime: string;
  endTime: string;
  location?: string | null;
  meetingType: string;
  notes?: string | null;
  status: string;
  userId: number;
  candidateId?: number | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  user?: {
    id: number;
    name: string;
    email: string;
  };
  candidate?: {
    id: number;
    name: string;
    email: string;
  } | null;
  participants?: Array<{
    id: number;
    name: string;
    email: string;
  }>;
};

export type PaginatedMeetingsResponse = {
  meetings: MeetingResponse[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
};

export type PaginatedCandidatesResponse = {
  candidates: CandidateResponse[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
};

// Candidate Types
export type CandidateStatus =
  | 'applied'
  | 'screening'
  | 'interview'
  | 'offer'
  | 'rejected'
  | 'hired';

export type CreateCandidateRequest = {
  name: string;
  email: string;
  appliedPositionId: number;
  status: CandidateStatus;
  interviewNotes?: string;
};

export type UpdateCandidateRequest = Partial<CreateCandidateRequest>;

export type CandidateResponse = {
  id: number;
  name: string;
  email: string;
  appliedPositionId: number;
  status: string;
  interviewNotes?: string | null;
  createdAt: string;
  updatedAt: string;
  appliedPosition?: {
    id: number;
    name: string;
  };
};

// Position Types
export type PositionResponse = {
  id: number;
  name: string;
};

// Participant Types
export type AddParticipantRequest = {
  userId: number;
};

// Candidate History Types
export type CreateCandidateHistoryRequest = {
  meetingId?: number;
  feedback: string;
};

export type CandidateHistoryResponse = {
  id: number;
  candidateId: number;
  meetingId?: number | null;
  feedback: string;
  recordedAt: string;
  meeting?: {
    id: number;
    title: string;
    startTime: string;
  } | null;
};

// Pagination Types
export type PaginationQuery = {
  page?: number;
  pageSize?: number;
};

// Error Response Types
export type ErrorResponse = {
  error: string;
  message: string;
  details?: unknown;
};

// JWT Payload
export type JwtPayload = {
  userId: number;
  email: string;
  role: string;
};
