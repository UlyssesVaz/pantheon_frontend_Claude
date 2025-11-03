# 🎨 Frontend Phase 1 Installation Guide

## What's New

### NEW FILES:
```
src/services/
  └── api.ts ✨ Centralized API client

src/hooks/
  └── useMealConcepts.ts ✨ React Query hooks

src/components/
  └── MealConceptGenerationView.tsx ✨ Phase 1 UI

src/
  └── App_NEW.tsx ✨ Updated App with React Query
```

---

## 📦 Step 1: Install Dependencies

You need to add React Query:

```bash
cd Mealworkflowinterface-main
npm install @tanstack/react-query
```

That's it! Everything else is already in your package.json.

---

## 📝 Step 2: Copy New Files

```bash
# Copy all new files to your project
cp frontend_phase1_files/services/api.ts src/services/
cp frontend_phase1_files/hooks/useMealConcepts.ts src/hooks/
cp frontend_phase1_files/components/MealConceptGenerationView.tsx src/components/
```

---

## 🔄 Step 3: Replace App.tsx

**IMPORTANT:** Backup your current App.tsx first!

```bash
# Backup
cp src/App.tsx src/App.tsx.backup

# Replace with new version
cp src/App_NEW.tsx src/App.tsx
```

Or manually merge the changes if you've customized App.tsx.

---

## 🔧 Step 4: Update .env

Add your backend URL:

```bash
# Create or update .env.local
echo "VITE_API_URL=http://localhost:8000" >> .env.local
```

Make sure you also have:
```
VITE_AUTH0_DOMAIN=your-domain.auth0.com
VITE_AUTH0_CLIENT_ID=your-client-id
VITE_AUTH0_AUDIENCE=https://api.athyra.app
```

---

## ▶️ Step 5: Start Development Server

```bash
npm run dev
```

---

## ✅ What Works Now

### New Navigation Item
You'll see a new "Generate Concepts" button in the sidebar with a lightbulb icon.

### Phase 1 Workflow
1. Click "Generate Concepts"
2. Set preferences (vibe, number of concepts)
3. Click "Generate Meal Concepts"
4. Wait for AI to generate (5-10 seconds)
5. See concepts displayed as cards
6. Approve ✓ or Skip ✗ each concept
7. See approved concepts summary
8. Ready for Phase 2!

### Features
- ✅ AI-powered concept generation
- ✅ Real-time loading states
- ✅ Optimistic UI updates (instant feedback)
- ✅ Toast notifications
- ✅ Automatic caching with React Query
- ✅ Beautiful concept cards
- ✅ Nutrition info display
- ✅ Cost indicators
- ✅ Prep time and complexity badges

---

## 🎨 UI Components

### Concept Card Shows:
- Name & description
- Cost indicator ($, $$, $$$) in green/yellow/red
- Protein, carb, veggie components
- Prep time & calories
- Macro split (P/C/F)
- Meal yield (how many meals)
- Complexity badge (Quick ⚡ or Batch Prep 🔥)
- Approve/Skip buttons

---

## 🔍 Testing Checklist

- [ ] Navigate to "Generate Concepts"
- [ ] Set preferences and click generate
- [ ] See loading spinner
- [ ] See concepts appear as cards
- [ ] Click "Approve" - concept disappears instantly
- [ ] Click "Skip" - concept disappears instantly
- [ ] Toast notifications appear
- [ ] See approved concepts summary
- [ ] All UI looks good on mobile and desktop

---

## 🐛 Troubleshooting

### Error: "Cannot find module '@tanstack/react-query'"
**Fix:** 
```bash
npm install @tanstack/react-query
```

### Error: "VITE_API_URL is not defined"
**Fix:** Add to `.env.local`:
```
VITE_API_URL=http://localhost:8000
```

### Error: "Network error" or "401 Unauthorized"
**Fix:** Make sure:
1. Backend is running on port 8000
2. You're logged in with Auth0
3. Auth token is being set correctly

### Concepts not appearing
**Fix:** Check:
1. Backend is running
2. Open browser console for errors
3. Check Network tab - is `/api/meal-concepts/generate` succeeding?
4. Verify your `ANTHROPIC_API_KEY` is set in backend

### UI looks broken
**Fix:** 
1. Make sure Tailwind is working
2. Check that shadcn/ui components are installed
3. Clear browser cache

---

## 📊 How It Works

### 1. User clicks "Generate"
```typescript
// Preferences sent to backend
{
  vibe: "healthy",
  num_concepts: 7,
  prefer_quick_meals: false
}
```

### 2. Backend calls Claude API
```
POST /api/meal-concepts/generate
→ Claude generates 7 concepts
→ Stored in database with status="pending"
→ Returns array of concepts
```

### 3. Frontend displays concepts
```typescript
// React Query fetches automatically
const { data: concepts } = useMealConcepts('pending');

// Maps to cards
{concepts.map(concept => <ConceptCard />)}
```

### 4. User approves/rejects
```typescript
// Optimistic update (instant UI)
approveMutation.mutate(conceptId);

// Backend updates status
PATCH /api/meal-concepts/{id}/approve
→ status changes to "approved"
```

### 5. Ready for Phase 2
```typescript
// Get approved concepts
const { data: approved } = useMealConcepts('approved');

// Move to detailed recipe generation
```

---

## 🎯 Next Steps

Once Phase 1 is working:

1. **Test the full flow** - Generate → Approve → See summary
2. **Tweak the UI** - Adjust colors, spacing, etc.
3. **Build Phase 2** - Detailed recipe generation from approved concepts

---

## 📞 Need Help?

Common issues:
1. **Backend not running** - Start it first!
2. **CORS errors** - Check backend CORS settings in main.py
3. **Auth issues** - Verify Auth0 config matches between frontend/backend
4. **Concepts not generating** - Check backend logs for Anthropic API errors

---

## 🎉 Success Indicators

You know it's working when:
- ✅ You can navigate to "Generate Concepts"
- ✅ Clicking "Generate" shows loading state
- ✅ Concepts appear after 5-10 seconds
- ✅ Approving/rejecting works instantly
- ✅ Toast notifications appear
- ✅ Approved concepts show in summary

Now you're ready to party! 🎊
