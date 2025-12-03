import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { Profile } from "../types/profile";
import { ScanResult } from "../types/scan";

const isWeb = Platform.OS === "web";

const secureGetItem = async (key: string): Promise<string | null> => {
  try {
    if (isWeb) {
      return await AsyncStorage.getItem(key);
    }
    return await SecureStore.getItemAsync(key);
  } catch (error) {
    console.error(`[Migration] Failed to get ${key}:`, error);
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
    console.error(`[Migration] Failed to set ${key}:`, error);
    throw error;
  }
};

export const migrateProfileData = async (): Promise<void> => {
  try {
    console.log("[Migration] Starting profile data migration...");
    
    const profilesKey = "@alphago_profiles";
    const storedData = await secureGetItem(profilesKey);
    
    if (!storedData) {
      console.log("[Migration] No profile data to migrate");
      return;
    }

    const profiles = JSON.parse(storedData) as Profile[];
    let needsMigration = false;

    const migratedProfiles = profiles.map((profile) => {
      if (!profile.allergens || !Array.isArray(profile.allergens)) {
        console.log(`[Migration] Migrating profile ${profile.id}: fixing allergens array`);
        needsMigration = true;
        return {
          ...profile,
          allergens: [],
        };
      }
      
      if (!profile.createdAt) {
        console.log(`[Migration] Migrating profile ${profile.id}: adding createdAt`);
        needsMigration = true;
        return {
          ...profile,
          createdAt: Date.now(),
        };
      }

      return profile;
    });

    if (needsMigration) {
      console.log("[Migration] Saving migrated profile data...");
      await secureSetItem(profilesKey, JSON.stringify(migratedProfiles));
      console.log("[Migration] Profile migration completed successfully");
    } else {
      console.log("[Migration] No profile migration needed");
    }
  } catch (error) {
    console.error("[Migration] Profile migration failed:", error);
  }
};

export const migrateScanData = async (): Promise<void> => {
  try {
    console.log("[Migration] Starting scan data migration...");
    
    const scanKey = "alphago_scan_history";
    const storedData = await AsyncStorage.getItem(scanKey);
    
    if (!storedData) {
      console.log("[Migration] No scan data to migrate");
      return;
    }

    const scans = JSON.parse(storedData) as ScanResult[];
    let needsMigration = false;

    const migratedScans = scans.map((scan) => {
      let migrated = { ...scan };

      if (!scan.scannedForAllergens) {
        console.log(`[Migration] Migrating scan ${scan.id}: adding scannedForAllergens`);
        needsMigration = true;
        migrated.scannedForAllergens = [];
      }

      if (scan.ingredients) {
        const migratedIngredients = scan.ingredients.map((ingredient) => {
          let migratedIng = { ...ingredient };
          
          if (ingredient.isMammalBased && !ingredient.allergenIds) {
            console.log(`[Migration] Migrating ingredient ${ingredient.name}: adding allergenIds for mammal-based`);
            needsMigration = true;
            migratedIng.allergenIds = ["alpha-gal"];
            migratedIng.isAllergen = true;
          }

          if (typeof migratedIng.isAllergen === "undefined") {
            migratedIng.isAllergen = ingredient.isMammalBased || false;
            if (ingredient.isMammalBased) {
              needsMigration = true;
            }
          }

          return migratedIng;
        });

        migrated.ingredients = migratedIngredients;
      }

      return migrated;
    });

    if (needsMigration) {
      console.log("[Migration] Saving migrated scan data...");
      await AsyncStorage.setItem(scanKey, JSON.stringify(migratedScans));
      console.log("[Migration] Scan migration completed successfully");
    } else {
      console.log("[Migration] No scan migration needed");
    }
  } catch (error) {
    console.error("[Migration] Scan migration failed:", error);
  }
};

export const runAllMigrations = async (): Promise<void> => {
  console.log("[Migration] Running all data migrations...");
  await Promise.all([
    migrateProfileData(),
    migrateScanData(),
  ]);
  console.log("[Migration] All migrations completed");
};
