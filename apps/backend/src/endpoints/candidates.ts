import { Router } from 'express';
import type { Request, Response } from 'express';
import { z } from 'zod';
import {
  createCandidateSchema,
  updateCandidateSchema,
  validateData,
} from '../utilities/validation';
import {
  createCandidate,
  findCandidates,
  findCandidateById,
  updateCandidate,
  deleteCandidate,
  findCandidateByEmail,
} from '../collections/candidates';
import { authMiddleware } from '../utilities/middleware';
import type { CandidateResponse } from '../utilities/types';

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// GET /api/candidates
router.get('/', async (req: Request, res: Response) => {
  try {
    const candidates = await findCandidates();

    const response: CandidateResponse[] = candidates.map((candidate) => ({
      id: candidate.id,
      name: candidate.name,
      email: candidate.email,
      appliedPositionId: candidate.appliedPositionId,
      status: candidate.status,
      interviewNotes: candidate.interviewNotes,
      createdAt: candidate.createdAt.toISOString(),
      updatedAt: candidate.updatedAt.toISOString(),
      appliedPosition: candidate.appliedPosition,
    }));

    res.status(200).json(response);
  } catch (error) {
    console.error('Get candidates error:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to fetch candidates',
    });
  }
});

// POST /api/candidates
router.post('/', async (req: Request, res: Response) => {
  try {
    const data = validateData(createCandidateSchema, req.body);

    // Check if candidate with email already exists
    const existingCandidate = await findCandidateByEmail(data.email);
    if (existingCandidate) {
      res.status(400).json({
        error: 'BadRequest',
        message: 'Candidate with this email already exists',
      });
      return;
    }

    const candidate = await createCandidate(data);

    const response: CandidateResponse = {
      id: candidate.id,
      name: candidate.name,
      email: candidate.email,
      appliedPositionId: candidate.appliedPositionId,
      status: candidate.status,
      interviewNotes: candidate.interviewNotes,
      createdAt: candidate.createdAt.toISOString(),
      updatedAt: candidate.updatedAt.toISOString(),
      appliedPosition: candidate.appliedPosition,
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

    console.error('Create candidate error:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to create candidate',
    });
  }
});

// GET /api/candidates/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      res.status(400).json({
        error: 'BadRequest',
        message: 'Invalid candidate ID',
      });
      return;
    }

    const candidate = await findCandidateById(id);

    if (!candidate) {
      res.status(404).json({
        error: 'NotFound',
        message: 'Candidate not found',
      });
      return;
    }

    const response: CandidateResponse = {
      id: candidate.id,
      name: candidate.name,
      email: candidate.email,
      appliedPositionId: candidate.appliedPositionId,
      status: candidate.status,
      interviewNotes: candidate.interviewNotes,
      createdAt: candidate.createdAt.toISOString(),
      updatedAt: candidate.updatedAt.toISOString(),
      appliedPosition: candidate.appliedPosition,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Get candidate error:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to fetch candidate',
    });
  }
});

// PUT /api/candidates/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      res.status(400).json({
        error: 'BadRequest',
        message: 'Invalid candidate ID',
      });
      return;
    }

    const data = validateData(updateCandidateSchema, req.body);

    const existingCandidate = await findCandidateById(id);
    if (!existingCandidate) {
      res.status(404).json({
        error: 'NotFound',
        message: 'Candidate not found',
      });
      return;
    }

    const candidate = await updateCandidate(id, data);

    const response: CandidateResponse = {
      id: candidate.id,
      name: candidate.name,
      email: candidate.email,
      appliedPositionId: candidate.appliedPositionId,
      status: candidate.status,
      interviewNotes: candidate.interviewNotes,
      createdAt: candidate.createdAt.toISOString(),
      updatedAt: candidate.updatedAt.toISOString(),
      appliedPosition: candidate.appliedPosition,
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

    console.error('Update candidate error:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to update candidate',
    });
  }
});

// DELETE /api/candidates/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      res.status(400).json({
        error: 'BadRequest',
        message: 'Invalid candidate ID',
      });
      return;
    }

    const existingCandidate = await findCandidateById(id);
    if (!existingCandidate) {
      res.status(404).json({
        error: 'NotFound',
        message: 'Candidate not found',
      });
      return;
    }

    await deleteCandidate(id);

    res.status(200).json({
      message: 'Candidate deleted successfully',
    });
  } catch (error) {
    console.error('Delete candidate error:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to delete candidate',
    });
  }
});

export default router;
