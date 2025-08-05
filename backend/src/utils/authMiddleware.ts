import { fastify, FastifyRequest, FastifyReply, FastifyInstance, HookHandlerDoneFunction } from 'fastify';
import { hasPermission } from '../services/permissionService';
import { CustomError, handleRouteError } from './errorHandler';


export async function verifyToken(this: FastifyInstance, request: FastifyRequest, reply: FastifyReply) {
  try {
    const token = this.jwt.lookupToken(request);
    this.jwt.verify(token);
    const { userId } = this.jwt.decode(token) as any;
    // @ts-ignore
    request.userId = userId;
  } catch (err) {
    throw new CustomError("Invalid token", 401);
  }
}

export async function authenticate(this: FastifyInstance, request: FastifyRequest, reply: FastifyReply) {
  try {
    await verifyToken.apply(this, [request, reply]);
  } catch (err) {}
};

export async function requireLogin(this: FastifyInstance, request: FastifyRequest, reply: FastifyReply
) {
  await verifyToken.apply(this, [request, reply]);
}

export function requirePermission(...permissions: string[]) {
  return async function(this: FastifyInstance, request: FastifyRequest, reply: FastifyReply) {
    try {
      await verifyToken.apply(this, [request, reply]);
    } catch (err) {
      return handleRouteError(err, reply, 'requirePermission');
    }

    // @ts-ignore
    const promises = permissions.map(perm => hasPermission(request.userId, perm));
    const results = await Promise.all(promises);
    const hasAllPermissions = results.every((result) => result);
    if (!hasAllPermissions) {
      return handleRouteError(new CustomError("Permission denied", 403), reply);
    }
  };
};
