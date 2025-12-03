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
      console.log("[ProfileProvider] Saving profiles to storage:", newProfiles.length);
      const serialized = JSON.stringify(newProfiles);
      console.log("[ProfileProvider] Serialized data length:", serialized.length);
      
      await secureSetItem(
        PROFILES_STORAGE_KEY,
        serialized
      );
      
      setProfiles(newProfiles);
      console.log("[ProfileProvider] Profiles saved successfully");
    } catch (error) {
      console.error("[ProfileProvider] Failed to save profiles:", error);
      if (error instanceof Error) {
        console.error("[ProfileProvider] Error details:", error.message, error.stack);
      }
      throw new Error("Failed to save profile to device storage. Please check if you have enough storage space.");
    }
  }, []);

  const saveSelectedProfiles = useCallback(async (ids: string[]) => {
    try {
      console.log("[ProfileProvider] Saving selected profiles:", ids.length);
      await secureSetItem(
        SELECTED_PROFILES_STORAGE_KEY,
        JSON.stringify(ids)
      );
      setSelectedProfileIds(ids);
      console.log("[ProfileProvider] Selected profiles saved successfully");
    } catch (error) {
      console.error("[ProfileProvider] Failed to save selected profiles:", error);
      throw error;
    }
  }, []);

  const addProfile = useCallback(async (name: string, allergens: string[]) => {
    try {
      console.log("[ProfileProvider] Adding new profile:", { name, allergens });
      const newProfile: Profile = {
        id: Date.now().toString(),
        name,
        allergens,
        createdAt: Date.now(),
      };

      const updated = [...profiles, newProfile];
      await saveProfiles(updated);
      console.log("[ProfileProvider] Profile added successfully, total profiles:", updated.length);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const verified = await secureGetItem(PROFILES_STORAGE_KEY);
      if (verified) {
        const verifiedProfiles = JSON.parse(verified);
        console.log("[ProfileProvider] Verified saved profiles count:", verifiedProfiles.length);
      }
      
      return newProfile;
    } catch (error) {
      console.error("[ProfileProvider] Failed to add profile:", error);
      throw error;
    }
  }, [profiles, saveProfiles]);

  const updateProfile = useCallback(async (id: string, name: string, allergens: string[]) => {
    try {
      console.log("[ProfileProvider] Updating profile:", { id, name, allergens });
      const updated = profiles.map((p) =>
        p.id === id ? { ...p, name, allergens } : p
      );
      await saveProfiles(updated);
      console.log("[ProfileProvider] Profile updated successfully");
    } catch (error) {
      console.error("[ProfileProvider] Failed to update profile:", error);
      throw error;
    }
  }, [profiles, saveProfiles]);

  const deleteProfile = useCallback(async (id: string) => {
    try {
      console.log("[ProfileProvider] Deleting profile:", id);
      const updated = profiles.filter((p) => p.id !== id);
      await saveProfiles(updated);

      if (selectedProfileIds.includes(id)) {
        const newSelected = selectedProfileIds.filter((pid) => pid !== id);
        await saveSelectedProfiles(newSelected);
      }
      console.log("[ProfileProvider] Profile deleted successfully");
    } catch (error) {
      console.error("[ProfileProvider] Failed to delete profile:", error);
      throw error;
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
