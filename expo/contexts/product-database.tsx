import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { ProductDatabase } from "../types/database";
import { DATABASE_CONFIG } from "../constants/database-config";

export const [ProductDatabaseProvider, useProductDatabase] = createContextHook(() => {
  const queryClient = useQueryClient();

  const productsQuery = useQuery({
    queryKey: ["product-database"],
    queryFn: async () => {
      if (!DATABASE_CONFIG.ENABLE_PRODUCT_DATABASE) {
        return [];
      }

      try {
        const stored = await AsyncStorage.getItem(DATABASE_CONFIG.STORAGE_KEYS.PRODUCT_DB);
        if (!stored) return [];
        try {
          return JSON.parse(stored) as ProductDatabase[];
        } catch (parseError) {
          console.error("Failed to parse product database, resetting:", parseError);
          await AsyncStorage.removeItem(DATABASE_CONFIG.STORAGE_KEYS.PRODUCT_DB);
          return [];
        }
      } catch (error) {
        console.error("Failed to load product database:", error);
        return [];
      }
    },
  });

  const addProductMutation = useMutation({
    mutationFn: async (product: ProductDatabase) => {
      const current = productsQuery.data || [];
      
      const existingIndex = current.findIndex(
        p => 
          (product.barcode && p.barcode === product.barcode) ||
          (p.productName.toLowerCase() === product.productName.toLowerCase() && 
           p.brand?.toLowerCase() === product.brand?.toLowerCase())
      );

      let updated: ProductDatabase[];
      if (existingIndex >= 0) {
        updated = [...current];
        updated[existingIndex] = product;
      } else {
        updated = [...current, product];
      }

      await AsyncStorage.setItem(
        DATABASE_CONFIG.STORAGE_KEYS.PRODUCT_DB,
        JSON.stringify(updated)
      );
      return updated;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(["product-database"], updated);
    },
  });

  const batchAddProductsMutation = useMutation({
    mutationFn: async (products: ProductDatabase[]) => {
      const current = productsQuery.data || [];
      const productMap = new Map<string, ProductDatabase>();

      current.forEach(p => {
        const key = p.barcode || `${p.productName}-${p.brand || ''}`.toLowerCase();
        productMap.set(key, p);
      });

      products.forEach(product => {
        const key = product.barcode || `${product.productName}-${product.brand || ''}`.toLowerCase();
        productMap.set(key, product);
      });

      const updated = Array.from(productMap.values());

      await AsyncStorage.setItem(
        DATABASE_CONFIG.STORAGE_KEYS.PRODUCT_DB,
        JSON.stringify(updated)
      );

      return updated;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(["product-database"], updated);
    },
  });

  const findProduct = useCallback(
    (query: { barcode?: string; productName?: string; brand?: string }): ProductDatabase | undefined => {
      if (!DATABASE_CONFIG.ENABLE_PRODUCT_DATABASE) {
        return undefined;
      }

      const products = productsQuery.data || [];

      if (query.barcode) {
        return products.find(p => p.barcode === query.barcode);
      }

      if (query.productName) {
        return products.find(
          p =>
            p.productName.toLowerCase().includes(query.productName!.toLowerCase()) &&
            (!query.brand || p.brand?.toLowerCase() === query.brand.toLowerCase())
        );
      }

      return undefined;
    },
    [productsQuery.data]
  );

  const { mutate: addProductMutate } = addProductMutation;

  const addProduct = useCallback(
    (product: ProductDatabase) => {
      if (!DATABASE_CONFIG.ENABLE_PRODUCT_DATABASE) {
        console.log("Product database disabled - would have added:", product.productName);
        return;
      }
      addProductMutate(product);
    },
    [addProductMutate]
  );

  const { mutate: batchAddProductsMutate } = batchAddProductsMutation;

  const batchAddProducts = useCallback(
    (products: ProductDatabase[]) => {
      if (!DATABASE_CONFIG.ENABLE_PRODUCT_DATABASE) {
        console.log("Product database disabled - would have added:", products.length, "products");
        return;
      }
      batchAddProductsMutate(products);
    },
    [batchAddProductsMutate]
  );

  return {
    products: productsQuery.data || [],
    isLoading: productsQuery.isLoading,
    findProduct,
    addProduct,
    batchAddProducts,
    isDatabaseEnabled: DATABASE_CONFIG.ENABLE_PRODUCT_DATABASE,
  };
});
