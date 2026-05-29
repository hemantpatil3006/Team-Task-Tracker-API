# Team Task Tracker API

A production-quality REST API for team-based task management with **JWT authentication**, **role-based access control**, **Redis caching**, and full **Docker** containerization.

---

## Quick Start

```bash
# Clone the repo
git clone <your-repo-url>
cd team-task-tracker

# Start everything (API + PostgreSQL + Redis)
docker compose up
```

That's it. The API will be available at **http://localhost:3000**

- **Swagger UI**: http://localhost:3000/api/docs
- **Health check**: http://localhost:3000/health

> **Note**: On first run, Docker will build the image, run database migrations, and seed demo data automatically. This takes ~60 seconds.

---

## Demo Credentials (pre-seeded)

| Role    | Email                | Password      |
|---------|----------------------|---------------|
| ADMIN   | admin@demo.com       | Admin1234!    |
| MANAGER | manager@demo.com     | Manager1234!  |
| MEMBER  | member@demo.com      | Member1234!   |

**To get a token:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@demo.com", "password": "Admin1234!"}'
```

---

## Architecture

### Tech Stack

| Layer       | Technology                              |
|-------------|-----------------------------------------|
| Runtime     | Node.js 20 (LTS)                        |
| Framework   | Express.js                              |
| Language    | TypeScript                              |
| Database    | PostgreSQL 16 via Prisma ORM            |
| Cache       | Redis 7                                 |
| Auth        | JWT (jsonwebtoken)                      |
| Validation  | Zod                                     |
| API Docs    | Swagger UI (swagger-jsdoc)              |
| Tests       | Vitest + Supertest                      |
| Container   | Docker + docker-compose                 |

### Project Structure

```
src/
├── config/           # App config, DB client, Redis client, Swagger
├── middleware/        # authenticate, authorize (RBAC), validate, errorHandler
├── modules/
│   ├── auth/         # register, login, refresh, logout, me
│   ├── users/        # user management (ADMIN only)
│   ├── projects/     # project CRUD
│   ├── tasks/        # task CRUD + status transitions
│   └── analytics/    # overdue counts, avg completion time
├── lib/              # JWT helpers, error classes, cache helpers, state machine
└── app.ts / server.ts
```

---

## API Endpoints

### Auth
| Method | Endpoint              | Access       | Description                         |
|--------|-----------------------|--------------|-------------------------------------|
| POST   | `/api/v1/auth/register` | Public     | Register user + create organization |
| POST   | `/api/v1/auth/login`    | Public     | Login → access + refresh token      |
| POST   | `/api/v1/auth/refresh`  | Public     | Rotate refresh token                |
| POST   | `/api/v1/auth/logout`   | Auth       | Revoke refresh token                |
| GET    | `/api/v1/auth/me`       | Auth       | Get current user                    |

### Users (ADMIN only)
| Method | Endpoint               | Description           |
|--------|------------------------|-----------------------|
| GET    | `/api/v1/users`        | List org users        |
| PATCH  | `/api/v1/users/:id/role` | Change user role    |
| DELETE | `/api/v1/users/:id`    | Remove user from org  |

### Projects
| Method | Endpoint               | Access         | Description        |
|--------|------------------------|----------------|--------------------|
| POST   | `/api/v1/projects`     | ADMIN, MANAGER | Create project     |
| GET    | `/api/v1/projects`     | All            | List org projects  |
| GET    | `/api/v1/projects/:id` | All            | Get project        |
| PATCH  | `/api/v1/projects/:id` | ADMIN, MANAGER | Update project     |
| DELETE | `/api/v1/projects/:id` | ADMIN          | Delete project     |

### Tasks
| Method | Endpoint                                         | Access               | Description             |
|--------|--------------------------------------------------|----------------------|-------------------------|
| POST   | `/api/v1/projects/:pid/tasks`                    | ADMIN, MANAGER       | Create task             |
| GET    | `/api/v1/projects/:pid/tasks`                    | All*                 | List tasks (paginated)  |
| GET    | `/api/v1/projects/:pid/tasks/:id`                | All                  | Get task                |
| PATCH  | `/api/v1/projects/:pid/tasks/:id`                | All**                | Update task fields      |
| PATCH  | `/api/v1/projects/:pid/tasks/:id/status`         | Assignee, MANAGER+   | Advance task status     |
| DELETE | `/api/v1/projects/:pid/tasks/:id`                | ADMIN, MANAGER       | Delete task             |

> *MEMBER only sees their own tasks (auto-filtered)  
> **MEMBER can only update tasks assigned to them

### Analytics (ADMIN, MANAGER)
| Method | Endpoint                      | Description                        |
|--------|-------------------------------|------------------------------------|
| GET    | `/api/v1/analytics/overdue`   | Overdue task count per user        |
| GET    | `/api/v1/analytics/completion` | Avg completion time per user (hrs)|

### Query Parameters for Task List
| Param      | Type   | Description                                    |
|------------|--------|------------------------------------------------|
| `page`     | int    | Page number (default: 1)                       |
| `limit`    | int    | Items per page (default: 20, max: 100)         |
| `status`   | enum   | Filter by: TODO, IN_PROGRESS, IN_REVIEW, DONE, BLOCKED |
| `priority` | enum   | Filter by: LOW, MEDIUM, HIGH                   |
| `assigneeId` | cuid | Filter by assignee (ADMIN/MANAGER only)       |

---

## RBAC Design

RBAC is enforced **at the middleware layer**, not inside controller logic.

```
Request → authenticate → authorize(roles) → controller
```

Every route's permission chain is declared in the router:

```typescript
// tasks.routes.ts — the permission chain is immediately readable
router.post('/',
  authorize('ADMIN', 'MANAGER'),   // ← RBAC middleware, not in controller
  validate(createTaskSchema),
  tasksController.createTask
);

