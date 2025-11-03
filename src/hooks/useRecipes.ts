/**
 * React Query Hooks for Recipes & Shopping (Phase 2)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, Recipe, RecipeDetailResponse, ShoppingListData } from '../services/api';
import { toast } from 'sonner';

/**
 * Generate detailed recipes from approved concepts
 */
export function useGenerateDetailedRecipes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: {
      concept_ids: string[];
      budget_cap?: number;
      reduce_by_pantry?: boolean;
    }) => apiClient.generateDetailedRecipes(request),
    onSuccess: (data) => {
      toast.success(`Generated ${data.recipes.length} detailed recipes!`);
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      queryClient.invalidateQueries({ queryKey: ['shopping'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to generate recipes: ${error.message}`);
    },
  });
}

/**
 * Get all recipes
 */
export function useRecipes() {
  return useQuery({
    queryKey: ['recipes'],
    queryFn: () => apiClient.getRecipes(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Get a single recipe
 */
export function useRecipe(recipeId: string) {
  return useQuery({
    queryKey: ['recipe', recipeId],
    queryFn: () => apiClient.getRecipe(recipeId),
    enabled: !!recipeId,
  });
}

/**
 * Delete a recipe
 */
export function useDeleteRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (recipeId: string) => apiClient.deleteRecipe(recipeId),
    onSuccess: () => {
      toast.success('Recipe deleted');
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete: ${error.message}`);
    },
  });
}

/**
 * Get current shopping list
 */
export function useCurrentShoppingList() {
  return useQuery({
    queryKey: ['shopping', 'current'],
    queryFn: () => apiClient.getCurrentShoppingList(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Update shopping item (mark purchased)
 */
export function useUpdateShoppingItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      listId,
      itemId,
      purchased,
    }: {
      listId: string;
      itemId: string;
      purchased: boolean;
    }) => apiClient.updateShoppingItem(listId, itemId, purchased),
    onMutate: async ({ itemId, purchased }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['shopping'] });

      const previousData = queryClient.getQueryData<ShoppingListData>(['shopping', 'current']);

      if (previousData) {
        queryClient.setQueryData<ShoppingListData>(['shopping', 'current'], {
          ...previousData,
          items: previousData.items.map((item) =>
            item.id === itemId ? { ...item, purchased } : item
          ),
        });
      }

      return { previousData };
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(['shopping', 'current'], context.previousData);
      }
      toast.error(`Failed to update item: ${error.message}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping'] });
    },
  });
}
