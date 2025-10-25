import { Router } from 'express';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { registerSchema, loginSchema, validateData } from '../utilities/validation';
import { createUser, findUserByEmail, updateUserLastLogin } from '../collections/users';
import { comparePassword } from '../utilities/auth';
import { generateToken } from '../utilities/jwt';
import type { AuthResponse } from '../utilities/types';

const router = Router();

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const data = validateData(registerSchema, req.body);

    // Check if user already exists
    const existingUser = await findUserByEmail(data.email);
    if (existingUser) {
      res.status(400).json({
        error: 'BadRequest',
        message: 'User with this email already exists',
      });
      return;
    }

    const user = await createUser(data);

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const response: AuthResponse = {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        positionId: user.positionId,
      },
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

    console.error('Registration error:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to register user',
    });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const data = validateData(loginSchema, req.body);

    const user = await findUserByEmail(data.email);
    if (!user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password',
      });
      return;
    }

    const isPasswordValid = await comparePassword(data.password, user.passwordHash);
    if (!isPasswordValid) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password',
      });
      return;
    }

    // Update last login
    await updateUserLastLogin(user.id);

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const response: AuthResponse = {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        positionId: user.positionId,
      },
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

    console.error('Login error:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to login',
    });
  }
});

// POST /api/auth/logout
router.post('/logout', (req: Request, res: Response) => {
  // With JWT, logout is handled on the client side by removing the token
  // This endpoint exists for consistency and future expansion (e.g., token blacklisting)
  res.status(200).json({
    message: 'Logged out successfully',
  });
});

export default router;
