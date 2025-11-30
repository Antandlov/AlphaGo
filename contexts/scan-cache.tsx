import createContextHook from "@nkzw/create-context-hook";
import { useState, useCallback } from "react";
import { ScanResult } from "../types/scan";

export const CACHE_SIZE = 50;

export const [ScanCacheProvider, useScanCache] = createContextHook(() => {
  const [cache, setCache] = useState<Map<string, ScanResult>>(new Map());

  const addToCache = useCallback((key: string, result: ScanResult) => {
    setCache((prev) => {
      const newCache = new Map(prev);
      
      if (newCache.size >= CACHE_SIZE) {
        const firstKey = newCache.keys().next().value as string | undefined;
        if (firstKey) {
          newCache.delete(firstKey);
        }
      }

      newCache.set(key, result);
      return newCache;
    });
  }, []);

  const getFromCache = useCallback((key: string): ScanResult | undefined => {
    return cache.get(key);
  }, [cache]);

  const clearCache = useCallback(() => {
    setCache(new Map());
  }, []);

  const getCacheSize = useCallback(() => {
    return cache.size;
  }, [cache]);

  return {
    addToCache,
    getFromCache,
    clearCache,
    getCacheSize,
  };
});