router.patch('/:taskId/status',
  validate(updateTaskStatusSchema),
  tasksController.updateTaskStatus  // ownership check done in service layer
);
```

### Role Permissions

| Action                       | ADMIN | MANAGER | MEMBER |
|------------------------------|-------|---------|--------|
| Manage users (role, delete)  | ✅    | ❌      | ❌     |
| Create/update/delete projects| ✅    | ✅      | ❌     |
| Create/delete tasks          | ✅    | ✅      | ❌     |
| Update any task's fields     | ✅    | ✅      | ❌     |
| Update their own task        | ✅    | ✅      | ✅     |
| Advance any task's status    | ✅    | ✅      | ❌     |
| Advance their assigned task  | ✅    | ✅      | ✅     |
| View all tasks in project    | ✅    | ✅      | ❌     |
| View own assigned tasks      | ✅    | ✅      | ✅     |
| Access analytics             | ✅    | ✅      | ❌     |

---

## Status Transition State Machine

Transitions are enforced server-side via a constant map in `src/lib/taskStateMachine.ts`.

```
TODO ────────────────► IN_PROGRESS ──► IN_REVIEW ──► DONE
  │                        │               │
  └────────────────────────┴───────────────┴──► BLOCKED
                                               │
                                      ◄────────┘ (→ TODO or IN_PROGRESS)
