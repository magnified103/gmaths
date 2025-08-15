import { api } from './config';

export interface Role {
  name: string;
  slug: string;
  description?: string;
  permissions: string[];
}

export async function fetchRoles(): Promise<Role[]> {
  const response = await api.get('/roles', {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('auth-token')}`,
    },
  });
  return response.data.items;
}
