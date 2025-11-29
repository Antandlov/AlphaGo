import createContextHook from "@nkzw/create-context-hook";
import { useCallback, useEffect, useRef, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

type AnalyticsEvent = {
  event: string;
  properties?: Record<string, any>;
  timestamp: string;
  platform: string;
  sessionId: string;
};

type CrashReport = {
  error: string;
  stack?: string;
  timestamp: string;
  platform: string;
  sessionId: string;
  context?: Record<string, any>;
};

const STORAGE_KEYS = {
  SESSION_ID: "@analytics/session_id",
  EVENTS: "@analytics/events",
  CRASHES: "@analytics/crashes",
};

const generateSessionId = () => {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

export const [AnalyticsProvider, useAnalytics] = createContextHook(() => {
  const sessionIdRef = useRef<string>("");

  useEffect(() => {
    const initializeSession = async () => {
      const storedSessionId = await AsyncStorage.getItem(STORAGE_KEYS.SESSION_ID);
      if (!storedSessionId) {
        sessionIdRef.current = generateSessionId();
        await AsyncStorage.setItem(STORAGE_KEYS.SESSION_ID, sessionIdRef.current);
      } else {
        sessionIdRef.current = storedSessionId;
      }

      trackEvent("app_opened");
    };

    initializeSession();

    const handleErrors = (error: Error, isFatal: boolean) => {
      console.error("Global Error Handler:", error, "isFatal:", isFatal);
      reportCrash(error.message, error.stack, { isFatal });
    };

    const globalWithErrorUtils = global as any;
    if (globalWithErrorUtils.ErrorUtils) {
      const originalHandler = globalWithErrorUtils.ErrorUtils.getGlobalHandler();
      globalWithErrorUtils.ErrorUtils.setGlobalHandler((error: any, isFatal: any) => {
        handleErrors(error, isFatal ?? false);
        originalHandler?.(error, isFatal);
      });
    }
  }, []);

  const trackEvent = useCallback(async (event: string, properties?: Record<string, any>) => {
    try {
      const analyticsEvent: AnalyticsEvent = {
        event,
        properties,
        timestamp: new Date().toISOString(),
        platform: Platform.OS,
        sessionId: sessionIdRef.current || "unknown",
      };

      console.log("📊 Analytics Event:", analyticsEvent);

      const storedEvents = await AsyncStorage.getItem(STORAGE_KEYS.EVENTS);
      let events: AnalyticsEvent[] = [];
      if (storedEvents) {
        try {
          events = JSON.parse(storedEvents);
        } catch (parseError) {
          console.error("Failed to parse stored events, resetting:", parseError);
          await AsyncStorage.removeItem(STORAGE_KEYS.EVENTS);
        }
      }
      events.push(analyticsEvent);

      if (events.length > 100) {
        events.shift();
      }

      await AsyncStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
    } catch (error) {
      console.error("Failed to track event:", error);
    }
  }, []);

  const reportCrash = useCallback(
    async (error: string, stack?: string, context?: Record<string, any>) => {
      try {
        const crashReport: CrashReport = {
          error,
          stack,
          timestamp: new Date().toISOString(),
          platform: Platform.OS,
          sessionId: sessionIdRef.current || "unknown",
          context,
        };

        console.error("💥 Crash Report:", crashReport);

        const storedCrashes = await AsyncStorage.getItem(STORAGE_KEYS.CRASHES);
        let crashes: CrashReport[] = [];
        if (storedCrashes) {
          try {
            crashes = JSON.parse(storedCrashes);
          } catch (parseError) {
            console.error("Failed to parse stored crashes, resetting:", parseError);
            await AsyncStorage.removeItem(STORAGE_KEYS.CRASHES);
          }
        }
        crashes.push(crashReport);

        if (crashes.length > 50) {
          crashes.shift();
        }

        await AsyncStorage.setItem(STORAGE_KEYS.CRASHES, JSON.stringify(crashes));
      } catch (error) {
        console.error("Failed to report crash:", error);
      }
    },
    []
  );

  const getEvents = useCallback(async (): Promise<AnalyticsEvent[]> => {
    try {
      const storedEvents = await AsyncStorage.getItem(STORAGE_KEYS.EVENTS);
      if (!storedEvents) return [];
      try {
        return JSON.parse(storedEvents);
      } catch (parseError) {
        console.error("Failed to parse events, resetting:", parseError);
        await AsyncStorage.removeItem(STORAGE_KEYS.EVENTS);
        return [];
      }
    } catch (error) {
      console.error("Failed to get events:", error);
      return [];
    }
  }, []);

  const getCrashes = useCallback(async (): Promise<CrashReport[]> => {
    try {
      const storedCrashes = await AsyncStorage.getItem(STORAGE_KEYS.CRASHES);
      if (!storedCrashes) return [];
      try {
        return JSON.parse(storedCrashes);
      } catch (parseError) {
        console.error("Failed to parse crashes, resetting:", parseError);
        await AsyncStorage.removeItem(STORAGE_KEYS.CRASHES);
        return [];
      }
    } catch (error) {
      console.error("Failed to get crashes:", error);
      return [];
    }
  }, []);

  const clearEvents = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.EVENTS);
    } catch (error) {
      console.error("Failed to clear events:", error);
    }
  }, []);

  const clearCrashes = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.CRASHES);
    } catch (error) {
      console.error("Failed to clear crashes:", error);
    }
  }, []);

  return useMemo(() => ({
    trackEvent,
    reportCrash,
    getEvents,
    getCrashes,
    clearEvents,
    clearCrashes,
    sessionId: sessionIdRef.current,
  }), [trackEvent, reportCrash, getEvents, getCrashes, clearEvents, clearCrashes]);
});
