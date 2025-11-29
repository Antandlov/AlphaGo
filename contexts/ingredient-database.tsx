import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { IngredientDatabase, DatabaseUpdateLog } from "../types/database";
import { DATABASE_CONFIG } from "../constants/database-config";

export const [IngredientDatabaseProvider, useIngredientDatabase] = createContextHook(() => {
  const queryClient = useQueryClient();

  const ingredientsQuery = useQuery({
    queryKey: ["ingredient-database"],
    queryFn: async () => {
      if (!DATABASE_CONFIG.ENABLE_INGREDIENT_DATABASE) {
        return [];
      }
      
      try {
        const stored = await AsyncStorage.getItem(DATABASE_CONFIG.STORAGE_KEYS.INGREDIENT_DB);
        if (!stored) return [];
        try {
          return JSON.parse(stored) as IngredientDatabase[];
        } catch (parseError) {
          console.error("Failed to parse ingredient database, resetting:", parseError);
          await AsyncStorage.removeItem(DATABASE_CONFIG.STORAGE_KEYS.INGREDIENT_DB);
          return [];
        }
      } catch (error) {
        console.error("Failed to load ingredient database:", error);
        return [];
      }
    },
  });

  const updateLogQuery = useQuery({
    queryKey: ["database-update-log"],
    queryFn: async () => {
      if (!DATABASE_CONFIG.ENABLE_INGREDIENT_DATABASE) {
        return [];
      }
      
      try {
        const stored = await AsyncStorage.getItem(DATABASE_CONFIG.STORAGE_KEYS.UPDATE_LOG);
        if (!stored) return [];
        try {
          return JSON.parse(stored) as DatabaseUpdateLog[];
        } catch (parseError) {
          console.error("Failed to parse update log, resetting:", parseError);
          await AsyncStorage.removeItem(DATABASE_CONFIG.STORAGE_KEYS.UPDATE_LOG);
          return [];
        }
      } catch (error) {
        console.error("Failed to load update log:", error);
        return [];
      }
    },
  });

  const addIngredientMutation = useMutation({
    mutationFn: async (ingredient: IngredientDatabase) => {
      const current = ingredientsQuery.data || [];
      const existingIndex = current.findIndex(
        i => i.name.toLowerCase() === ingredient.name.toLowerCase()
      );

      let updated: IngredientDatabase[];
      if (existingIndex >= 0) {
        updated = [...current];
        updated[existingIndex] = ingredient;
      } else {
        updated = [...current, ingredient];
      }

      await AsyncStorage.setItem(
        DATABASE_CONFIG.STORAGE_KEYS.INGREDIENT_DB,
        JSON.stringify(updated)
      );
      return updated;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(["ingredient-database"], updated);
    },
  });

  const batchAddIngredientsMutation = useMutation({
    mutationFn: async (ingredients: IngredientDatabase[]) => {
      const current = ingredientsQuery.data || [];
      const ingredientMap = new Map(
        current.map(i => [i.name.toLowerCase(), i])
      );

      ingredients.forEach(ingredient => {
        ingredientMap.set(ingredient.name.toLowerCase(), ingredient);
      });

      const updated = Array.from(ingredientMap.values());

      await AsyncStorage.setItem(
        DATABASE_CONFIG.STORAGE_KEYS.INGREDIENT_DB,
        JSON.stringify(updated)
      );

      return updated;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(["ingredient-database"], updated);
    },
  });

  const logUpdateMutation = useMutation({
    mutationFn: async (log: DatabaseUpdateLog) => {
      const current = updateLogQuery.data || [];
      const updated = [log, ...current].slice(0, 100);

      await AsyncStorage.setItem(
        DATABASE_CONFIG.STORAGE_KEYS.UPDATE_LOG,
        JSON.stringify(updated)
      );

      await AsyncStorage.setItem(
        DATABASE_CONFIG.STORAGE_KEYS.LAST_UPDATE,
        log.timestamp.toString()
      );

      return updated;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(["database-update-log"], updated);
    },
  });

  const findIngredient = useCallback(
    (ingredientName: string): IngredientDatabase | undefined => {
      if (!DATABASE_CONFIG.ENABLE_INGREDIENT_DATABASE) {
        return undefined;
      }

      const ingredients = ingredientsQuery.data || [];
      return ingredients.find(
        i => i.name.toLowerCase() === ingredientName.toLowerCase()
      );
    },
    [ingredientsQuery.data]
  );

  const { mutate: addIngredientMutate } = addIngredientMutation;

  const addIngredient = useCallback(
    (ingredient: IngredientDatabase) => {
      if (!DATABASE_CONFIG.ENABLE_INGREDIENT_DATABASE) {
        console.log("Ingredient database disabled - would have added:", ingredient.name);
        return;
      }
      addIngredientMutate(ingredient);
    },
    [addIngredientMutate]
  );

  const { mutate: batchAddIngredientsMutate } = batchAddIngredientsMutation;

  const batchAddIngredients = useCallback(
    (ingredients: IngredientDatabase[]) => {
      if (!DATABASE_CONFIG.ENABLE_INGREDIENT_DATABASE) {
        console.log("Ingredient database disabled - would have added:", ingredients.length, "ingredients");
        return;
      }
      batchAddIngredientsMutate(ingredients);
    },
    [batchAddIngredientsMutate]
  );

  const { mutate: logUpdateMutate } = logUpdateMutation;

  const logUpdate = useCallback(
    (log: DatabaseUpdateLog) => {
      if (!DATABASE_CONFIG.ENABLE_INGREDIENT_DATABASE) {
        console.log("Database logging disabled - would have logged:", log);
        return;
      }
      logUpdateMutate(log);
    },
    [logUpdateMutate]
  );

  return {
    ingredients: ingredientsQuery.data || [],
    updateLog: updateLogQuery.data || [],
    isLoading: ingredientsQuery.isLoading,
    findIngredient,
    addIngredient,
    batchAddIngredients,
    logUpdate,
    isDatabaseEnabled: DATABASE_CONFIG.ENABLE_INGREDIENT_DATABASE,
  };
});
