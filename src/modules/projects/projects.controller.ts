import { Request, Response, NextFunction } from 'express';
import * as projectsService from './projects.service';

export async function createProject(req: Request, res: Response, next: NextFunction) {
  try {
    const project = await projectsService.createProjectService(req.user.orgId, req.body);
    res.status(201).json({ message: 'Project created', data: project });
  } catch (err) { next(err); }
}

export async function listProjects(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, limit } = req.query as { page: string; limit: string };
    const result = await projectsService.listProjectsService(req.user.orgId, Number(page), Number(limit));
    res.json(result);
  } catch (err) { next(err); }
}

export async function getProject(req: Request, res: Response, next: NextFunction) {
  try {
    const project = await projectsService.getProjectService(req.user.orgId, req.params.id);
    res.json({ data: project });
  } catch (err) { next(err); }
}

export async function updateProject(req: Request, res: Response, next: NextFunction) {
  try {
    const project = await projectsService.updateProjectService(req.user.orgId, req.params.id, req.body);
    res.json({ message: 'Project updated', data: project });
  } catch (err) { next(err); }
}

export async function deleteProject(req: Request, res: Response, next: NextFunction) {
  try {
    await projectsService.deleteProjectService(req.user.orgId, req.params.id);
    res.status(204).send();
  } catch (err) { next(err); }
}
