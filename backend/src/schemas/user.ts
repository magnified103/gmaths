/**
 * JSON Schema for the User object.
 * This schema is registered globally with Fastify using fastify.addSchema()
 * and can be referenced using $ref in route schemas.
 */
export const userSchema = {
  $id: 'User', // Unique ID for referencing
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid', description: 'Unique identifier of the user' },
    username: { type: 'string', description: 'User\'s unique username' },
    email: { type: 'string', format: 'email', description: 'User\'s email address' },
    emailVerified: { type: 'boolean', description: 'Whether the user\'s email has been verified' },
    roles: {
      type: 'array',
      items: { $ref: 'Role' }, // Reference the Role schema
      description: 'The roles assigned to the user.'
    },
    createdAt: { type: 'string', format: 'date-time', description: 'Timestamp when the user was created' },
    updatedAt: { type: 'string', format: 'date-time', description: 'Timestamp when the user was last updated' },
    lastLoginAt: { type: 'string', format: 'date-time', nullable: true, description: 'Timestamp of the user\'s last login' }
  },
  required: ['id', 'username', 'email', 'emailVerified', 'roles', 'createdAt', 'updatedAt']
};
