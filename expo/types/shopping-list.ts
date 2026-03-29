export interface ShoppingListItem {
  id: string;
  productName: string;
  addedAt: number;
  scanResult?: {
    status: "safe" | "caution" | "unsafe";
    ingredientCount: number;
  };
}
