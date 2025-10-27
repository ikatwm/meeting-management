import { z } from 'zod';

// Auth Validation Schemas
export const registerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  email: z.email('Invalid email format').max(255),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['hr', 'manager', 'staff']),
  positionId: z.number().int().min(1, 'Position ID must be positive').optional(),
});

export const loginSchema = z.object({
  email: z.email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

// Meeting Validation Schemas
export const createMeetingSchema = z
  .object({
    title: z.string().min(1, 'Title is required').max(255),
    startTime: z.iso.datetime('Invalid start time format'),
    endTime: z.iso.datetime('Invalid end time format'),
    location: z.string().max(255).optional(),
    meetingType: z.enum(['onsite', 'zoom', 'google_meet']),
    notes: z.string().optional(),
    status: z.enum(['confirmed', 'pending']),
    candidateId: z.number().int().min(1, 'Candidate ID must be positive').optional(),
    participantIds: z.array(z.number().int().min(1, 'User ID must be positive')).optional(),
  })
  .refine((data) => new Date(data.endTime) > new Date(data.startTime), {
    message: 'End time must be after start time',
    path: ['endTime'],
  });

export const updateMeetingSchema = createMeetingSchema.partial();

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1, 'Page must be positive').default(1),
  pageSize: z.coerce.number().int().min(1, 'Page size must be positive').max(100).default(10),
});

// Candidate Validation Schemas
export const createCandidateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  email: z.email('Invalid email format').max(255),
  appliedPositionId: z.number().int().min(1, 'Valid applied position ID is required'),
  status: z.enum(['applied', 'screening', 'interview', 'offer', 'rejected', 'hired']),
  interviewNotes: z.string().optional(),
});

export const updateCandidateSchema = createCandidateSchema.partial();

// Participant Validation Schemas
export const addParticipantSchema = z.object({
  userId: z.number().int().min(1, 'Valid user ID is required'),
});

// Candidate History Validation Schemas
export const createCandidateHistorySchema = z.object({
  meetingId: z.number().int().min(1, 'Meeting ID must be positive').optional(),
  feedback: z.string().min(1, 'Feedback is required'),
});

// Generic validation helper
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}
