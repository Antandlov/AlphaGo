import createContextHook from "@nkzw/create-context-hook";
import { useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ShoppingListItem } from "../types/shopping-list";

const SHOPPING_LIST_STORAGE_KEY = "@alphago_shopping_list";

export const [ShoppingListProvider, useShoppingList] = createContextHook(() => {
  const queryClient = useQueryClient();

  const shoppingListQuery = useQuery({
    queryKey: ["shopping-list"],
    queryFn: async () => {
      try {
        const stored = await AsyncStorage.getItem(SHOPPING_LIST_STORAGE_KEY);
        if (!stored) return [];
        try {
          return JSON.parse(stored) as ShoppingListItem[];
        } catch (parseError) {
          console.error("[ShoppingList] Failed to parse, resetting:", parseError);
          await AsyncStorage.removeItem(SHOPPING_LIST_STORAGE_KEY);
          return [];
        }
      } catch (error) {
        console.error("[ShoppingList] Failed to load:", error);
        return [];
      }
    },
  });

  const addMutation = useMutation({
    mutationFn: async (item: ShoppingListItem) => {
      const current = shoppingListQuery.data || [];
      const updated = [item, ...current];
      await AsyncStorage.setItem(SHOPPING_LIST_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(["shopping-list"], updated);
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const current = shoppingListQuery.data || [];
      const updated = current.filter((item) => item.id !== itemId);
      await AsyncStorage.setItem(SHOPPING_LIST_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(["shopping-list"], updated);
    },
  });

  const clearMutation = useMutation({
    mutationFn: async () => {
      await AsyncStorage.removeItem(SHOPPING_LIST_STORAGE_KEY);
      return [];
    },
    onSuccess: () => {
      queryClient.setQueryData(["shopping-list"], []);
    },
  });

  const { mutate: addItemMutation } = addMutation;
  const { mutate: removeItemMutation } = removeMutation;
  const { mutate: clearListMutation } = clearMutation;

  const addItem = useCallback(
    (item: ShoppingListItem) => {
      addItemMutation(item);
    },
    [addItemMutation]
  );

  const removeItem = useCallback(
    (itemId: string) => {
      removeItemMutation(itemId);
    },
    [removeItemMutation]
  );

  const clearList = useCallback(() => {
    clearListMutation();
  }, [clearListMutation]);

  const isInList = useCallback(
    (productName: string): boolean => {
      const list = shoppingListQuery.data || [];
      return list.some(
        (item) => item.productName.toLowerCase() === productName.toLowerCase()
      );
    },
    [shoppingListQuery.data]
  );

  return {
    list: shoppingListQuery.data || [],
    isLoading: shoppingListQuery.isLoading,
    addItem,
    removeItem,
    clearList,
    isInList,
  };
});
