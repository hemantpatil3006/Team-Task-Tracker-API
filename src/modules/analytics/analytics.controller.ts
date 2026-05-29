import { Request, Response, NextFunction } from 'express';
import * as analyticsService from './analytics.service';

export async function getOverdueTasks(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await analyticsService.getOverdueTasksService(req.user.orgId);
    res.json({ data });
  } catch (err) { next(err); }
}

export async function getAvgCompletionTime(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await analyticsService.getAvgCompletionTimeService(req.user.orgId);
    res.json({ data });
  } catch (err) { next(err); }
}
