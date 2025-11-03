import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Button } from './components/ui/button';
import { Calendar, ShoppingCart, ChefHat, Home, User, Lightbulb } from 'lucide-react';
import { toast } from 'sonner';
import { HomeView } from './components/HomeView';
import { PlanView } from './components/PlanView';
import { ShopView } from './components/ShopView';
import { CookView } from './components/CookView';
import { Onboarding } from './components/Onboarding';
import { ProfileView } from './components/ProfileView';
import { PantryView } from './components/PantryView';
import { MealConceptGenerationView } from './components/MealConceptGenerationView';
import { DetailedRecipeGenerationView } from './components/DetailedRecipeGenerationView';
import { NotesPanel } from './components/NotesPanel';
import { UserProfile, PantryItem } from './types';
import { Toaster } from './components/ui/sonner';
import { mockPantryItems } from './data/mockData';
import { useAuth0 } from '@auth0/auth0-react';
import { apiClient } from './services/api';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AppContent() {
  const { isAuthenticated, isLoading, user, getAccessTokenSilently } = useAuth0();
  const [activeTab, setActiveTab] = useState('home');
  const [pantryItems, setPantryItems] = useState<PantryItem[]>(mockPantryItems);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    hasCompletedOnboarding: false,
    userId: '',
    goals: [],
    activityLevel: 'moderate',
    favoriteIngredients: [],
    favoriteMeals: [],
    favoriteStores: [],
    foodExclusions: [],
    mealLayout: 'breakfast-lunch-dinner',
    preferredCookingDays: [],
    typicalPrepTime: 30,
  });

  // Set auth token when user authenticates
  useEffect(() => {
    const setAuthToken = async () => {
      if (isAuthenticated && user) {
        try {
          const token = await getAccessTokenSilently({
            authorizationParams: {
              audience: import.meta.env.VITE_AUTH0_AUDIENCE,
            }
          });
          apiClient.setAuthToken(token);
        } catch (error) {
          console.error('Error getting access token:', error);
        }
      }
    };

    setAuthToken();
  }, [isAuthenticated, user, getAccessTokenSilently]);

  // Load profile
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;

      try {
        const namespace = "https://pantheon.app/";
        const appMetadata = user[`${namespace}app_metadata`];
        
        if (appMetadata?.profile) {
          setUserProfile({
            ...appMetadata.profile,
            userId: user.sub,
            hasCompletedOnboarding: appMetadata.hasCompletedOnboarding || false
          });
        } else {
          setUserProfile(prev => ({
            ...prev,
            userId: user.sub
          }));
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    loadProfile();
  }, [user]);

  const handleCompleteOnboarding = async (profile: Partial<UserProfile>) => {
    const toastId = toast.loading('Saving your preferences...');
    
    try {
      const token = await getAccessTokenSilently({
        authorizationParams: {
          audience: `https://${import.meta.env.VITE_AUTH0_DOMAIN}/api/v2/`,
          scope: 'update:current_user_metadata'
        }
      });

      const completeProfile: UserProfile = {
        ...userProfile,
        ...profile,
        hasCompletedOnboarding: true,
        userId: user?.sub  // ← THIS IS KEY!
      };

      const auth0Domain = import.meta.env.VITE_AUTH0_DOMAIN;
      const userId = user?.sub;

      // Calls YOUR backend which then talks to Auth0
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/profile/complete-onboarding`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ profile: completeProfile })
      });

      if (!response.ok) {
        throw new Error(`Failed to save: ${await response.text()}`);
      }

      setUserProfile(completeProfile);
      toast.success('Profile saved successfully!', { id: toastId });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile', { id: toastId });
    }
  };

  if (isLoading || isLoadingProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center space-y-6 p-8 bg-white rounded-lg shadow-xl">
          <h1 className="text-4xl font-bold text-gray-900">Athyra</h1>
          <p className="text-gray-600">AI-Powered Meal Planning</p>
          <Button onClick={() => window.location.href = '/login'} size="lg">
            Sign In to Get Started
          </Button>
        </div>
      </div>
    );
  }

  if (!userProfile.hasCompletedOnboarding) {
    return <Onboarding onComplete={handleCompleteOnboarding} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster />
      
      <div className="flex">
        <aside className="w-64 bg-white border-r min-h-screen p-4">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Athyra</h1>
            <p className="text-sm text-gray-500">AI Meal Planning</p>
          </div>

          <nav className="space-y-2">
            <button
              onClick={() => setActiveTab('home')}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition ${
                activeTab === 'home' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'
              }`}
            >
              <Home className="h-5 w-5" />
              <span>Home</span>
            </button>

            <button
              onClick={() => setActiveTab('concepts')}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition ${
                activeTab === 'concepts' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'
              }`}
            >
              <Lightbulb className="h-5 w-5" />
              <span>Generate Concepts</span>
            </button>

            <button
              onClick={() => setActiveTab('detailed')}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition ${
                activeTab === 'detailed' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'
              }`}
            >
              <ChefHat className="h-5 w-5" />
              <span>Detailed Recipes</span>
            </button>

            <button
              onClick={() => setActiveTab('plan')}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition ${
                activeTab === 'plan' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'
              }`}
            >
              <Calendar className="h-5 w-5" />
              <span>Plan</span>
            </button>

            <button
              onClick={() => setActiveTab('shop')}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition ${
                activeTab === 'shop' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'
              }`}
            >
              <ShoppingCart className="h-5 w-5" />
              <span>Shop</span>
            </button>

            <button
              onClick={() => setActiveTab('cook')}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition ${
                activeTab === 'cook' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'
              }`}
            >
              <ChefHat className="h-5 w-5" />
              <span>Cook</span>
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition ${
                activeTab === 'profile' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'
              }`}
            >
              <User className="h-5 w-5" />
              <span>Profile</span>
            </button>
          </nav>
        </aside>

        <main className="flex-1">
          {activeTab === 'home' && <HomeView />}
          {activeTab === 'concepts' && <MealConceptGenerationView />}
          {activeTab === 'detailed' && <DetailedRecipeGenerationView />}
          {activeTab === 'plan' && <PlanView />}
          {activeTab === 'shop' && <ShopView />}
          {activeTab === 'cook' && <CookView />}
          {activeTab === 'profile' && <ProfileView userProfile={userProfile} />}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}
