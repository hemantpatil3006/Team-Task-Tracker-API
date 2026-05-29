import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Team Task Tracker API',
      version: '1.0.0',
      description: `
REST API for a team-based task tracker with:
- JWT authentication (access + refresh token rotation)
- Role-based access control (ADMIN, MANAGER, MEMBER)
- Task management with enforced status transitions
- Redis caching per assignee
- Organization-scoped data isolation

## Status Transitions
\`\`\`
TODO → IN_PROGRESS → IN_REVIEW → DONE
Any active state → BLOCKED
BLOCKED → TODO | IN_PROGRESS
\`\`\`

## Seed Credentials
| Role    | Email                  | Password      |
|---------|------------------------|---------------|
| ADMIN   | admin@demo.com         | Admin1234!    |
| MANAGER | manager@demo.com       | Manager1234!  |
| MEMBER  | member@demo.com        | Member1234!   |
      `,
      contact: {
        name: 'API Support',
      },
    },
    servers: [
      {
        url: '/api/v1',
        description: 'Current server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    tags: [
      { name: 'Auth', description: 'Authentication and token management' },
      { name: 'Users', description: 'User management (ADMIN only)' },
      { name: 'Projects', description: 'Project management' },
      { name: 'Tasks', description: 'Task management with status transitions' },
      { name: 'Analytics', description: 'Reporting and analytics (ADMIN, MANAGER)' },
    ],
  },
  apis: ['./src/modules/**/*.routes.ts', './src/modules/**/*.routes.js'],
};

export const swaggerSpec = swaggerJsdoc(options);
