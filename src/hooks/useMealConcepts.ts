/**
 * React Query Hooks for Meal Concepts
 * 
 * Custom hooks that wrap API calls with React Query for:
 * - Automatic caching
 * - Loading states
 * - Error handling
 * - Optimistic updates
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, MealConceptRequest, MealConcept } from '../services/api';
import { toast } from 'sonner';

/**
 * Get meal concepts by status
 */
export function useMealConcepts(status: 'pending' | 'approved' | 'rejected' = 'pending') {
  return useQuery({
    queryKey: ['mealConcepts', status],
    queryFn: () => apiClient.getMealConcepts(status),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Get a single meal concept
 */
export function useMealConcept(conceptId: string) {
  return useQuery({
    queryKey: ['mealConcept', conceptId],
    queryFn: () => apiClient.getMealConcept(conceptId),
    enabled: !!conceptId,
  });
}

/**
 * Generate new meal concepts
 */
export function useGenerateMealConcepts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: MealConceptRequest) => 
      apiClient.generateMealConcepts(request),
    onSuccess: (data) => {
      toast.success(`Generated ${data.length} meal concepts!`);
      // Invalidate pending concepts to show new ones
      queryClient.invalidateQueries({ queryKey: ['mealConcepts', 'pending'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to generate concepts: ${error.message}`);
    },
  });
}

/**
 * Approve a meal concept
 */
export function useApproveMealConcept() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conceptId: string) => 
      apiClient.approveMealConcept(conceptId),
    onMutate: async (conceptId) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['mealConcepts'] });
      
      // Get current data
      const previousPending = queryClient.getQueryData<MealConcept[]>(['mealConcepts', 'pending']);
      
      // Optimistically update
      if (previousPending) {
        queryClient.setQueryData<MealConcept[]>(
          ['mealConcepts', 'pending'],
          previousPending.filter(c => c.id !== conceptId)
        );
      }
      
      return { previousPending };
    },
    onError: (error, conceptId, context) => {
      // Rollback on error
      if (context?.previousPending) {
        queryClient.setQueryData(['mealConcepts', 'pending'], context.previousPending);
      }
      toast.error(`Failed to approve: ${error.message}`);
    },
    onSuccess: () => {
      toast.success('Concept approved!');
      // Refresh all concept lists
      queryClient.invalidateQueries({ queryKey: ['mealConcepts'] });
    },
  });
}

/**
 * Reject a meal concept
 */
export function useRejectMealConcept() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conceptId: string) => 
      apiClient.rejectMealConcept(conceptId),
    onMutate: async (conceptId) => {
      await queryClient.cancelQueries({ queryKey: ['mealConcepts'] });
      
      const previousPending = queryClient.getQueryData<MealConcept[]>(['mealConcepts', 'pending']);
      
      if (previousPending) {
        queryClient.setQueryData<MealConcept[]>(
          ['mealConcepts', 'pending'],
          previousPending.filter(c => c.id !== conceptId)
        );
      }
      
      return { previousPending };
    },
    onError: (error, conceptId, context) => {
      if (context?.previousPending) {
        queryClient.setQueryData(['mealConcepts', 'pending'], context.previousPending);
      }
      toast.error(`Failed to reject: ${error.message}`);
    },
    onSuccess: () => {
      toast.success('Concept rejected');
      queryClient.invalidateQueries({ queryKey: ['mealConcepts'] });
    },
  });
}

/**
 * Delete a meal concept
 */
export function useDeleteMealConcept() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conceptId: string) => 
      apiClient.deleteMealConcept(conceptId),
    onSuccess: () => {
      toast.success('Concept deleted');
      queryClient.invalidateQueries({ queryKey: ['mealConcepts'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete: ${error.message}`);
    },
  });
}

/**
 * Batch approve/reject concepts
 */
export function useBatchApproveConcepts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (approvals: Array<{ concept_id: string; approved: boolean }>) =>
      apiClient.batchApproveConcepts(approvals),
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ['mealConcepts'] });
    },
    onError: (error: Error) => {
      toast.error(`Batch operation failed: ${error.message}`);
    },
  });
}
