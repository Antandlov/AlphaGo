export interface Ingredient {
  name: string;
  isMammalBased: boolean;
  category?: string;
  explanation?: string;
  requiresCaution?: boolean;
  allergenIds?: string[];
  isAllergen?: boolean;
}

export type SafetyStatus = 'safe' | 'caution' | 'unsafe';

export interface ScanResult {
  id: string;
  timestamp: number;
  status: SafetyStatus;
  ingredients: Ingredient[];
  productName?: string;
  imageUri?: string;
  isSafe: boolean;
  scannedForAllergens?: string[];
}
