import { Request, Response, NextFunction } from 'express';
import * as tasksService from './tasks.service';

export async function createTask(req: Request, res: Response, next: NextFunction) {
  try {
    const task = await tasksService.createTaskService(
      req.user.orgId,
      req.params.projectId,
      req.body
    );
    res.status(201).json({ message: 'Task created', data: task });
  } catch (err) { next(err); }
}

export async function listTasks(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await tasksService.listTasksService(
      req.user.orgId,
      req.params.projectId,
      req.query as any,
      req.user.id,
      req.user.role
    );
    res.json(result);
  } catch (err) { next(err); }
}

export async function getTask(req: Request, res: Response, next: NextFunction) {
  try {
    const task = await tasksService.getTaskService(
      req.user.orgId,
      req.params.projectId,
      req.params.taskId
    );
    res.json({ data: task });
  } catch (err) { next(err); }
}

export async function updateTask(req: Request, res: Response, next: NextFunction) {
  try {
    const task = await tasksService.updateTaskService(
      req.user.orgId,
      req.params.projectId,
      req.params.taskId,
      req.body,
      req.user.id,
      req.user.role
    );
    res.json({ message: 'Task updated', data: task });
  } catch (err) { next(err); }
}

export async function updateTaskStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const task = await tasksService.updateTaskStatusService(
      req.user.orgId,
      req.params.projectId,
      req.params.taskId,
      req.body,
      req.user.id,
      req.user.role
    );
    res.json({ message: 'Task status updated', data: task });
  } catch (err) { next(err); }
}

export async function deleteTask(req: Request, res: Response, next: NextFunction) {
  try {
    await tasksService.deleteTaskService(
      req.user.orgId,
      req.params.projectId,
      req.params.taskId
    );
    res.status(204).send();
  } catch (err) { next(err); }
}
