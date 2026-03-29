export interface OpenFoodFactsProduct {
  product_name?: string;
  ingredients_text?: string;
  allergens?: string;
  image_url?: string;
  brands?: string;
  categories?: string;
}

export interface OpenFoodFactsResponse {
  status: number;
  product?: OpenFoodFactsProduct;
}

export async function fetchProductByBarcode(barcode: string): Promise<OpenFoodFactsResponse | null> {
  try {
    console.log(`[OpenFoodFacts] Fetching product for barcode: ${barcode}`);
    
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`
    );

    if (!response.ok) {
      console.error(`[OpenFoodFacts] HTTP error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    console.log(`[OpenFoodFacts] Response status: ${data.status}`);
    
    return data;
  } catch (error) {
    console.error("[OpenFoodFacts] Failed to fetch product:", error);
    return null;
  }
}

export function parseIngredientsFromText(ingredientsText: string): string[] {
  if (!ingredientsText) return [];

  const cleaned = ingredientsText
    .replace(/\([^)]*\)/g, "")
    .replace(/\[[^\]]*\]/g, "")
    .replace(/\{[^}]*\}/g, "")
    .replace(/\*/g, "");

  const ingredients = cleaned
    .split(/[,;]/)
    .map((ingredient) => ingredient.trim())
    .filter((ingredient) => ingredient.length > 0);

  return ingredients;
}
