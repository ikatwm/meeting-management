import { Router } from 'express';
import type { Request, Response } from 'express';
import { findAllPositions, findAllAppliedPositions } from '../collections/positions';
import { authMiddleware } from '../utilities/middleware';
import type { PositionResponse } from '../utilities/types';

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// GET /api/positions
router.get('/', async (req: Request, res: Response) => {
  try {
    const positions = await findAllPositions();

    const response: PositionResponse[] = positions.map((position) => ({
      id: position.id,
      name: position.name,
    }));

    res.status(200).json(response);
  } catch (error) {
    console.error('Get positions error:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to fetch positions',
    });
  }
});

// GET /api/applied-positions
router.get('/applied', async (req: Request, res: Response) => {
  try {
    const positions = await findAllAppliedPositions();

    const response: PositionResponse[] = positions.map((position) => ({
      id: position.id,
      name: position.name,
    }));

    res.status(200).json(response);
  } catch (error) {
    console.error('Get applied positions error:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to fetch applied positions',
    });
  }
});

export default router;
