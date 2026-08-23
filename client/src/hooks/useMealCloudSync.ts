import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { MealLog, calculateDailySummary, readMealLogs } from "@/lib/mealHistoryService";
import { calculateTotalCarbonFootprint } from "@/lib/mealFootprint";
import { useCallback, useEffect, useMemo, useRef } from "react";

export type CloudLog = {
  id: number;
  clientLogId: string;
  mealSlug: string;
  mealName: string;
  carbonHundredths: number;
  servings: number;
  category: "Vegetarian" | "Non Vegetarian";
  entryMethod: "camera" | "manual" | "custom";
  localDate: string;
  loggedAt: Date;
};

export function toCloudLog(log: MealLog) {
  return {
    clientLogId: log.id,
    mealSlug: log.mealId,
    mealName: log.mealName,
    carbonHundredths: Math.round(log.carbonFootprintPerServing * 100),
    servings: log.servings,
    category: log.category,
    entryMethod: log.entryMethod,
    localDate: log.localDate,
    loggedAt: new Date(log.loggedAt),
  };
}

export function fromCloudLog(log: CloudLog): MealLog {
  const carbonFootprintPerServing = log.carbonHundredths / 100;
  return {
    id: String(log.id),
    mealId: log.mealSlug,
    mealName: log.mealName,
    carbonFootprintPerServing,
    servings: log.servings,
    totalCarbonFootprint: calculateTotalCarbonFootprint(carbonFootprintPerServing, log.servings),
    loggedAt: new Date(log.loggedAt).toISOString(),
    localDate: log.localDate,
    category: log.category,
    entryMethod: log.entryMethod,
  };
}

export function shouldStartLocalImport(isAuthenticated: boolean, hasStarted: boolean, isPending: boolean): boolean {
  return isAuthenticated && !hasStarted && !isPending;
}

export function resolveHistoryLogs(isAuthenticated: boolean, localLogs: MealLog[], cloudLogs: CloudLog[] | undefined): MealLog[] {
  if (!isAuthenticated) return localLogs;
  return (cloudLogs ?? []).map(fromCloudLog);
}

export function useMealCloudSync() {
  const auth = useAuth();
  const utils = trpc.useUtils();
  const localImportStarted = useRef(false);
  const cloudHistory = trpc.mealHistory.list.useQuery(undefined, { enabled: auth.isAuthenticated });
  const invalidateMealInsights = () => {
    utils.mealHistory.list.invalidate();
    utils.mealHistory.topFive.invalidate();
  };
  const upsert = trpc.mealHistory.upsert.useMutation({ onSuccess: invalidateMealInsights });
  const importLogs = trpc.mealHistory.import.useMutation({ onSuccess: invalidateMealInsights });
  const updateServings = trpc.mealHistory.updateServings.useMutation({ onSuccess: invalidateMealInsights });
  const deleteLog = trpc.mealHistory.delete.useMutation({ onSuccess: invalidateMealInsights });
  const clearDate = trpc.mealHistory.clearDate.useMutation({ onSuccess: invalidateMealInsights });

  useEffect(() => {
    if (!shouldStartLocalImport(auth.isAuthenticated, localImportStarted.current, importLogs.isPending)) return;
    localImportStarted.current = true;
    const localLogs = readMealLogs();
    if (localLogs.length > 0) importLogs.mutate(localLogs.map(toCloudLog));
  }, [auth.isAuthenticated, importLogs]);

  const logs = useMemo(
    () => resolveHistoryLogs(auth.isAuthenticated, readMealLogs(), cloudHistory.data as CloudLog[] | undefined),
    [auth.isAuthenticated, cloudHistory.data],
  );

  const syncLog = useCallback((log: MealLog) => {
    if (auth.isAuthenticated) upsert.mutate(toCloudLog(log));
  }, [auth.isAuthenticated, upsert]);

  return {
    ...auth,
    logs,
    historyLoading: auth.isAuthenticated && cloudHistory.isLoading,
    historyError: cloudHistory.error,
    cloudSyncing: upsert.isPending || importLogs.isPending || updateServings.isPending || deleteLog.isPending || clearDate.isPending,
    syncLog,
    updateCloudServings: updateServings.mutate,
    deleteCloudLog: deleteLog.mutate,
    clearCloudDate: clearDate.mutate,
    dailySummary: calculateDailySummary,
  };
}
