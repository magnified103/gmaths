import { api } from './config';

export interface Role {
  slug: string;
  name: string;
  description?: string;
  permissions: string[];
}

export interface CreateRoleData {
  slug: string;
  name: string;
  description?: string | null;
  permissions?: string[];
}

export interface UpdateRoleData {
  name?: string;
  description?: string | null;
  permissions?: string[];
}

export async function fetchRoles(): Promise<Role[]> {
  const response = await api.get('/roles', {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('auth-token')}`,
    },
  });
  return response.data.items;
}

export async function fetchRoleBySlug(slug: string): Promise<Role> {
  const response = await api.get(`/roles/${slug}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('auth-token')}`,
    },
  });
  return response.data;
}

export async function createRole(data: CreateRoleData): Promise<Role> {
  const response = await api.post('/roles', data, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('auth-token')}`,
    },
  });
  return response.data;
}

export async function updateRole(slug: string, data: UpdateRoleData): Promise<Role> {
  const response = await api.put(`/roles/${slug}`, data, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('auth-token')}`,
    },
  });
  return response.data;
}

export async function deleteRole(slug: string): Promise<void> {
  await api.delete(`/roles/${slug}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('auth-token')}`,
    },
  });
}

export async function fetchAllPermissions(): Promise<string[]> {
  const response = await api.get('/permissions', {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('auth-token')}`,
    },
  });
  return response.data.items.map((p: { code: string }) => p.code);
}
