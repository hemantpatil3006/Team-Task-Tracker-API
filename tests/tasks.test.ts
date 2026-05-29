import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/database';

/**
 * Integration Test: Task Status Transition Flow
 *
 * Tests:
 * 1. ADMIN can create tasks and advance status
 * 2. Enforced state machine rejects invalid transitions
 * 3. MEMBER can only advance status on their own tasks
 * 4. MEMBER is blocked from advancing other's tasks
 * 5. Full transition chain: TODO → IN_PROGRESS → IN_REVIEW → DONE
 */
describe('Task Status Transitions', () => {
  let adminToken: string;
  let memberToken: string;
  let projectId: string;
  let taskId: string;
  let orgId: string;

  const adminEmail = `admin-task-test-${Date.now()}@example.com`;
  const memberEmail = `member-task-test-${Date.now()}@example.com`;

  beforeAll(async () => {
    // Register admin
    const adminReg = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Admin User',
        email: adminEmail,
        password: 'Admin1234!',
        organizationName: `Task Test Org ${Date.now()}`,
      });

    adminToken = adminReg.body.data.tokens.accessToken;
    orgId = adminReg.body.data.user.organizationId;

    // Create member in the same org (admin creates them)
    const memberCreate = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Member User',
        email: memberEmail,
        password: 'Member1234!',
        organizationName: `Member Org ${Date.now()}`,
      });

    // Override member's org to match admin's org (via DB — simulating invite flow)
    await prisma.user.update({
      where: { email: memberEmail },
      data: { organizationId: orgId, role: 'MEMBER' },
    });

    // Login member
    const memberLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: memberEmail, password: 'Member1234!' });

    memberToken = memberLogin.body.data.tokens.accessToken;

    // Create project
    const projectRes = await request(app)
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Test Project' });

    projectId = projectRes.body.data.id;
  });

  afterAll(async () => {
    await prisma.organization
      .findUnique({ where: { id: orgId } })
      .then((o) => o && prisma.organization.delete({ where: { id: o.id } }))
      .catch(() => {});
  });

  it('ADMIN should create a task assigned to member', async () => {
    const memberUser = await prisma.user.findUnique({ where: { email: memberEmail } });

    const res = await request(app)
      .post(`/api/v1/projects/${projectId}/tasks`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Test Task for Transitions',
        priority: 'HIGH',
        assigneeId: memberUser!.id,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('TODO');
    taskId = res.body.data.id;
  });

  it('Should reject invalid transition: TODO → IN_REVIEW', async () => {
    const res = await request(app)
      .patch(`/api/v1/projects/${projectId}/tasks/${taskId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'IN_REVIEW' });

    expect(res.status).toBe(422);
    expect(res.body.code).toBe('INVALID_TRANSITION');
    expect(res.body.message).toContain('TODO');
    expect(res.body.message).toContain('IN_REVIEW');
  });

  it('Should reject invalid transition: TODO → DONE', async () => {
    const res = await request(app)
      .patch(`/api/v1/projects/${projectId}/tasks/${taskId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'DONE' });

    expect(res.status).toBe(422);
    expect(res.body.code).toBe('INVALID_TRANSITION');
  });

  it('MEMBER should be blocked from updating a task NOT assigned to them', async () => {
    // Create another task NOT assigned to the member
    const otherTask = await request(app)
      .post(`/api/v1/projects/${projectId}/tasks`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Task for someone else', priority: 'LOW' });

    const otherTaskId = otherTask.body.data.id;

    const res = await request(app)
      .patch(`/api/v1/projects/${projectId}/tasks/${otherTaskId}/status`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ status: 'IN_PROGRESS' });

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN');
  });

  it('MEMBER (assignee) should advance task: TODO → IN_PROGRESS', async () => {
    const res = await request(app)
      .patch(`/api/v1/projects/${projectId}/tasks/${taskId}/status`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ status: 'IN_PROGRESS' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('IN_PROGRESS');
  });

  it('Should advance task: IN_PROGRESS → IN_REVIEW', async () => {
    const res = await request(app)
      .patch(`/api/v1/projects/${projectId}/tasks/${taskId}/status`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ status: 'IN_REVIEW' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('IN_REVIEW');
  });

  it('Should advance task: IN_REVIEW → DONE and set completedAt', async () => {
    const res = await request(app)
      .patch(`/api/v1/projects/${projectId}/tasks/${taskId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'DONE' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('DONE');
    expect(res.body.data.completedAt).not.toBeNull();
  });

  it('Should reject any transition from DONE (terminal state)', async () => {
    const res = await request(app)
      .patch(`/api/v1/projects/${projectId}/tasks/${taskId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'IN_PROGRESS' });

    expect(res.status).toBe(422);
    expect(res.body.code).toBe('INVALID_TRANSITION');
  });

  it('MEMBER should be blocked from creating tasks', async () => {
    const res = await request(app)
      .post(`/api/v1/projects/${projectId}/tasks`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ title: 'Sneaky task' });

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN');
  });
});
