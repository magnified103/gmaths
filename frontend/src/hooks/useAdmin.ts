import { useQuery } from '@tanstack/react-query';
import { getAdminDashboardStats } from '../api/admin';

/**
 * Hook to get admin dashboard statistics
 */
export const useAdminDashboardStats = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['adminDashboardStats'],
    queryFn: getAdminDashboardStats,
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}; 