import { Request, Response, NextFunction } from 'express';
import * as authService from './auth.service';

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.registerService(req.body);
    res.status(201).json({
      message: 'Registration successful',
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.loginService(req.body);
    res.status(200).json({
      message: 'Login successful',
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.refreshTokenService(req.body);
    res.status(200).json({
      message: 'Token refreshed',
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = req.body;
    await authService.logoutService(req.user.id, refreshToken || '');
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
}

export async function getMe(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await authService.getMeService(req.user.id);
    res.status(200).json({ data: user });
  } catch (err) {
    next(err);
  }
}
