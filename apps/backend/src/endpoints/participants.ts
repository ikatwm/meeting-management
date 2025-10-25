import { Router } from 'express';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { addParticipantSchema, validateData } from '../utilities/validation';
import { addParticipant, removeParticipant } from '../collections/participants';
import { findMeetingById } from '../collections/meetings';
import { authMiddleware } from '../utilities/middleware';

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// POST /api/meetings/:id/participants
router.post('/:meetingId/participants', async (req: Request, res: Response) => {
  try {
    const meetingId = parseInt(req.params.meetingId, 10);

    if (isNaN(meetingId)) {
      res.status(400).json({
        error: 'BadRequest',
        message: 'Invalid meeting ID',
      });
      return;
    }

    const data = validateData(addParticipantSchema, req.body);

    // Check if meeting exists
    const meeting = await findMeetingById(meetingId);
    if (!meeting) {
      res.status(404).json({
        error: 'NotFound',
        message: 'Meeting not found',
      });
      return;
    }

    const participant = await addParticipant(meetingId, data.userId);

    res.status(201).json({
      id: participant.id,
      meetingId: participant.meetingId,
      user: participant.user,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'ValidationError',
        message: 'Invalid input data',
        details: error.issues,
      });
      return;
    }

    // Handle unique constraint violation
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      res.status(400).json({
        error: 'BadRequest',
        message: 'Participant already added to this meeting',
      });
      return;
    }

    console.error('Add participant error:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to add participant',
    });
  }
});

// DELETE /api/meetings/:id/participants/:userId
router.delete('/:meetingId/participants/:userId', async (req: Request, res: Response) => {
  try {
    const meetingId = parseInt(req.params.meetingId, 10);
    const userId = parseInt(req.params.userId, 10);

    if (isNaN(meetingId) || isNaN(userId)) {
      res.status(400).json({
        error: 'BadRequest',
        message: 'Invalid meeting ID or user ID',
      });
      return;
    }

    await removeParticipant(meetingId, userId);

    res.status(200).json({
      message: 'Participant removed successfully',
    });
  } catch (error) {
    // Handle not found
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      res.status(404).json({
        error: 'NotFound',
        message: 'Participant not found in this meeting',
      });
      return;
    }

    console.error('Remove participant error:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to remove participant',
    });
  }
});

export default router;
