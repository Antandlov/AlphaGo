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
    const MAX_RETRIES = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(`[ProfileProvider] Saving profiles to storage (attempt ${attempt}/${MAX_RETRIES}):`, newProfiles.length);
        
        if (newProfiles.length === 0) {
          console.warn("[ProfileProvider] Warning: Attempting to save empty profiles array");
        }
        
        const serialized = JSON.stringify(newProfiles);
        console.log("[ProfileProvider] Serialized data length:", serialized.length);
        
        if (serialized.length > 1024 * 1024) {
          throw new Error("Profile data too large. Please reduce the number of profiles or custom allergens.");
        }
        
        await secureSetItem(
          PROFILES_STORAGE_KEY,
          serialized
        );
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const verification = await secureGetItem(PROFILES_STORAGE_KEY);
        if (!verification) {
          throw new Error("Failed to verify saved data - storage returned null");
        }
        
        const verifiedProfiles = JSON.parse(verification);
        if (verifiedProfiles.length !== newProfiles.length) {
          throw new Error(`Verification failed: Expected ${newProfiles.length} profiles but found ${verifiedProfiles.length}`);
        }
        
        setProfiles(newProfiles);
        console.log("[ProfileProvider] Profiles saved and verified successfully");
        return;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`[ProfileProvider] Save attempt ${attempt}/${MAX_RETRIES} failed:`, error);
        
        if (attempt < MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, 200 * attempt));
        }
      }
    }
    
    console.error("[ProfileProvider] All save attempts failed");
    if (lastError instanceof Error) {
      console.error("[ProfileProvider] Final error:", lastError.message, lastError.stack);
    }
    throw new Error("Failed to save profile after multiple attempts. Please check your device storage and try again.");
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
      
      if (!name || name.trim().length === 0) {
        throw new Error("Profile name cannot be empty");
      }
      
      if (!allergens || allergens.length === 0) {
        throw new Error("At least one allergen must be selected");
      }
      
      const trimmedName = name.trim();
      const existingProfile = profiles.find(p => p.name.toLowerCase() === trimmedName.toLowerCase());
      if (existingProfile) {
        throw new Error(`A profile with the name "${trimmedName}" already exists`);
      }
      
      const newProfile: Profile = {
        id: Date.now().toString(),
        name: trimmedName,
        allergens,
        createdAt: Date.now(),
      };

      const updated = [...profiles, newProfile];
      await saveProfiles(updated);
      console.log("[ProfileProvider] Profile added successfully, total profiles:", updated.length);
      
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
