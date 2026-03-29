import {
  sanitizeIngredientText,
  checkIngredientAgainstAllergens,
  determineOverallSafety,
  analyzeIngredients,
} from "@/utils/ingredient-checker";
import { Ingredient } from "@/types/scan";

describe("sanitizeIngredientText", () => {
  it("should convert text to lowercase", () => {
    expect(sanitizeIngredientText("GELATIN")).toBe("gelatin");
  });

  it("should remove special characters", () => {
    expect(sanitizeIngredientText("milk (pasteurized)")).toBe("milk pasteurized");
  });

  it("should trim whitespace", () => {
    expect(sanitizeIngredientText("  butter  ")).toBe("butter");
  });

  it("should normalize multiple spaces", () => {
    expect(sanitizeIngredientText("whey    protein")).toBe("whey protein");
  });
});

describe("checkIngredientAgainstAllergens", () => {
  it("should detect unsafe alpha-gal ingredients", () => {
    const result = checkIngredientAgainstAllergens("gelatin", ["alpha-gal"]);
    
    expect(result.isSafe).toBe(false);
    expect(result.status).toBe("unsafe");
    expect(result.matchedAllergens).toContain("Alpha-Gal");
    expect(result.explanation).toBeTruthy();
  });

  it("should detect caution ingredients", () => {
    const result = checkIngredientAgainstAllergens("natural flavors", ["alpha-gal"]);
    
    expect(result.isSafe).toBe(false);
    expect(result.status).toBe("caution");
    expect(result.requiresCaution).toBe(true);
    expect(result.matchedAllergens.length).toBe(0);
  });

  it("should mark safe ingredients as safe", () => {
    const result = checkIngredientAgainstAllergens("water", ["alpha-gal", "dairy"]);
    
    expect(result.isSafe).toBe(true);
    expect(result.status).toBe("safe");
    expect(result.matchedAllergens.length).toBe(0);
    expect(result.requiresCaution).toBe(false);
  });

  it("should detect multiple allergens in one ingredient", () => {
    const result = checkIngredientAgainstAllergens("milk", ["dairy", "alpha-gal"]);
    
    expect(result.isSafe).toBe(false);
    expect(result.status).toBe("unsafe");
    expect(result.matchedAllergens.length).toBeGreaterThan(0);
  });

  it("should handle dairy allergens", () => {
    const result = checkIngredientAgainstAllergens("whey protein", ["dairy"]);
    
    expect(result.isSafe).toBe(false);
    expect(result.status).toBe("unsafe");
    expect(result.matchedAllergens).toContain("Dairy");
  });

  it("should handle gluten allergens", () => {
    const result = checkIngredientAgainstAllergens("wheat flour", ["gluten"]);
    
    expect(result.isSafe).toBe(false);
    expect(result.status).toBe("unsafe");
    expect(result.matchedAllergens).toContain("Gluten/Celiac");
  });
});

describe("determineOverallSafety", () => {
  it("should return unsafe if any ingredient is unsafe", () => {
    const ingredients: Ingredient[] = [
      { name: "water", isMammalBased: false, isAllergen: false, requiresCaution: false },
      { name: "gelatin", isMammalBased: true, isAllergen: true, requiresCaution: false },
    ];

    expect(determineOverallSafety(ingredients)).toBe("unsafe");
  });

  it("should return caution if only caution ingredients present", () => {
    const ingredients: Ingredient[] = [
      { name: "water", isMammalBased: false, isAllergen: false, requiresCaution: false },
      { name: "natural flavors", isMammalBased: false, isAllergen: false, requiresCaution: true },
    ];

    expect(determineOverallSafety(ingredients)).toBe("caution");
  });

  it("should return safe if all ingredients are safe", () => {
    const ingredients: Ingredient[] = [
      { name: "water", isMammalBased: false, isAllergen: false, requiresCaution: false },
      { name: "salt", isMammalBased: false, isAllergen: false, requiresCaution: false },
    ];

    expect(determineOverallSafety(ingredients)).toBe("safe");
  });
});

describe("analyzeIngredients", () => {
  it("should analyze a list of ingredients correctly", () => {
    const result = analyzeIngredients(
      ["water", "gelatin", "natural flavors", "salt"],
      ["alpha-gal"]
    );

    expect(result.ingredients.length).toBe(4);
    expect(result.overallSafety).toBe("unsafe");
    
    const gelatinResult = result.ingredients.find((i: { ingredient: string }) => i.ingredient === "gelatin");
    expect(gelatinResult?.isSafe).toBe(false);
    expect(gelatinResult?.status).toBe("unsafe");

    const cautionResult = result.ingredients.find((i: { ingredient: string }) => i.ingredient === "natural flavors");
    expect(cautionResult?.requiresCaution).toBe(true);
  });

  it("should return safe overall when all ingredients are safe", () => {
    const result = analyzeIngredients(
      ["water", "salt", "sugar"],
      ["alpha-gal", "dairy"]
    );

    expect(result.overallSafety).toBe("safe");
    expect(result.ingredients.every((i: { isSafe: boolean }) => i.isSafe)).toBe(true);
  });

  it("should handle empty ingredient list", () => {
    const result = analyzeIngredients([], ["alpha-gal"]);

    expect(result.ingredients.length).toBe(0);
    expect(result.overallSafety).toBe("safe");
  });

  it("should handle multiple allergens", () => {
    const result = analyzeIngredients(
      ["milk", "wheat flour", "peanut butter"],
      ["dairy", "gluten", "peanuts"]
    );

    expect(result.overallSafety).toBe("unsafe");
    expect(result.ingredients.filter((i: { isSafe: boolean }) => !i.isSafe).length).toBe(3);
  });
});
