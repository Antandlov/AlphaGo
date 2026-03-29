import { ScanResult } from "../types/scan";

export interface ShareCardData {
  title: string;
  status: string;
  productName?: string;
  ingredientCount: number;
  unsafeCount: number;
  cautionCount: number;
}

export function generateShareText(scan: ScanResult): string {
  const statusEmoji = scan.status === "safe" ? "✅" : scan.status === "caution" ? "⚠️" : "❌";
  const statusText = scan.status === "safe" ? "SAFE" : scan.status === "caution" ? "CAUTION" : "UNSAFE";

  let text = `AlphaGo Scan Result ${statusEmoji}\n\n`;
  
  if (scan.productName) {
    text += `Product: ${scan.productName}\n`;
  }

  text += `Status: ${statusText}\n`;
  text += `Ingredients analyzed: ${scan.ingredients.length}\n\n`;

  const unsafeIngredients = scan.ingredients.filter(i => i.isAllergen || i.isMammalBased);
  const cautionIngredients = scan.ingredients.filter(i => !i.isAllergen && !i.isMammalBased && i.requiresCaution);

  if (unsafeIngredients.length > 0) {
    text += `❌ Unsafe Ingredients (${unsafeIngredients.length}):\n`;
    unsafeIngredients.forEach(ing => {
      text += `  • ${ing.name}\n`;
    });
    text += `\n`;
  }

  if (cautionIngredients.length > 0) {
    text += `⚠️ Caution Required (${cautionIngredients.length}):\n`;
    cautionIngredients.forEach(ing => {
      text += `  • ${ing.name}\n`;
    });
    text += `\n`;
  }

  text += `\nScanned with AlphaGo - Allergen-Safe Scanning`;

  return text;
}

export function getShareCardData(scan: ScanResult): ShareCardData {
  const unsafeIngredients = scan.ingredients.filter(i => i.isAllergen || i.isMammalBased);
  const cautionIngredients = scan.ingredients.filter(i => !i.isAllergen && !i.isMammalBased && i.requiresCaution);

  return {
    title: scan.status === "safe" ? "Safe to Consume" : scan.status === "caution" ? "Caution Required" : "Not Safe",
    status: scan.status,
    productName: scan.productName,
    ingredientCount: scan.ingredients.length,
    unsafeCount: unsafeIngredients.length,
    cautionCount: cautionIngredients.length,
  };
}
