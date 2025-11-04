import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Button } from './components/ui/button';
import { Calendar, ShoppingCart, ChefHat, Home, User, Loader2 } from 'lucide-react';
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
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AppContent() {
  const { 
    isAuthenticated, 
    isLoading, 
    user, 
    getAccessTokenSilently,
    loginWithRedirect,
    error 
  } = useAuth0();
  
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

  // Debug logging
  useEffect(() => {
    console.log('🔍 App.tsx render:', {
      isAuthenticated,
      isLoading,
      hasUser: !!user,
      userId: user?.sub
    });
  }, [isAuthenticated, isLoading, user, error]);

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
    console.log('👤 loadProfile effect triggered, user:', user?.sub);
    
    const loadProfile = async () => {
      if (!user) {
        console.log('⏩ No user, skipping profile load');
        setIsLoadingProfile(false);  // FIX: Set to false when no user
        return;
      }

      try {
        console.log('📥 Loading profile for user:', user.sub);
        const namespace = "https://pantheon.app/";
        const appMetadata = user[`${namespace}app_metadata`];
        
        if (appMetadata?.profile) {
          setUserProfile({
            ...appMetadata.profile,
            userId: user.sub || '',
            hasCompletedOnboarding: appMetadata.hasCompletedOnboarding || false
          });
        } else {
          setUserProfile(prev => ({
            ...prev,
            userId: user.sub || ''
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
          audience: import.meta.env.VITE_AUTH0_AUDIENCE,
        }
      });

      const completeProfile: UserProfile = {
        ...userProfile,
        ...profile,
        hasCompletedOnboarding: true,
        userId: user?.sub || ''
      };

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

  const handleUpdatePantryItem = (id: string, updates: Partial<PantryItem>) => {
    setPantryItems(items =>
      items.map(item => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const handleDeletePantryItem = (id: string) => {
    setPantryItems(items => items.filter(item => item.id !== id));
  };

  const handleClearExpiringItems = () => {
    setPantryItems(items => {
      const expiringItems = items.filter(item => {
        if (item.storageLocation === 'freezer') return false;
        if (!item.expiresAt) return false;
        const days = Math.ceil((item.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return days <= 3;
      });
      return items.filter(item => !expiringItems.includes(item));
    });
  };

  // Handle Auth0 errors
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="text-center space-y-6 p-8 bg-white rounded-lg shadow-xl max-w-md">
          <h2 className="text-2xl font-bold text-red-600">Authentication Error</h2>
          <p className="text-gray-700">{error.message}</p>
          <Button onClick={() => loginWithRedirect()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Auth0 loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-6 max-w-md px-4">
          <h1 className="text-4xl font-bold text-gray-900">Welcome to Pantheon</h1>
          <p className="text-gray-600 text-lg">Plan your meals, shop smarter, cook better</p>
          <button
            onClick={() => loginWithRedirect()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            Sign In to Get Started
          </button>
        </div>
      </div>
    );
  }

  // Profile loading
  if (isLoadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  // Onboarding
  if (!userProfile.hasCompletedOnboarding) {
    return <Onboarding onComplete={handleCompleteOnboarding} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster />
      <NotesPanel />
      
      {/* Header - Always visible */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setActiveTab('home')}
              className="flex items-center gap-2"
            >
              <Home className="h-4 w-4" />
              Home
            </Button>
            <div className="flex-1 text-center">
              <h1 className="text-2xl font-bold">Pantheon</h1>
            </div>
            <div className="flex items-center gap-2">
              {user?.picture ? (
                <img
                  src={user.picture}
                  alt={user.name || 'User avatar'}
                  className="w-8 h-8 rounded-full border-2 border-gray-200 cursor-pointer hover:border-blue-500 transition-colors duration-200"
                  onClick={() => setActiveTab('profile')}
                />
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveTab('profile')}
                >
                  <User className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content with Conditional Tabs */}
      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Only show tab bar when NOT on home or profile */}
          {activeTab !== 'home' && activeTab !== 'profile' && activeTab !== 'concepts' && activeTab !== 'detailed' && (
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 mb-8">
              <TabsTrigger value="plan" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Plan
              </TabsTrigger>
              <TabsTrigger value="shop" className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                Shop
              </TabsTrigger>
              <TabsTrigger value="cook" className="flex items-center gap-2">
                <ChefHat className="h-4 w-4" />
                Cook
              </TabsTrigger>
            </TabsList>
          )}

          <TabsContent value="home">
            <HomeView onNavigate={setActiveTab} />
          </TabsContent>

          <TabsContent value="concepts">
            <MealConceptGenerationView />
          </TabsContent>

          <TabsContent value="detailed">
            <DetailedRecipeGenerationView />
          </TabsContent>

          <TabsContent value="plan">
            <PlanView />
          </TabsContent>

          <TabsContent value="shop">
            <ShopView />
          </TabsContent>

          <TabsContent value="cook">
            <CookView 
              pantryItems={pantryItems}
              onUpdatePantryItem={handleUpdatePantryItem}
              onDeletePantryItem={handleDeletePantryItem}
              onClearExpiringItems={handleClearExpiringItems}
            />
          </TabsContent>

          <TabsContent value="profile">
            <ProfileView userProfile={userProfile} />
          </TabsContent>

          <TabsContent value="pantry">
            <PantryView 
              items={pantryItems}
              onUpdateItem={handleUpdatePantryItem}
              onDeleteItem={handleDeletePantryItem}
              onClearExpiring={handleClearExpiringItems}
            />
          </TabsContent>
        </Tabs>
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
