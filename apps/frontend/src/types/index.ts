export type UserRole = 'hr' | 'manager' | 'staff';

export type MeetingStatus = 'confirmed' | 'pending';

export type MeetingType = 'onsite' | 'zoom' | 'google_meet';

export type CandidateStatus = 'pending' | 'interviewing' | 'rejected' | 'accepted';

export type User = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  positionId: number | null;
  position?: Position;
  lastLogin: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Position = {
  id: number;
  name: string;
};

export type AppliedPosition = {
  id: number;
  name: string;
};

export type Candidate = {
  id: number;
  name: string;
  email: string;
  appliedPositionId: number;
  appliedPosition?: AppliedPosition;
  status: CandidateStatus;
  interviewNotes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Meeting = {
  id: number;
  title: string;
  startTime: string;
  endTime: string;
  location: string | null;
  meetingType: MeetingType;
  notes: string | null;
  status: MeetingStatus;
  userId: number;
  user?: User;
  candidateId: number;
  candidate?: Candidate;
  participants?: User[]; // Backend returns User array directly
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type InterviewParticipant = {
  id: number;
  meetingId: number;
  userId: number;
  user?: User;
};

export type CandidateHistory = {
  id: number;
  candidateId: number;
  meetingId: number | null;
  meeting?: Meeting;
  feedback: string;
  recordedAt: string;
};

export type Pagination = {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type PaginatedResponse<T> = {
  data: T[];
  pagination: Pagination;
};

// Backend API response types (actual format from API)
export type MeetingsApiResponse = {
  meetings: Meeting[];
  pagination: Pagination;
};

export type CandidatesApiResponse = {
  candidates: Candidate[];
  pagination: Pagination;
};

export type LoginCredentials = {
  email: string;
  password: string;
};

export type AuthResponse = {
  token: string;
  user: User;
};

export type CreateMeetingInput = {
  title: string;
  startTime: string;
  endTime: string;
  location: string;
  meetingType: MeetingType;
  notes?: string;
  status: MeetingStatus;
  candidateId: number;
  participantIds?: number[];
};

export type UpdateMeetingInput = Partial<CreateMeetingInput>;

export type CreateCandidateInput = {
  name: string;
  email: string;
  appliedPositionId: number;
  status?: CandidateStatus;
  interviewNotes?: string;
};

export type UpdateCandidateInput = Partial<CreateCandidateInput>;

export type ApiError = {
  message: string;
  statusCode?: number;
  errors?: Record<string, string[]>;
};
