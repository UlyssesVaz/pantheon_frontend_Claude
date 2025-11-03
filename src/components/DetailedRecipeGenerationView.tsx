/**
 * Detailed Recipe Generation View (Phase 2)
 * 
 * Workflow:
 * 1. Show approved concepts
 * 2. Set budget preferences
 * 3. Generate detailed recipes + shopping list
 * 4. Display recipes and shopping list
 */

import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Loader2, ChefHat, ShoppingCart, DollarSign, Check, AlertCircle } from 'lucide-react';
import { useMealConcepts } from '../hooks/useMealConcepts';
import { useGenerateDetailedRecipes } from '../hooks/useRecipes';
import { RecipeDetailResponse } from '../services/api';

export function DetailedRecipeGenerationView() {
  const [budgetCap, setBudgetCap] = useState<number | undefined>(undefined);
  const [reduceByPantry, setReduceByPantry] = useState(true);
  const [result, setResult] = useState<RecipeDetailResponse | null>(null);

  const { data: approvedConcepts, isLoading: loadingConcepts } = useMealConcepts('approved');
  const generateMutation = useGenerateDetailedRecipes();

  const handleGenerate = async () => {
    if (!approvedConcepts || approvedConcepts.length === 0) {
      return;
    }

    const conceptIds = approvedConcepts.map((c) => c.id);

    try {
      const data = await generateMutation.mutateAsync({
        concept_ids: conceptIds,
        budget_cap: budgetCap,
        reduce_by_pantry: reduceByPantry,
      });
      setResult(data);
    } catch (error) {
      console.error('Failed to generate recipes:', error);
    }
  };

  if (loadingConcepts) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!approvedConcepts || approvedConcepts.length === 0) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-8 text-center">
            <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">No Approved Concepts</h2>
            <p className="text-gray-600 mb-4">
              You need to approve some meal concepts first before generating detailed recipes.
            </p>
            <Button onClick={() => window.location.href = '#concepts'}>
              Go to Concepts
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Step 2: Generate Detailed Recipes</h1>
        <p className="text-gray-600 mt-2">
          Convert your approved concepts into detailed recipes with exact ingredients and shopping lists.
        </p>
      </div>

      {/* Approved Concepts Summary */}
      {!result && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Approved Concepts ({approvedConcepts.length})</CardTitle>
              <CardDescription>These will be converted into detailed recipes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {approvedConcepts.map((concept) => (
                <div key={concept.id} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="font-medium">{concept.name}</span>
                  <span className="text-gray-500">• {concept.meal_yield}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>Generation Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="budget">Budget Cap (optional)</Label>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-gray-500" />
                  <Input
                    id="budget"
                    type="number"
                    placeholder="No limit"
                    value={budgetCap || ''}
                    onChange={(e) => setBudgetCap(e.target.value ? parseFloat(e.target.value) : undefined)}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="reduce_pantry"
                  checked={reduceByPantry}
                  onChange={(e) => setReduceByPantry(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="reduce_pantry">Use pantry items to reduce shopping list</Label>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={generateMutation.isPending}
                className="w-full"
                size="lg"
              >
                {generateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating (this may take 15-20 seconds)...
                  </>
                ) : (
                  <>
                    <ChefHat className="mr-2 h-4 w-4" />
                    Generate Detailed Recipes & Shopping List
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </>
      )}

      {/* Results */}
      {result && (
        <>
          {/* Recipes */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Your Recipes ({result.recipes.length})</h2>
            <div className="space-y-4">
              {result.recipes.map((recipe) => (
                <Card key={recipe.id}>
                  <CardHeader>
                    <CardTitle>{recipe.name}</CardTitle>
                    <CardDescription>
                      {recipe.servings} servings • {recipe.cook_time} min • {recipe.calories} cal/serving
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Ingredients */}
                    <div>
                      <h4 className="font-semibold mb-2">Ingredients:</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {recipe.ingredients.map((ing, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <span className={ing.source === 'pantry' ? 'text-green-600' : ''}>
                              {ing.source === 'pantry' && '✓ '}
                              {ing.quantity} {ing.unit} {ing.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Instructions */}
                    <div>
                      <h4 className="font-semibold mb-2">Instructions:</h4>
                      <ol className="list-decimal list-inside space-y-1 text-sm">
                        {recipe.instructions.map((step, idx) => (
                          <li key={idx}>{step}</li>
                        ))}
                      </ol>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Shopping List */}
          <Card className="bg-blue-50">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Shopping List ({result.shopping_list.items.length} items)
                  </CardTitle>
                  <CardDescription>
                    Total: ${result.shopping_list.total_cost.toFixed(2)}
                    {result.pantry_savings > 0 && (
                      <span className="text-green-600 ml-2">
                        (Saved ${result.pantry_savings.toFixed(2)} using pantry)
                      </span>
                    )}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {result.shopping_list.items.map((item) => (
                <div key={item.id} className="flex justify-between items-center p-2 bg-white rounded">
                  <div className="flex-1">
                    <div className="font-medium">
                      {item.quantity} {item.unit} {item.name}
                      {item.substituted_from && (
                        <span className="text-xs text-blue-600 ml-2">
                          (substituted from {item.substituted_from})
                        </span>
                      )}
                    </div>
                    {item.pantry_deduction && (
                      <div className="text-xs text-green-600">
                        Using {item.pantry_deduction} {item.unit} from pantry
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-gray-600">${item.estimated_price.toFixed(2)}</div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Substitution Suggestions */}
          {result.substitution_suggestions.length > 0 && (
            <Card className="bg-yellow-50">
              <CardHeader>
                <CardTitle className="text-yellow-800">💡 Substitution Suggestions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {result.substitution_suggestions.map((suggestion, idx) => (
                  <div key={idx} className="text-sm">
                    <span className="font-medium">{suggestion.item}</span>
                    <span className="text-gray-600"> - {suggestion.reason}</span>
                    <div className="text-xs text-gray-500 mt-1">
                      Consider: {suggestion.alternative} • {suggestion.savings}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Button onClick={() => setResult(null)} variant="outline" className="w-full">
            Generate New Recipes
          </Button>
        </>
      )}
    </div>
  );
}
