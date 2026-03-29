import { Ingredient } from "../types/scan";

export interface SafeAlternative {
  name: string;
  category: string;
  reason: string;
}

export function getSafeAlternatives(
  ingredient: Ingredient,
  allergenIds: string[]
): SafeAlternative[] {
  const alternatives: SafeAlternative[] = [];
  
  if (!ingredient.allergenIds || ingredient.allergenIds.length === 0) {
    return alternatives;
  }

  const hasAlphaGal = allergenIds.includes("alpha-gal");
  const hasDairy = allergenIds.includes("dairy");
  const hasGluten = allergenIds.includes("gluten");
  const hasSoy = allergenIds.includes("soy");
  const hasNuts = allergenIds.includes("nuts");
  const hasPeanuts = allergenIds.includes("peanuts");

  const ingredientName = ingredient.name.toLowerCase();

  if (hasDairy || hasAlphaGal) {
    if (ingredientName.includes("milk") || ingredientName.includes("dairy")) {
      alternatives.push(
        { name: "Almond Milk", category: "Plant-Based Milk", reason: "Dairy-free alternative" },
        { name: "Oat Milk", category: "Plant-Based Milk", reason: "Creamy, dairy-free option" },
        { name: "Coconut Milk", category: "Plant-Based Milk", reason: "Rich, dairy-free alternative" }
      );
    }
    
    if (ingredientName.includes("butter")) {
      alternatives.push(
        { name: "Vegan Butter", category: "Plant-Based Spread", reason: "Dairy-free butter substitute" },
        { name: "Coconut Oil", category: "Cooking Oil", reason: "Natural, plant-based fat" },
        { name: "Olive Oil", category: "Cooking Oil", reason: "Healthy, dairy-free option" }
      );
    }

    if (ingredientName.includes("cheese")) {
      alternatives.push(
        { name: "Cashew Cheese", category: "Plant-Based Cheese", reason: "Creamy, dairy-free cheese" },
        { name: "Nutritional Yeast", category: "Seasoning", reason: "Cheesy flavor without dairy" }
      );
    }

    if (ingredientName.includes("gelatin")) {
      alternatives.push(
        { name: "Agar-Agar", category: "Plant-Based Gelling Agent", reason: "Seaweed-based gelatin substitute" },
        { name: "Pectin", category: "Fruit-Based Gelling Agent", reason: "Plant-derived thickener" }
      );
    }
  }

  if (hasGluten) {
    if (ingredientName.includes("wheat") || ingredientName.includes("flour")) {
      alternatives.push(
        { name: "Rice Flour", category: "Gluten-Free Flour", reason: "Versatile, gluten-free option" },
        { name: "Almond Flour", category: "Gluten-Free Flour", reason: "Nutrient-rich alternative" },
        { name: "Coconut Flour", category: "Gluten-Free Flour", reason: "High-fiber, gluten-free" }
      );
    }
  }

  if (hasSoy) {
    if (ingredientName.includes("soy")) {
      alternatives.push(
        { name: "Coconut Aminos", category: "Soy-Free Sauce", reason: "Soy sauce alternative" },
        { name: "Sunflower Lecithin", category: "Emulsifier", reason: "Soy lecithin substitute" }
      );
    }
  }

  if (hasNuts || hasPeanuts) {
    if (ingredientName.includes("peanut") || ingredientName.includes("nut")) {
      alternatives.push(
        { name: "Sunflower Seed Butter", category: "Seed Butter", reason: "Nut-free spread" },
        { name: "Tahini", category: "Seed Butter", reason: "Sesame-based, nut-free" }
      );
    }
  }

  return alternatives;
}

export function getAllSafeAlternativesForScan(
  ingredients: Ingredient[],
  allergenIds: string[]
): Map<string, SafeAlternative[]> {
  const alternativesMap = new Map<string, SafeAlternative[]>();

  ingredients.forEach((ingredient) => {
    if (ingredient.isAllergen || ingredient.isMammalBased) {
      const alternatives = getSafeAlternatives(ingredient, allergenIds);
      if (alternatives.length > 0) {
        alternativesMap.set(ingredient.name, alternatives);
      }
    }
  });

  return alternativesMap;
}
