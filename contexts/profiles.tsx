import createContextHook from "@nkzw/create-context-hook";
import { useState, useEffect, useCallback, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Profile } from "../types/profile";

const PROFILES_STORAGE_KEY = "@alphago_profiles";
const SELECTED_PROFILES_STORAGE_KEY = "@alphago_selected_profiles";

export const [ProfileProvider, useProfiles] = createContextHook(() => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfileIds, setSelectedProfileIds] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const loadProfiles = async () => {
      try {
        console.log("[ProfileProvider] Loading profiles...");
        const [storedProfiles, storedSelected] = await Promise.all([
          AsyncStorage.getItem(PROFILES_STORAGE_KEY),
          AsyncStorage.getItem(SELECTED_PROFILES_STORAGE_KEY),
        ]);

        if (!mounted) return;

        if (storedProfiles) {
          try {
            const parsed = JSON.parse(storedProfiles);
            setProfiles(parsed);
            console.log("[ProfileProvider] Loaded profiles:", parsed.length);
          } catch (parseError) {
            console.error("[ProfileProvider] Failed to parse profiles, resetting:", parseError);
            await AsyncStorage.removeItem(PROFILES_STORAGE_KEY);
          }
        }

        if (storedSelected) {
          try {
            const parsed = JSON.parse(storedSelected);
            setSelectedProfileIds(parsed);
            console.log("[ProfileProvider] Loaded selected profiles:", parsed.length);
          } catch (parseError) {
            console.error("[ProfileProvider] Failed to parse selected profiles, resetting:", parseError);
            await AsyncStorage.removeItem(SELECTED_PROFILES_STORAGE_KEY);
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
      await AsyncStorage.setItem(
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
      await AsyncStorage.setItem(
        SELECTED_PROFILES_STORAGE_KEY,
        JSON.stringify(ids)
      );
      setSelectedProfileIds(ids);
    } catch (error) {
      console.error("Failed to save selected profiles:", error);
    }
  }, []);

  const addProfile = useCallback((name: string, allergens: string[]) => {
    const newProfile: Profile = {
      id: Date.now().toString(),
      name,
      allergens,
      createdAt: Date.now(),
    };

    const updated = [...profiles, newProfile];
    saveProfiles(updated);
  }, [profiles, saveProfiles]);

  const updateProfile = useCallback((id: string, name: string, allergens: string[]) => {
    const updated = profiles.map((p) =>
      p.id === id ? { ...p, name, allergens } : p
    );
    saveProfiles(updated);
  }, [profiles, saveProfiles]);

  const deleteProfile = useCallback((id: string) => {
    const updated = profiles.filter((p) => p.id !== id);
    saveProfiles(updated);

    if (selectedProfileIds.includes(id)) {
      const newSelected = selectedProfileIds.filter((pid) => pid !== id);
      saveSelectedProfiles(newSelected);
    }
  }, [profiles, selectedProfileIds, saveProfiles, saveSelectedProfiles]);

  const setSelectedProfiles = useCallback((ids: string[]) => {
    saveSelectedProfiles(ids);
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
