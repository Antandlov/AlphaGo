import { Ingredient, SafetyStatus } from "../types/scan";
import { ALLERGENS } from "../constants/allergens";

export interface IngredientCheckResult {
  ingredient: string;
  isSafe: boolean;
  status: SafetyStatus;
  matchedAllergens: string[];
  requiresCaution: boolean;
  explanation?: string;
}

export function sanitizeIngredientText(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, " ");
}

export function checkIngredientAgainstAllergens(
  ingredientName: string,
  allergenIds: string[]
): IngredientCheckResult {
  const sanitized = sanitizeIngredientText(ingredientName);
  
  const matchedAllergens: string[] = [];
  let requiresCaution = false;
  let explanation = "";

  allergenIds.forEach((allergenId) => {
    const allergen = ALLERGENS.find((a) => a.id === allergenId);
    if (!allergen) return;

    const isCommonIngredient = allergen.commonIngredients.some((common) =>
      sanitized.includes(sanitizeIngredientText(common))
    );

    const isCautionIngredient = allergen.cautionIngredients.some((caution) =>
      sanitized.includes(sanitizeIngredientText(caution))
    );

    if (isCommonIngredient) {
      matchedAllergens.push(allergen.name);
      explanation = `Contains ${allergen.name.toLowerCase()}. ${allergen.description}`;
    } else if (isCautionIngredient) {
      requiresCaution = true;
      explanation = `May contain ${allergen.name.toLowerCase()}. Verify the source with the manufacturer.`;
    }
  });

  const isSafe = matchedAllergens.length === 0 && !requiresCaution;
  const status: SafetyStatus = matchedAllergens.length > 0 ? "unsafe" : requiresCaution ? "caution" : "safe";

  return {
    ingredient: ingredientName,
    isSafe,
    status,
    matchedAllergens,
    requiresCaution,
    explanation: explanation || undefined,
  };
}

export function determineOverallSafety(ingredients: Ingredient[]): SafetyStatus {
  const hasUnsafe = ingredients.some((i) => i.isAllergen || i.isMammalBased);
  const hasCaution = ingredients.some((i) => i.requiresCaution);

  if (hasUnsafe) return "unsafe";
  if (hasCaution) return "caution";
  return "safe";
}

export function analyzeIngredients(
  ingredientList: string[],
  allergenIds: string[]
): {
  ingredients: IngredientCheckResult[];
  overallSafety: SafetyStatus;
} {
  const ingredients = ingredientList.map((name) =>
    checkIngredientAgainstAllergens(name, allergenIds)
  );

  const hasUnsafe = ingredients.some((i) => !i.isSafe && !i.requiresCaution);
  const hasCaution = ingredients.some((i) => i.requiresCaution);

  const overallSafety: SafetyStatus = hasUnsafe ? "unsafe" : hasCaution ? "caution" : "safe";

  return {
    ingredients,
    overallSafety,
  };
}
