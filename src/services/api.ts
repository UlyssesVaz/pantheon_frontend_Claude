/**
 * API Client for Athyra Backend
 * 
 * Centralized client for all backend communication.
 * Handles authentication tokens and error handling.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface MealConceptRequest {
  vibe?: string;
  num_concepts?: number;
  must_include_categories?: string[];
  avoid_categories?: string[];
  prefer_quick_meals?: boolean;
}

export interface MealConcept {
  id: string;
  user_id: string;
  name: string;
  description: string;
  meal_yield: string;
  protein: string;
  carb: string | null;
  vegetables: string[];
  prep_time: number;
  cost_per_serving: string;
  calories_per_serving: number;
  protein_grams: number;
  carb_grams: number;
  fat_grams: number;
  complexity: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  recipe_id: string | null;
}

export interface Recipe {
  id: string;
  user_id: string;
  name: string;
  cook_time: number;
  servings: number;
  calories: number;
  ingredients: IngredientDetail[];
  main_ingredients: string[];
  instructions: string[];
  tags: string[];
  cuisine: string | null;
  prep_complexity: string;
  generation_method: string | null;
  created_at: string;
}

export interface IngredientDetail {
  name: string;
  quantity: number;
  unit: string;
  category: string | null;
  source: 'pantry' | 'shopping';
  estimated_cost: number;
}

export interface ShoppingListItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  purchased: boolean;
  category: string | null;
  estimated_price: number;
  from_recipes: string[];
  substituted_from: string | null;
  substitution_reason: string | null;
  pantry_deduction: number | null;
}

export interface ShoppingListData {
  id: string;
  total_cost: number;
  pantry_savings: number;
  items: ShoppingListItem[];
}

export interface RecipeDetailResponse {
  recipes: Recipe[];
  shopping_list: ShoppingListData;
  substitution_suggestions: SubstitutionSuggestion[];
  pantry_savings: number;
}

export interface SubstitutionSuggestion {
  item: string;
  reason: string;
  alternative: string;
  savings: string;
}

class ApiClient {
  private getAuthToken(): string | null {
    // This will be set by Auth0 in your app
    return localStorage.getItem('auth_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getAuthToken();
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add auth token if available
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ 
        detail: response.statusText 
      }));
      throw new Error(error.detail || `API Error: ${response.status}`);
    }

    return response.json();
  }

  // ==========================================
  // PHASE 1: MEAL CONCEPTS
  // ==========================================

  /**
   * Generate meal concepts using AI
   */
  async generateMealConcepts(request: MealConceptRequest): Promise<MealConcept[]> {
    return this.request<MealConcept[]>('/api/meal-concepts/generate', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Get meal concepts by status
   */
  async getMealConcepts(status: 'pending' | 'approved' | 'rejected' = 'pending'): Promise<MealConcept[]> {
    return this.request<MealConcept[]>(`/api/meal-concepts/?status_filter=${status}`);
  }

  /**
   * Get a single meal concept
   */
  async getMealConcept(conceptId: string): Promise<MealConcept> {
    return this.request<MealConcept>(`/api/meal-concepts/${conceptId}`);
  }

  /**
   * Approve a meal concept
   */
  async approveMealConcept(conceptId: string): Promise<MealConcept> {
    return this.request<MealConcept>(`/api/meal-concepts/${conceptId}/approve`, {
      method: 'PATCH',
    });
  }

  /**
   * Reject a meal concept
   */
  async rejectMealConcept(conceptId: string): Promise<MealConcept> {
    return this.request<MealConcept>(`/api/meal-concepts/${conceptId}/reject`, {
      method: 'PATCH',
    });
  }

  /**
   * Delete a meal concept
   */
  async deleteMealConcept(conceptId: string): Promise<{ message: string }> {
    return this.request(`/api/meal-concepts/${conceptId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Batch approve/reject concepts
   */
  async batchApproveConcepts(
    approvals: Array<{ concept_id: string; approved: boolean }>
  ): Promise<{ message: string; results: any[] }> {
    return this.request('/api/meal-concepts/batch-approve', {
      method: 'POST',
      body: JSON.stringify(approvals),
    });
  }

  // ==========================================
  // PHASE 2: DETAILED RECIPES & SHOPPING
  // ==========================================

  /**
   * Generate detailed recipes from approved concepts
   */
  async generateDetailedRecipes(request: {
    concept_ids: string[];
    budget_cap?: number;
    reduce_by_pantry?: boolean;
  }): Promise<RecipeDetailResponse> {
    return this.request<RecipeDetailResponse>('/api/recipes/generate-from-concepts', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Get all recipes
   */
  async getRecipes(): Promise<Recipe[]> {
    return this.request<Recipe[]>('/api/recipes');
  }

  /**
   * Get a single recipe
   */
  async getRecipe(recipeId: string): Promise<Recipe> {
    return this.request<Recipe>(`/api/recipes/${recipeId}`);
  }

  /**
   * Delete a recipe
   */
  async deleteRecipe(recipeId: string): Promise<{ message: string }> {
    return this.request(`/api/recipes/${recipeId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Get current shopping list
   */
  async getCurrentShoppingList(): Promise<ShoppingListData> {
    return this.request<ShoppingListData>('/api/shopping/current');
  }

  /**
   * Mark shopping item as purchased
   */
  async updateShoppingItem(
    listId: string,
    itemId: string,
    purchased: boolean
  ): Promise<{ message: string }> {
    return this.request(`/api/shopping/${listId}/items/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify({ item_id: itemId, purchased }),
    });
  }

  // ==========================================
  // PANTRY (Existing)
  // ==========================================

  async getPantryItems() {
    return this.request('/api/pantry');
  }

  async addPantryItem(item: any) {
    return this.request('/api/pantry', {
      method: 'POST',
      body: JSON.stringify(item),
    });
  }

  // ==========================================
  // USER PROFILE (Existing)
  // ==========================================

  async getProfile() {
    return this.request('/api/auth/profile');
  }

  async updateProfile(profile: any) {
    return this.request('/api/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(profile),
    });
  }

  // ==========================================
  // HELPER: Set Auth Token
  // ==========================================

  setAuthToken(token: string) {
    localStorage.setItem('auth_token', token);
  }

  clearAuthToken() {
    localStorage.removeItem('auth_token');
  }
}

export const apiClient = new ApiClient();
