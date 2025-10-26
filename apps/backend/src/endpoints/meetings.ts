import { Router } from 'express';
import type { Request, Response } from 'express';
import { z } from 'zod';
import {
  createMeetingSchema,
  updateMeetingSchema,
  paginationSchema,
  validateData,
} from '../utilities/validation';
import {
  createMeeting,
  findMeetings,
  findMeetingById,
  updateMeeting,
  softDeleteMeeting,
} from '../collections/meetings';
import { authMiddleware } from '../utilities/middleware';
import type { PaginatedMeetingsResponse, MeetingResponse } from '../utilities/types';

const router: Router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// GET /api/meetings (with pagination)
router.get('/', async (req: Request, res: Response) => {
  try {
    const { page, pageSize } = validateData(paginationSchema, req.query);

    const { meetings, total } = await findMeetings(page, pageSize);

    const response: PaginatedMeetingsResponse = {
      meetings: meetings.map((meeting) => ({
        id: meeting.id,
        title: meeting.title,
        startTime: meeting.startTime.toISOString(),
        endTime: meeting.endTime.toISOString(),
        location: meeting.location,
        meetingType: meeting.meetingType,
        notes: meeting.notes,
        status: meeting.status,
        userId: meeting.userId,
        candidateId: meeting.candidateId,
        createdAt: meeting.createdAt.toISOString(),
        updatedAt: meeting.updatedAt.toISOString(),
        deletedAt: meeting.deletedAt?.toISOString() ?? null,
        user: meeting.user,
        candidate: meeting.candidate,
        participants: meeting.interviewParticipants.map((p) => p.user),
      })),
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };

    res.status(200).json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'ValidationError',
        message: 'Invalid query parameters',
        details: error.issues,
      });
      return;
    }

    console.error('Get meetings error:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to fetch meetings',
    });
  }
});

// POST /api/meetings
router.post('/', async (req: Request, res: Response) => {
  try {
    const data = validateData(createMeetingSchema, req.body);
    const userId = req.user!.userId;

    const meeting = await createMeeting(userId, data);

    const response: MeetingResponse = {
      id: meeting.id,
      title: meeting.title,
      startTime: meeting.startTime.toISOString(),
      endTime: meeting.endTime.toISOString(),
      location: meeting.location,
      meetingType: meeting.meetingType,
      notes: meeting.notes,
      status: meeting.status,
      userId: meeting.userId,
      candidateId: meeting.candidateId,
      createdAt: meeting.createdAt.toISOString(),
      updatedAt: meeting.updatedAt.toISOString(),
      deletedAt: meeting.deletedAt?.toISOString() ?? null,
      user: meeting.user,
      candidate: meeting.candidate,
      participants: meeting.interviewParticipants.map((p) => p.user),
    };

    res.status(201).json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'ValidationError',
        message: 'Invalid input data',
        details: error.issues,
      });
      return;
    }

    console.error('Create meeting error:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to create meeting',
    });
  }
});

// GET /api/meetings/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      res.status(400).json({
        error: 'BadRequest',
        message: 'Invalid meeting ID',
      });
      return;
    }

    const meeting = await findMeetingById(id);

    if (!meeting) {
      res.status(404).json({
        error: 'NotFound',
        message: 'Meeting not found',
      });
      return;
    }

    const response: MeetingResponse = {
      id: meeting.id,
      title: meeting.title,
      startTime: meeting.startTime.toISOString(),
      endTime: meeting.endTime.toISOString(),
      location: meeting.location,
      meetingType: meeting.meetingType,
      notes: meeting.notes,
      status: meeting.status,
      userId: meeting.userId,
      candidateId: meeting.candidateId,
      createdAt: meeting.createdAt.toISOString(),
      updatedAt: meeting.updatedAt.toISOString(),
      deletedAt: meeting.deletedAt?.toISOString() ?? null,
      user: meeting.user,
      candidate: meeting.candidate,
      participants: meeting.interviewParticipants.map((p) => p.user),
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Get meeting error:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to fetch meeting',
    });
  }
});

// PUT /api/meetings/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      res.status(400).json({
        error: 'BadRequest',
        message: 'Invalid meeting ID',
      });
      return;
    }

    const data = validateData(updateMeetingSchema, req.body);

    const existingMeeting = await findMeetingById(id);
    if (!existingMeeting) {
      res.status(404).json({
        error: 'NotFound',
        message: 'Meeting not found',
      });
      return;
    }

    const meeting = await updateMeeting(id, data);

    const response: MeetingResponse = {
      id: meeting.id,
      title: meeting.title,
      startTime: meeting.startTime.toISOString(),
      endTime: meeting.endTime.toISOString(),
      location: meeting.location,
      meetingType: meeting.meetingType,
      notes: meeting.notes,
      status: meeting.status,
      userId: meeting.userId,
      candidateId: meeting.candidateId,
      createdAt: meeting.createdAt.toISOString(),
      updatedAt: meeting.updatedAt.toISOString(),
      deletedAt: meeting.deletedAt?.toISOString() ?? null,
      user: meeting.user,
      candidate: meeting.candidate,
      participants: meeting.interviewParticipants.map((p) => p.user),
    };

    res.status(200).json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'ValidationError',
        message: 'Invalid input data',
        details: error.issues,
      });
      return;
    }

    console.error('Update meeting error:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to update meeting',
    });
  }
});

// DELETE /api/meetings/:id (soft delete)
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      res.status(400).json({
        error: 'BadRequest',
        message: 'Invalid meeting ID',
      });
      return;
    }

    const existingMeeting = await findMeetingById(id);
    if (!existingMeeting) {
      res.status(404).json({
        error: 'NotFound',
        message: 'Meeting not found',
      });
      return;
    }

    await softDeleteMeeting(id);

    res.status(200).json({
      message: 'Meeting deleted successfully',
    });
  } catch (error) {
    console.error('Delete meeting error:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to delete meeting',
    });
  }
});

export default router;
