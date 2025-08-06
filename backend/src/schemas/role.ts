/**
 * JSON Schema for the Role object.
 * This schema is registered globally with Fastify using fastify.addSchema()
 * and can be referenced using $ref in other schemas.
 */
export const roleSchema = {
  $id: 'Role', // Unique ID for referencing
  type: 'object',
  properties: {
    slug: { type: 'string', description: 'Unique slug for the role (e.g., "admin", "student")' },
    name: { type: 'string', description: 'Display name of the role' },
    description: { type: 'string', nullable: true, description: 'Description of the role' }
  },
  required: ['slug', 'name']
};
