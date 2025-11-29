export interface IngredientDatabase {
  name: string;
  safetyStatus: 'safe' | 'caution' | 'unsafe';
  category?: string;
  explanation?: string;
  sources?: string[];
  lastUpdated: number;
}

export interface ProductDatabase {
  productName: string;
  brand?: string;
  barcode?: string;
  overallSafety: 'safe' | 'caution' | 'unsafe';
  ingredients: IngredientDatabase[];
  lastVerified: number;
  userReported?: boolean;
}

export interface DatabaseUpdateLog {
  timestamp: number;
  ingredientsAdded: number;
  ingredientsUpdated: number;
  productsAdded: number;
  source: 'ai-scan' | 'manual-report' | 'scheduled-update';
}
