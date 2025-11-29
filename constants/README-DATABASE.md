# AlphaGo Database System Documentation

## Overview

This document explains the database infrastructure built into AlphaGo for **Option B** (master database approach).

Currently, **Option A** (AI real-time analysis) is active. The database system is ready to be enabled when needed.

---

## Architecture

### Two Analysis Modes

#### Option A: AI Real-Time Analysis (CURRENTLY ACTIVE)
- Each scan uses AI to analyze ingredients in real-time
- Provides accurate, contextual analysis
- No pre-built database required
- Works with any product immediately

#### Option B: Database-First Approach (INFRASTRUCTURE READY)
- Check local database for known ingredients/products first
- Only use AI for unknown items
- Faster analysis for known products
- Requires database maintenance and updates

---

## How to Enable Option B

### Step 1: Enable Database Features

Edit `constants/database-config.ts`:

```typescript
export const DATABASE_CONFIG = {
  ENABLE_PRODUCT_DATABASE: true,    // Changed from false
  ENABLE_INGREDIENT_DATABASE: true, // Changed from false
  // ... rest stays the same
};
```

### Step 2: Implement Database Lookup Logic

In `app/scan.tsx`, modify the `analyzeMutation` function to check the database first:

```typescript
mutationFn: async (imageUri: string) => {
  // OPTION B CODE: Check product database first
  if (DATABASE_CONFIG.ENABLE_PRODUCT_DATABASE) {
    const cachedProduct = findProduct({ productName: "..." });
    if (cachedProduct) {
      console.log("Found product in database, using cached result");
      return convertProductToAnalysis(cachedProduct);
    }
  }

  // If not found in database, use AI (existing code continues...)
  const analysis = await generateObject({...});
  return analysis;
}
```

### Step 3: Implement Scheduled Updates

The midnight update system needs implementation:

1. Use a background task library like `expo-task-manager` or `expo-background-fetch`
2. Call `performDatabaseUpdate()` from `utils/database-updater.ts`
3. Implement the actual web scraping/API calls in that function

---

## Database Structure

### Ingredient Database
Stores individual ingredients with safety status:
```typescript
{
  name: "Gelatin",
  safetyStatus: "unsafe" | "caution" | "safe",
  category: "gelatin",
  explanation: "Derived from mammal collagen",
  sources: ["beef", "pork"],
  lastUpdated: 1234567890
}
```

### Product Database
Stores complete products with all ingredients:
```typescript
{
  productName: "Chocolate Bar",
  brand: "BrandName",
  barcode: "1234567890",
  overallSafety: "safe" | "caution" | "unsafe",
  ingredients: [...],
  lastVerified: 1234567890,
  userReported: false
}
```

### Update Log
Tracks when databases are updated:
```typescript
{
  timestamp: 1234567890,
  ingredientsAdded: 5,
  ingredientsUpdated: 3,
  productsAdded: 10,
  source: "ai-scan" | "manual-report" | "scheduled-update"
}
```

---

## Current Auto-Learning System

Even with Option A active, the app logs discovered ingredients (when database is enabled). This means:

1. User scans a product
2. AI analyzes ingredients
3. System checks: "Do we have these ingredients in database?"
4. If new ingredients found → adds them to database
5. Logs the update

This builds a database passively over time without requiring scheduled updates initially.

---

## Scheduled Updates (Midnight Scraping)

### Implementation Plan

File: `utils/database-updater.ts`

Functions to implement:
- `scheduleDatabaseUpdate()` - Set up background task
- `performDatabaseUpdate()` - Run the actual update
- `checkForNewIngredients()` - Scrape web for new ingredients
- `isUpdateNeeded()` - Check if enough time has passed

Background tasks require:
```bash
npx expo install expo-task-manager expo-background-fetch
```

Then register a background task:
```typescript
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';

TaskManager.defineTask('database-update', async () => {
  const result = await performDatabaseUpdate();
  return result.success 
    ? BackgroundFetch.BackgroundFetchResult.NewData
    : BackgroundFetch.BackgroundFetchResult.Failed;
});

// Schedule it to run
await BackgroundFetch.registerTaskAsync('database-update', {
  minimumInterval: 24 * 60 * 60, // 24 hours
  stopOnTerminate: false,
  startOnBoot: true,
});
```

---

## Benefits of Each Option

### Option A (Current - AI Real-Time)
✅ Always accurate and up-to-date
✅ No database maintenance needed  
✅ Works for any product immediately
✅ Handles edge cases well
❌ Slower (AI analysis takes time)
❌ Requires internet connection

### Option B (Database-First)
✅ Faster for known products
✅ Works offline for cached products
✅ Reduces AI API costs
❌ Requires database maintenance
❌ Needs scheduled updates
❌ May have stale data
❌ Unknown products still need AI

---

## Migration Path

To switch from A to B gradually:

1. **Keep both enabled** - use database as cache, AI as fallback
2. **Build database passively** - let AI populate database over time
3. **Monitor coverage** - track what % of scans hit database vs AI
4. **Implement updates** - add scheduled scraping when database is large enough
5. **Tune thresholds** - decide when database data is "too old"

---

## File Structure

```
types/
  database.ts              # Type definitions for database entities

constants/
  database-config.ts       # Configuration flags and settings
  README-DATABASE.md       # This documentation

contexts/
  ingredient-database.tsx  # Ingredient database provider & hooks
  product-database.tsx     # Product database provider & hooks

utils/
  database-updater.ts      # Scheduled update logic (to be implemented)

app/
  scan.tsx                 # Uses database providers (logs ingredients when enabled)
  _layout.tsx             # Wraps app in database providers
```

---

## Testing the Database System

To test Option B without full implementation:

1. Enable databases in config
2. Scan a few products
3. Check AsyncStorage to see ingredients being stored:
   ```typescript
   import AsyncStorage from '@react-native-async-storage/async-storage';
   const data = await AsyncStorage.getItem('alphago_ingredient_database');
   console.log('Stored ingredients:', JSON.parse(data));
   ```

---

## Notes

- Database providers are **always available** but do nothing when disabled
- All database operations include console logs for debugging
- The system is designed to fail gracefully - if database is disabled, everything works via AI
- Adding to database is async and won't slow down scan results
