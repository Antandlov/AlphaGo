import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { ScanResult } from "../types/scan";

const STORAGE_KEY = "alphago_scan_history";

export const [ScanHistoryProvider, useScanHistory] = createContextHook(() => {
  const queryClient = useQueryClient();

  const historyQuery = useQuery({
    queryKey: ["scan-history"],
    queryFn: async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (!stored) return [];
        try {
          return JSON.parse(stored) as ScanResult[];
        } catch (parseError) {
          console.error("Failed to parse scan history, resetting:", parseError);
          await AsyncStorage.removeItem(STORAGE_KEY);
          return [];
        }
      } catch (error) {
        console.error("Failed to load scan history:", error);
        return [];
      }
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (newScan: ScanResult) => {
      const current = historyQuery.data || [];
      const updated = [newScan, ...current].slice(0, 50);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(["scan-history"], updated);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (scanId: string) => {
      const current = historyQuery.data || [];
      const updated = current.filter((scan) => scan.id !== scanId);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(["scan-history"], updated);
    },
  });

  const clearMutation = useMutation({
    mutationFn: async () => {
      await AsyncStorage.removeItem(STORAGE_KEY);
      return [];
    },
    onSuccess: () => {
      queryClient.setQueryData(["scan-history"], []);
    },
  });

  const { mutate: addScanMutation } = saveMutation;
  const { mutate: deleteScanMutation } = deleteMutation;
  const { mutate: clearHistoryMutation } = clearMutation;

  const addScan = useCallback(
    (scan: ScanResult) => {
      addScanMutation(scan);
    },
    [addScanMutation]
  );

  const deleteScan = useCallback(
    (scanId: string) => {
      deleteScanMutation(scanId);
    },
    [deleteScanMutation]
  );

  const clearHistory = useCallback(() => {
    clearHistoryMutation();
  }, [clearHistoryMutation]);

  return {
    history: historyQuery.data || [],
    isLoading: historyQuery.isLoading,
    addScan,
    deleteScan,
    clearHistory,
  };
});
