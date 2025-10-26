import { Router } from 'express';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { createCandidateHistorySchema, validateData } from '../utilities/validation';
import { createCandidateHistory, findCandidateHistory } from '../collections/candidateHistory';
import { findCandidateById } from '../collections/candidates';
import { authMiddleware } from '../utilities/middleware';
import type { CandidateHistoryResponse } from '../utilities/types';

const router: Router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// GET /api/candidates/:id/history
router.get('/:candidateId/history', async (req: Request, res: Response) => {
  try {
    const candidateId = parseInt(req.params.candidateId, 10);

    if (isNaN(candidateId)) {
      res.status(400).json({
        error: 'BadRequest',
        message: 'Invalid candidate ID',
      });
      return;
    }

    // Check if a candidate exists
    const candidate = await findCandidateById(candidateId);
    if (!candidate) {
      res.status(404).json({
        error: 'NotFound',
        message: 'Candidate not found',
      });
      return;
    }

    const history = await findCandidateHistory(candidateId);

    const response: CandidateHistoryResponse[] = history.map((item) => ({
      id: item.id,
      candidateId: item.candidateId,
      meetingId: item.meetingId,
      feedback: item.feedback,
      recordedAt: item.recordedAt.toISOString(),
      meeting: item.meeting
        ? {
            id: item.meeting.id,
            title: item.meeting.title,
            startTime: item.meeting.startTime.toISOString(),
          }
        : null,
    }));

    res.status(200).json(response);
  } catch (error) {
    console.error('Get candidate history error:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to fetch candidate history',
    });
  }
});

// POST /api/candidates/:id/history
router.post('/:candidateId/history', async (req: Request, res: Response) => {
  try {
    const candidateId = parseInt(req.params.candidateId, 10);

    if (isNaN(candidateId)) {
      res.status(400).json({
        error: 'BadRequest',
        message: 'Invalid candidate ID',
      });
      return;
    }

    const data = validateData(createCandidateHistorySchema, req.body);

    // Check if candidate exists
    const candidate = await findCandidateById(candidateId);
    if (!candidate) {
      res.status(404).json({
        error: 'NotFound',
        message: 'Candidate not found',
      });
      return;
    }

    const historyItem = await createCandidateHistory(candidateId, data);

    const response: CandidateHistoryResponse = {
      id: historyItem.id,
      candidateId: historyItem.candidateId,
      meetingId: historyItem.meetingId,
      feedback: historyItem.feedback,
      recordedAt: historyItem.recordedAt.toISOString(),
      meeting: historyItem.meeting
        ? {
            id: historyItem.meeting.id,
            title: historyItem.meeting.title,
            startTime: historyItem.meeting.startTime.toISOString(),
          }
        : null,
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

    console.error('Create candidate history error:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to create candidate history',
    });
  }
});

export default router;
