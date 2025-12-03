import createContextHook from "@nkzw/create-context-hook";
import { useState, useEffect, useCallback, useMemo } from "react";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Profile } from "../types/profile";

const PROFILES_STORAGE_KEY = "@alphago_profiles";
const SELECTED_PROFILES_STORAGE_KEY = "@alphago_selected_profiles";

const isWeb = Platform.OS === "web";

const secureGetItem = async (key: string): Promise<string | null> => {
  try {
    if (isWeb) {
      return await AsyncStorage.getItem(key);
    }
    return await SecureStore.getItemAsync(key);
  } catch (error) {
    console.error(`[SecureStore] Failed to get ${key}:`, error);
    return null;
  }
};

const secureSetItem = async (key: string, value: string): Promise<void> => {
  try {
    if (isWeb) {
      await AsyncStorage.setItem(key, value);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  } catch (error) {
    console.error(`[SecureStore] Failed to set ${key}:`, error);
    throw error;
  }
};

const secureDeleteItem = async (key: string): Promise<void> => {
  try {
    if (isWeb) {
      await AsyncStorage.removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  } catch (error) {
    console.error(`[SecureStore] Failed to delete ${key}:`, error);
  }
};

export const [ProfileProvider, useProfiles] = createContextHook(() => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfileIds, setSelectedProfileIds] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const loadProfiles = async () => {
      try {
        console.log("[ProfileProvider] Loading profiles from secure storage...");
        const [storedProfiles, storedSelected] = await Promise.all([
          secureGetItem(PROFILES_STORAGE_KEY),
          secureGetItem(SELECTED_PROFILES_STORAGE_KEY),
        ]);

        if (!mounted) return;

        if (storedProfiles) {
          try {
            const parsed = JSON.parse(storedProfiles);
            setProfiles(parsed);
            console.log("[ProfileProvider] Loaded profiles:", parsed.length);
          } catch (parseError) {
            console.error("[ProfileProvider] Failed to parse profiles, resetting:", parseError);
            await secureDeleteItem(PROFILES_STORAGE_KEY);
          }
        }

        if (storedSelected) {
          try {
            const parsed = JSON.parse(storedSelected);
            setSelectedProfileIds(parsed);
            console.log("[ProfileProvider] Loaded selected profiles:", parsed.length);
          } catch (parseError) {
            console.error("[ProfileProvider] Failed to parse selected profiles, resetting:", parseError);
            await secureDeleteItem(SELECTED_PROFILES_STORAGE_KEY);
          }
        }

        if (mounted) {
          setIsLoaded(true);
          console.log("[ProfileProvider] Loading complete");
        }
      } catch (error) {
        console.error("[ProfileProvider] Failed to load profiles:", error);
        if (mounted) {
          setIsLoaded(true);
        }
      }
    };

    timeoutId = setTimeout(() => {
      console.warn("[ProfileProvider] Loading timeout - forcing app to load");
      if (mounted && !isLoaded) {
        setIsLoaded(true);
      }
    }, 3000);

    loadProfiles();

    return () => {
      mounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isLoaded]);

  const saveProfiles = useCallback(async (newProfiles: Profile[]) => {
    try {
      await secureSetItem(
        PROFILES_STORAGE_KEY,
        JSON.stringify(newProfiles)
      );
      setProfiles(newProfiles);
    } catch (error) {
      console.error("Failed to save profiles:", error);
    }
  }, []);

  const saveSelectedProfiles = useCallback(async (ids: string[]) => {
    try {
      await secureSetItem(
        SELECTED_PROFILES_STORAGE_KEY,
        JSON.stringify(ids)
      );
      setSelectedProfileIds(ids);
    } catch (error) {
      console.error("Failed to save selected profiles:", error);
    }
  }, []);

  const addProfile = useCallback(async (name: string, allergens: string[]) => {
    const newProfile: Profile = {
      id: Date.now().toString(),
      name,
      allergens,
      createdAt: Date.now(),
    };

    const updated = [...profiles, newProfile];
    await saveProfiles(updated);
  }, [profiles, saveProfiles]);

  const updateProfile = useCallback(async (id: string, name: string, allergens: string[]) => {
    const updated = profiles.map((p) =>
      p.id === id ? { ...p, name, allergens } : p
    );
    await saveProfiles(updated);
  }, [profiles, saveProfiles]);

  const deleteProfile = useCallback(async (id: string) => {
    const updated = profiles.filter((p) => p.id !== id);
    await saveProfiles(updated);

    if (selectedProfileIds.includes(id)) {
      const newSelected = selectedProfileIds.filter((pid) => pid !== id);
      await saveSelectedProfiles(newSelected);
    }
  }, [profiles, selectedProfileIds, saveProfiles, saveSelectedProfiles]);

  const setSelectedProfiles = useCallback(async (ids: string[]) => {
    await saveSelectedProfiles(ids);
  }, [saveSelectedProfiles]);

  const getCombinedAllergens = useCallback((): string[] => {
    const allergenSet = new Set<string>();
    
    selectedProfileIds.forEach((id) => {
      const profile = profiles.find((p) => p.id === id);
      if (profile) {
        profile.allergens.forEach((allergen) => allergenSet.add(allergen));
      }
    });

    return Array.from(allergenSet);
  }, [profiles, selectedProfileIds]);

  return useMemo(() => ({
    profiles,
    addProfile,
    updateProfile,
    deleteProfile,
    selectedProfileIds,
    setSelectedProfileIds: setSelectedProfiles,
    getCombinedAllergens,
    isLoaded,
  }), [profiles, addProfile, updateProfile, deleteProfile, selectedProfileIds, setSelectedProfiles, getCombinedAllergens, isLoaded]);
});
