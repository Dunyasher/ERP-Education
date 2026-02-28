import { useQuery } from '@tanstack/react-query';
import api from '../utils/api';

/**
 * Custom hook to fetch institute types from the API
 * This ensures all components use the same dynamic data
 */
export const useInstituteTypes = (options = {}) => {
  const { includeInactive = false, ...queryOptions } = options;

  return useQuery({
    queryKey: ['instituteTypes', includeInactive],
    queryFn: async () => {
      try {
        const response = await api.get(`/institute-types?includeInactive=${includeInactive}`);
        return Array.isArray(response.data) ? response.data : [];
      } catch (error) {
        console.error('Error fetching institute types:', error);
        return [];
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    ...queryOptions
  });
};

/**
 * Get active institute types only (for dropdowns)
 */
export const useActiveInstituteTypes = (options = {}) => {
  return useInstituteTypes({ includeInactive: false, ...options });
};