```

```typescript
const ALLOWED_TRANSITIONS = {
  TODO:        ['IN_PROGRESS', 'BLOCKED'],
  IN_PROGRESS: ['IN_REVIEW',   'BLOCKED'],
  IN_REVIEW:   ['DONE',        'BLOCKED'],
  DONE:        [],                            // terminal state
  BLOCKED:     ['TODO', 'IN_PROGRESS'],       // reactivation
};
```

Invalid transitions return:
```json
{
  "status": 422,
  "code": "INVALID_TRANSITION",
  "message": "Cannot transition task from TODO to IN_REVIEW"
}
```

---

## Caching Strategy

### What is cached
Task list responses filtered by assignee are cached in Redis.

### Cache Key Format
```
tasks:assignee:{assigneeId}:page:{page}:limit:{limit}:status:{status}:priority:{priority}
```

### TTL
**5 minutes** — balances freshness vs. database load. Task lists don't change
at extremely high frequency, so a short TTL provides good performance without
stale data for long.

### Invalidation Strategy
**Write-through invalidation**: the cache is invalidated immediately whenever a
write occurs that affects a user's task list.

| Write Operation       | Cache Keys Invalidated                                    |
|-----------------------|-----------------------------------------------------------|
| Task created          | All keys for the new `assigneeId`                         |
| Task assignee changed | All keys for both the old and new `assigneeId`            |
| Task status changed   | All keys for the task's `assigneeId`                      |
| Task priority changed | All keys for the task's `assigneeId`                      |
| Task deleted          | All keys for the task's `assigneeId`                      |

**Mechanism**: Uses Redis `SCAN` + `DEL` on the prefix pattern
`tasks:assignee:{id}:*` in batches of 100 keys. This avoids:
- `KEYS` command (blocks Redis)
- Full cache flushes (evicts unrelated data)

```typescript
// cache.ts — pattern-based invalidation
let cursor = '0';
do {
  const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
  if (keys.length > 0) await redis.del(...keys);
  cursor = nextCursor;
} while (cursor !== '0');
```

### Cache Failure Resilience
All cache operations are wrapped in `try/catch`. A Redis failure **never** breaks
the API — the request falls through to the database transparently.

---

## Database Design Decisions

### 1. Organization-scoped data isolation
Every query includes `organizationId` in the `WHERE` clause, enforced at the
service layer. This prevents cross-organization data leakage even if a token is
somehow shared.

### 2. Composite index on `(status, assignee_id)`
```sql
CREATE INDEX "tasks_status_assignee_id_idx" ON "tasks"("status", "assignee_id");
```
The most common query pattern in this API is listing tasks by assignee with an
optional status filter. A composite index on `(status, assignee_id)` serves
both filtered and unfiltered queries for a specific assignee efficiently
(Postgres can use the index for assignee-only lookups too, since `assignee_id`
is the second column and we use equality on `status`). Without this, every list
query would perform a full table scan filtered by `assignee_id`.

### 3. Soft-delete via `assignee_id SET NULL`
When a user is deleted, their tasks remain in the system with `assigneeId = null`
rather than cascading deletion. This preserves project history and prevents
accidental data loss when an employee leaves the organization.

### 4. `completedAt` timestamp
Tasks store an explicit `completedAt` timestamp when transitioning to `DONE`
(set to `NULL` for other transitions). This enables the analytics endpoint to
compute `AVG(completedAt - createdAt)` using SQL window functions without
needing to join audit tables.

### 5. CUID over UUID for primary keys
CUIDs are used for all primary keys. They are collision-resistant, URL-safe,
and have better lexicographic ordering than UUIDs (better B-tree index
performance for sequential inserts).

---

## Authentication

- **Access token**: 15-minute expiry, signed with `ACCESS_TOKEN_SECRET`
- **Refresh token**: 7-day expiry, stored in the `refresh_tokens` table
- **Rotation**: On every `/auth/refresh` call, the old token is revoked and a
  new pair is issued. Replaying a used refresh token returns 401.
- **Logout**: Sets `revoked = true` on the token in DB. The access token
  remains valid until expiry (stateless), but the refresh token cannot be used.

---

## Error Response Format

All errors follow a consistent format:

```json
{
  "status": 400,
  "code": "VALIDATION_ERROR",
  "message": "due_date must be a future date"
}
```

| Code | Status | Meaning |
|------|--------|---------|
| `VALIDATION_ERROR` | 400 | Zod input validation failure |
| `UNAUTHORIZED` | 401 | Missing/invalid/expired token |
| `FORBIDDEN` | 403 | Insufficient role |
| `NOT_FOUND` | 404 | Resource doesn't exist |
| `CONFLICT` | 409 | Duplicate email/slug |
| `INVALID_TRANSITION` | 422 | Invalid task status transition |
| `TOO_MANY_REQUESTS` | 429 | Rate limit exceeded |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

---

## Local Development (without Docker)

```bash
# Prerequisites: Node.js 20+, PostgreSQL, Redis

# Install dependencies
npm install

# Copy env and configure
cp .env.example .env
# Edit DATABASE_URL and REDIS_URL in .env

# Run migrations and seed
npx prisma migrate deploy
npm run db:seed

# Start dev server with hot reload
npm run dev
```

---

## Running Tests

Tests require a running PostgreSQL instance (uses the same DB as development).

```bash
# Start just the DB services
docker compose up postgres redis -d

# Run tests
npm test
```

Tests cover:
- **Auth flow**: register, login, refresh token rotation, logout, revoked token rejection
- **Task transitions**: full state machine validation, RBAC enforcement on status updates

---

## What I Would Improve Given More Time

1. **WebSocket / SSE notifications** — Real-time status change events using
   `socket.io` or Server-Sent Events. The architecture is event-ready (status
   changes go through a single service function) — adding an event emitter
   there would be clean.

2. **Invite-based org membership** — Currently, registration always creates
   a new org. A time-limited invite token system (emails with HMAC-signed
   tokens) would allow teammates to join existing orgs.

3. **Audit log** — A `task_history` table recording every status transition
   with `(taskId, fromStatus, toStatus, changedBy, changedAt)`. Useful for
   accountability and richer analytics.

4. **Refresh token families** — Detecting refresh token reuse (a used token
   being replayed) and invalidating the entire token family to detect
   token theft.

5. **Pagination cursor-based** — Replace offset pagination with cursor-based
   for better performance on large datasets (offset pagination gets slower as
   page number grows).

6. **Frontend** — A Next.js kanban board showing task cards by status column
   with drag-and-drop to trigger status transitions.

7. **CI/CD** — GitHub Actions workflow for lint + test on PR, build + push
   Docker image to GHCR on merge to main.
