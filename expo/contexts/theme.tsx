import createContextHook from "@nkzw/create-context-hook";
import { useState, useCallback, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColorScheme } from "react-native";

export type ThemeMode = "light" | "dark" | "system";
export type AccessibilityMode = "default" | "high-contrast";

const THEME_STORAGE_KEY = "@alphago_theme";
const ACCESSIBILITY_STORAGE_KEY = "@alphago_accessibility";

export interface Theme {
  background: string;
  surface: string;
  primary: string;
  primaryDark: string;
  secondary: string;
  text: string;
  textSecondary: string;
  border: string;
  error: string;
  warning: string;
  success: string;
  safeBackground: string;
  cautionBackground: string;
  unsafeBackground: string;
}

const lightTheme: Theme = {
  background: "#f0fdf4",
  surface: "#ffffff",
  primary: "#10b981",
  primaryDark: "#065f46",
  secondary: "#d1fae5",
  text: "#1f2937",
  textSecondary: "#6b7280",
  border: "#d1fae5",
  error: "#ef4444",
  warning: "#f59e0b",
  success: "#10b981",
  safeBackground: "#f0fdf4",
  cautionBackground: "#fffbeb",
  unsafeBackground: "#fef2f2",
};

const darkTheme: Theme = {
  background: "#0f172a",
  surface: "#1e293b",
  primary: "#10b981",
  primaryDark: "#065f46",
  secondary: "#334155",
  text: "#f1f5f9",
  textSecondary: "#cbd5e1",
  border: "#334155",
  error: "#ef4444",
  warning: "#f59e0b",
  success: "#10b981",
  safeBackground: "#064e3b",
  cautionBackground: "#78350f",
  unsafeBackground: "#7f1d1d",
};

const highContrastLightTheme: Theme = {
  background: "#ffffff",
  surface: "#ffffff",
  primary: "#000000",
  primaryDark: "#000000",
  secondary: "#f0f0f0",
  text: "#000000",
  textSecondary: "#333333",
  border: "#000000",
  error: "#cc0000",
  warning: "#ff8800",
  success: "#008800",
  safeBackground: "#e6ffe6",
  cautionBackground: "#fff4cc",
  unsafeBackground: "#ffe6e6",
};

const highContrastDarkTheme: Theme = {
  background: "#000000",
  surface: "#000000",
  primary: "#ffffff",
  primaryDark: "#ffffff",
  secondary: "#333333",
  text: "#ffffff",
  textSecondary: "#cccccc",
  border: "#ffffff",
  error: "#ff3333",
  warning: "#ffaa00",
  success: "#00ff00",
  safeBackground: "#003300",
  cautionBackground: "#663300",
  unsafeBackground: "#330000",
};

export const [ThemeProvider, useTheme] = createContextHook(() => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState<ThemeMode>("light");
  const [accessibilityMode, setAccessibilityMode] = useState<AccessibilityMode>("default");

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [storedTheme, storedAccessibility] = await Promise.all([
          AsyncStorage.getItem(THEME_STORAGE_KEY),
          AsyncStorage.getItem(ACCESSIBILITY_STORAGE_KEY),
        ]);

        if (storedTheme) {
          setThemeMode(storedTheme as ThemeMode);
        }
        if (storedAccessibility) {
          setAccessibilityMode(storedAccessibility as AccessibilityMode);
        }
      } catch (error) {
        console.error("[Theme] Failed to load settings:", error);
      }
    };

    loadSettings();
  }, []);

  const setTheme = useCallback(async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
      setThemeMode(mode);
    } catch (error) {
      console.error("[Theme] Failed to save theme:", error);
    }
  }, []);

  const setAccessibility = useCallback(async (mode: AccessibilityMode) => {
    try {
      await AsyncStorage.setItem(ACCESSIBILITY_STORAGE_KEY, mode);
      setAccessibilityMode(mode);
    } catch (error) {
      console.error("[Theme] Failed to save accessibility:", error);
    }
  }, []);

  const getActiveTheme = useCallback((): Theme => {
    const isDark = themeMode === "dark" || (themeMode === "system" && systemColorScheme === "dark");
    const isHighContrast = accessibilityMode === "high-contrast";

    if (isHighContrast) {
      return isDark ? highContrastDarkTheme : highContrastLightTheme;
    }

    return isDark ? darkTheme : lightTheme;
  }, [themeMode, systemColorScheme, accessibilityMode]);

  const isDarkMode = useCallback((): boolean => {
    return themeMode === "dark" || (themeMode === "system" && systemColorScheme === "dark");
  }, [themeMode, systemColorScheme]);

  return {
    themeMode,
    accessibilityMode,
    setTheme,
    setAccessibility,
    theme: getActiveTheme(),
    isDarkMode: isDarkMode(),
  };
});
