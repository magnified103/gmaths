/**
 * JSON Schema for user login request body.
 */
export const loginJsonSchema = {
  $id: 'Login',
  type: 'object',
  properties: {
    email: { type: 'string', format: 'email', description: 'User email address' },
    password: { type: 'string', description: 'User password' }
  },
  required: ['email', 'password']
};
