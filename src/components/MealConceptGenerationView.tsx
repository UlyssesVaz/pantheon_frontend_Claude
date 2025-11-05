/**
 * Meal Concept Generation View (Phase 1)
 * 
 * Workflow:
 * 1. User sets preferences (vibe, number, dietary needs)
 * 2. Generate concepts via AI
 * 3. Display concepts for approval/rejection
 * 4. Move to Phase 2 with approved concepts
 */

import { useState , useEffect  } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Loader2, CheckCircle, XCircle, Clock, DollarSign, Flame, ChefHat } from 'lucide-react';
import { 
  useMealConcepts, 
  useGenerateMealConcepts,
  useApproveMealConcept,
  useRejectMealConcept 
} from '../hooks/useMealConcepts';
import { MealConceptRequest } from '../services/api';

export function MealConceptGenerationView() {
  const [preferences, setPreferences] = useState<MealConceptRequest>({
    vibe: 'balanced',
    num_concepts: 7,
    must_include_categories: [],
    avoid_categories: [],
    prefer_quick_meals: false,
  });

  const [showResults, setShowResults] = useState(false);

  // Queries & Mutations
  const { data: pendingConcepts, isLoading: loadingConcepts, refetch: refetchPending } = useMealConcepts('pending');
  const { data: approvedConcepts, refetch: refetchApproved } = useMealConcepts('approved');
  const generateMutation = useGenerateMealConcepts();
  const approveMutation = useApproveMealConcept();
  const rejectMutation = useRejectMealConcept();

  const handleGenerate = async () => {
    await generateMutation.mutateAsync(preferences);
    setShowResults(true);
  };

  const handleApprove = (conceptId: string) => {
    approveMutation.mutate(conceptId);
  };

  const handleReject = (conceptId: string) => {
    rejectMutation.mutate(conceptId);
  };

  const getCostColor = (cost: string) => {
    if (cost === '$') return 'text-green-600';
    if (cost === '$$') return 'text-yellow-600';
    return 'text-red-600';
  };

  useEffect(() => {
    console.log('🔄 MealConceptGenerationView mounted, checking for data...');
    const token = localStorage.getItem('auth_token');
    
    if (token) {
      console.log('✅ Token exists, forcing refetch...');
      // Small delay to ensure token is fully set
      setTimeout(() => {
        refetchPending();
        refetchApproved();
        console.log('🔄 Refetch triggered');
      }, 500);
    } else {
      console.log('❌ No token yet');
    }
  }, [refetchPending, refetchApproved]);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Step 1: Generate Meal Concepts</h1>
        <p className="text-gray-600 mt-2">
          Let AI create high-level meal ideas based on your preferences. You'll approve the ones you like before we get into the details.
        </p>
      </div>

      {/* Preferences Form */}
      {!showResults && (
        <Card>
          <CardHeader>
            <CardTitle>Your Preferences</CardTitle>
            <CardDescription>Tell us what you're looking for this week</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="vibe">What's your vibe?</Label>
              <select
                id="vibe"
                className="w-full p-2 border rounded-md"
                value={preferences.vibe}
                onChange={(e) => setPreferences({ ...preferences, vibe: e.target.value })}
              >
                <option value="balanced">Balanced</option>
                <option value="healthy">Healthy & Light</option>
                <option value="comfort">Comfort Food</option>
                <option value="high-protein">High Protein</option>
                <option value="quick-easy">Quick & Easy</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="num_concepts">How many ideas? ({preferences.num_concepts})</Label>
              <Input
                id="num_concepts"
                type="range"
                min="3"
                max="12"
                value={preferences.num_concepts}
                onChange={(e) => setPreferences({ ...preferences, num_concepts: parseInt(e.target.value) })}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="prefer_quick"
                checked={preferences.prefer_quick_meals}
                onChange={(e) => setPreferences({ ...preferences, prefer_quick_meals: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="prefer_quick">Prefer quick meals (under 30 min)</Label>
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
                  Generating concepts...
                </>
              ) : (
                <>
                  <ChefHat className="mr-2 h-4 w-4" />
                  Generate Meal Concepts
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {showResults && (
        <>
          {loadingConcepts ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Your Meal Concepts</h2>
                <Button variant="outline" onClick={() => setShowResults(false)}>
                  Generate New Concepts
                </Button>
              </div>

              {pendingConcepts && pendingConcepts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pendingConcepts.map((concept) => (
                    <Card key={concept.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-xl">{concept.name}</CardTitle>
                            <CardDescription className="mt-1">
                              {concept.description}
                            </CardDescription>
                          </div>
                          <span className={`font-bold text-lg ${getCostColor(concept.cost_per_serving)}`}>
                            {concept.cost_per_serving}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Components */}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-semibold">🍗 Protein:</span>
                            <span>{concept.protein}</span>
                          </div>
                          {concept.carb && (
                            <div className="flex items-center gap-2 text-sm">
                              <span className="font-semibold">🌾 Carb:</span>
                              <span>{concept.carb}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-semibold">🥦 Veggies:</span>
                            <span>{concept.vegetables.join(', ')}</span>
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{concept.prep_time} min</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Flame className="h-4 w-4" />
                            <span>{concept.calories_per_serving} cal</span>
                          </div>
                        </div>

                        {/* Macros */}
                        <div className="flex gap-4 text-xs text-gray-600">
                          <span>{concept.protein_grams}P</span>
                          <span>{concept.carb_grams}C</span>
                          <span>{concept.fat_grams}F</span>
                        </div>

                        {/* Yield & Complexity */}
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Yields: {concept.meal_yield}</span>
                          <span className={concept.complexity === 'quick' ? 'text-green-600' : 'text-blue-600'}>
                            {concept.complexity === 'quick' ? '⚡ Quick' : '🔥 Batch Prep'}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-2">
                          <Button
                            onClick={() => handleApprove(concept.id)}
                            disabled={approveMutation.isPending}
                            className="flex-1"
                            variant="default"
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Approve
                          </Button>
                          <Button
                            onClick={() => handleReject(concept.id)}
                            disabled={rejectMutation.isPending}
                            className="flex-1"
                            variant="outline"
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Skip
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-8 text-center text-gray-500">
                    No pending concepts. All have been approved or rejected!
                  </CardContent>
                </Card>
              )}

              {/* Approved Concepts Summary */}
              {approvedConcepts && approvedConcepts.length > 0 && (
                <Card className="bg-green-50">
                  <CardHeader>
                    <CardTitle className="text-green-800">
                      ✓ {approvedConcepts.length} Concepts Approved
                    </CardTitle>
                    <CardDescription>
                      Ready to move to Phase 2: Detailed Recipe Generation
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {approvedConcepts.map((concept) => (
                        <div key={concept.id} className="text-sm text-green-700">
                          • {concept.name}
                        </div>
                      ))}
                    </div>
                    <Button className="w-full mt-4" size="lg">
                      Continue to Detailed Planning →
                    </Button>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
