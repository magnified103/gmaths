import { z } from 'zod';
import { listResponseSchema } from './common';

export const permissionSchema = z.object({
  code: z.string(),
  description: z.string().nullable(),
});

export type Permission = z.infer<typeof permissionSchema>;

export const allPermissionsResponseSchema = listResponseSchema(permissionSchema);
