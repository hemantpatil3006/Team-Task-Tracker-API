import { Request, Response, NextFunction } from 'express';
import * as usersService from './users.service';

export async function listUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, limit } = req.query as { page: string; limit: string };
    const result = await usersService.listUsersService(
      req.user.orgId,
      Number(page),
      Number(limit)
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function updateRole(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await usersService.updateUserRoleService(
      req.user.orgId,
      req.params.id,
      req.user.id,
      req.body.role
    );
    res.json({ message: 'Role updated', data: user });
  } catch (err) {
    next(err);
  }
}

export async function deleteUser(req: Request, res: Response, next: NextFunction) {
  try {
    await usersService.deleteUserService(
      req.user.orgId,
      req.params.id,
      req.user.id
    );
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
