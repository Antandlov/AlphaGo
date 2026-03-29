import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState, useEffect } from "react";
import { Language } from "../types/i18n";
import { TRANSLATIONS, TERMS_OF_SERVICE_TEXT } from "../constants/translations";

const LANGUAGE_STORAGE_KEY = "@alphago_language";
const TOS_ACCEPTED_STORAGE_KEY = "@alphago_tos_accepted";

export const [I18nContext, useI18n] = createContextHook(() => {
  const [language, setLanguage] = useState<Language | null>(null);
  const [tosAccepted, setTosAccepted] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      console.log("[I18n] Loading language and ToS settings...");
      const [storedLanguage, storedTosAccepted] = await Promise.all([
        AsyncStorage.getItem(LANGUAGE_STORAGE_KEY),
        AsyncStorage.getItem(TOS_ACCEPTED_STORAGE_KEY),
      ]);

      console.log("[I18n] Stored language:", storedLanguage);
      console.log("[I18n] Stored ToS accepted:", storedTosAccepted);

      if (storedLanguage) {
        setLanguage(storedLanguage as Language);
      } else {
        setLanguage(null);
      }
      if (storedTosAccepted === "true") {
        setTosAccepted(true);
      }
    } catch (error) {
      console.error("[I18n] Error loading settings:", error);
    } finally {
      setIsLoaded(true);
      console.log("[I18n] Settings loaded");
    }
  };

  const selectLanguage = async (lang: Language) => {
    console.log("[I18n] Selecting language:", lang);
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
      setLanguage(lang);
    } catch (error) {
      console.error("[I18n] Error saving language:", error);
    }
  };

  const acceptTos = async () => {
    console.log("[I18n] Accepting ToS");
    try {
      await AsyncStorage.setItem(TOS_ACCEPTED_STORAGE_KEY, "true");
      setTosAccepted(true);
    } catch (error) {
      console.error("[I18n] Error saving ToS acceptance:", error);
    }
  };

  const t = TRANSLATIONS[language || "en"];
  const tosText = TERMS_OF_SERVICE_TEXT[language || "en"];

  return {
    language,
    selectLanguage,
    tosAccepted,
    acceptTos,
    isLoaded,
    t,
    tosText,
  };
});
